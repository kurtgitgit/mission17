"""Create a deterministic, exact-duplicate-safe train/test image split."""

import argparse
import hashlib
import json
import random
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


AI_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = AI_ROOT.parent / 'dataset' / 'mission_dataset'
SUPPORTED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--dataset-version', required=True)
    parser.add_argument('--train-ratio', type=float, default=0.8)
    parser.add_argument('--seed', type=int, default=17017)
    return parser.parse_args()


def scan_unique_images(source):
    by_class = defaultdict(list)
    hash_labels = defaultdict(set)
    duplicate_count = 0
    seen_hashes = set()

    for class_path in sorted(path for path in source.iterdir() if path.is_dir()):
        for image_path in sorted(class_path.rglob('*')):
            if not image_path.is_file() or image_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                continue
            content_hash = sha256_file(image_path)
            hash_labels[content_hash].add(class_path.name)
            if content_hash in seen_hashes:
                duplicate_count += 1
                continue
            seen_hashes.add(content_hash)
            by_class[class_path.name].append((image_path, content_hash))

    conflicts = {
        content_hash: sorted(labels)
        for content_hash, labels in hash_labels.items()
        if len(labels) > 1
    }
    if conflicts:
        raise ValueError(
            f'{len(conflicts)} byte-identical images have conflicting class labels; fix them before splitting.'
        )
    return by_class, duplicate_count


def main():
    args = parse_args()
    source = args.source.resolve()
    output = args.output.resolve()
    if not source.is_dir():
        raise FileNotFoundError(f'Source dataset not found: {source}')
    if output.exists():
        raise FileExistsError(f'Output already exists; choose a new versioned directory: {output}')
    if not 0.5 <= args.train_ratio < 1:
        raise ValueError('Train ratio must be at least 0.5 and less than 1.0.')

    by_class, duplicate_count = scan_unique_images(source)
    if not by_class:
        raise ValueError('No supported source images were found.')

    rng = random.Random(args.seed)
    manifest = {
        'datasetVersion': args.dataset_version,
        'createdAtUtc': datetime.now(timezone.utc).isoformat(),
        'source': str(source),
        'output': str(output),
        'seed': args.seed,
        'trainRatio': args.train_ratio,
        'exactDuplicatesRemoved': duplicate_count,
        'classes': {},
    }

    copy_plan = []
    for class_name in sorted(by_class):
        records = list(by_class[class_name])
        rng.shuffle(records)
        split_index = int(len(records) * args.train_ratio)
        train_records = records[:split_index]
        test_records = records[split_index:]
        if not train_records or not test_records:
            raise ValueError(f'Class {class_name} does not have enough unique images for both splits.')
        manifest['classes'][class_name] = {
            'uniqueSourceImages': len(records),
            'trainImages': len(train_records),
            'testImages': len(test_records),
        }
        copy_plan.extend(('train', class_name, *record) for record in train_records)
        copy_plan.extend(('test', class_name, *record) for record in test_records)

    for split_name, class_name, source_path, content_hash in copy_plan:
        destination_directory = output / split_name / class_name
        destination_directory.mkdir(parents=True, exist_ok=True)
        destination_name = f'{content_hash[:12]}-{source_path.name}'
        shutil.copy2(source_path, destination_directory / destination_name)

    train_hashes = {record[3] for record in copy_plan if record[0] == 'train'}
    test_hashes = {record[3] for record in copy_plan if record[0] == 'test'}
    overlap = train_hashes.intersection(test_hashes)
    if overlap:
        raise RuntimeError('Internal error: exact hashes overlap between generated splits.')

    manifest['totals'] = {
        'trainImages': len(train_hashes),
        'testImages': len(test_hashes),
        'exactCrossSplitDuplicates': 0,
    }
    (output / 'dataset_manifest.json').write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding='utf-8',
    )
    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
