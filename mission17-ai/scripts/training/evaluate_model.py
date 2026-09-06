"""Reproducibly evaluate the saved Mission17 model on a held-out dataset."""

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import tensorflow as tf
from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
    precision_score,
    recall_score,
    f1_score,
)
from tensorflow.keras.applications.efficientnet import preprocess_input


AI_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET = AI_ROOT.parent / 'dataset' / 'mission_dataset_split' / 'test'
DEFAULT_TRAINING_DATASET = AI_ROOT.parent / 'dataset' / 'mission_dataset_split' / 'train'
SUPPORTED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def dataset_manifest_hash(dataset_path):
    digest = hashlib.sha256()
    files = sorted(path for path in dataset_path.rglob('*') if path.is_file())
    for path in files:
        relative = path.relative_to(dataset_path).as_posix()
        digest.update(f'{relative}\0{path.stat().st_size}\n'.encode('utf-8'))
    return digest.hexdigest(), len(files)


def file_hashes(dataset_path):
    hashes = {}
    for path in sorted(candidate for candidate in dataset_path.rglob('*') if candidate.is_file()):
        hashes[path] = sha256_file(path)
    return hashes


def load_labels(path):
    labels = [line.strip() for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]
    if not labels:
        raise ValueError('labels.txt is empty.')
    return labels


def discover_samples(dataset_path, labels):
    unexpected_directories = sorted(
        path.name for path in dataset_path.iterdir()
        if path.is_dir() and path.name not in labels
    )
    if unexpected_directories:
        raise ValueError(f'Unexpected class directories: {unexpected_directories}')

    samples = []
    distribution = {}
    for class_index, label in enumerate(labels):
        class_path = dataset_path / label
        if not class_path.is_dir():
            raise FileNotFoundError(f'Missing class directory: {class_path}')
        class_files = sorted(
            path for path in class_path.rglob('*')
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
        )
        distribution[label] = len(class_files)
        samples.extend((path, class_index) for path in class_files)
    return samples, distribution


def predict_samples(model, samples, batch_size):
    predictions = []
    actual = []
    for start in range(0, len(samples), batch_size):
        batch_records = samples[start:start + batch_size]
        batch_images = []
        for image_path, class_index in batch_records:
            try:
                with Image.open(image_path) as image:
                    image = image.convert('RGB').resize((224, 224), Image.Resampling.LANCZOS)
                    batch_images.append(np.asarray(image, dtype=np.float32))
            except Exception as error:
                raise ValueError(f'Could not decode test image: {image_path}') from error
            actual.append(class_index)
        batch = preprocess_input(np.stack(batch_images, axis=0))
        probabilities = model.predict(batch, verbose=0)
        predictions.extend(np.argmax(probabilities, axis=1).tolist())
    return np.asarray(actual), np.asarray(predictions)


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dataset', type=Path, default=DEFAULT_DATASET)
    parser.add_argument('--training-dataset', type=Path, default=DEFAULT_TRAINING_DATASET)
    parser.add_argument('--dataset-version', required=True, help='Human-readable immutable dataset version.')
    parser.add_argument('--model', type=Path, default=AI_ROOT / 'mission_model.h5')
    parser.add_argument('--labels', type=Path, default=AI_ROOT / 'labels.txt')
    parser.add_argument('--output-dir', type=Path, default=AI_ROOT / 'outputs')
    parser.add_argument('--batch-size', type=int, default=32)
    return parser.parse_args()


def main():
    args = parse_args()
    dataset_path = args.dataset.resolve()
    if not dataset_path.is_dir():
        raise FileNotFoundError(f'Held-out dataset not found: {dataset_path}')
    if args.batch_size < 1:
        raise ValueError('Batch size must be positive.')

    labels = load_labels(args.labels)
    model = tf.keras.models.load_model(args.model)
    model_output_count = int(model.output_shape[-1])
    if model_output_count != len(labels):
        raise ValueError(
            f'Model output count ({model_output_count}) does not match label count ({len(labels)}).'
        )

    samples, class_distribution = discover_samples(dataset_path, labels)
    if not samples:
        raise ValueError('Held-out dataset contains no supported images.')

    actual, predicted = predict_samples(model, samples, args.batch_size)
    matrix = confusion_matrix(actual, predicted, labels=list(range(len(labels))))
    per_precision, per_recall, per_f1, per_support = precision_recall_fscore_support(
        actual,
        predicted,
        labels=list(range(len(labels))),
        zero_division=0,
    )
    manifest_hash, manifest_files = dataset_manifest_hash(dataset_path)
    training_path = args.training_dataset.resolve()
    if not training_path.is_dir():
        raise FileNotFoundError(f'Training dataset not found: {training_path}')
    training_hashes = set(file_hashes(training_path).values())
    evaluation_hashes = file_hashes(dataset_path)
    exact_overlap_count = sum(
        1 for content_hash in evaluation_hashes.values() if content_hash in training_hashes
    )

    per_class = {
        label: {
            'precision': float(per_precision[index]),
            'recall': float(per_recall[index]),
            'f1': float(per_f1[index]),
            'support': int(per_support[index]),
        }
        for index, label in enumerate(labels)
    }
    report = {
        'evaluatedAtUtc': datetime.now(timezone.utc).isoformat(),
        'dataset': {
            'version': args.dataset_version,
            'path': str(dataset_path),
            'manifestSha256': manifest_hash,
            'manifestFileCount': manifest_files,
            'evaluatedSampleCount': len(samples),
            'excludedFileCount': manifest_files - len(samples),
            'classDistribution': class_distribution,
            'leakageAudit': {
                'trainingPath': str(training_path),
                'exactCrossSplitDuplicateCount': exact_overlap_count,
                'validForPublication': exact_overlap_count == 0,
                'limitation': (
                    'Exact duplicate audit passed; near-duplicate and source-provenance review are still required.'
                    if exact_overlap_count == 0
                    else 'Evaluation is invalid for publication because test files also occur in training data.'
                ),
            },
        },
        'model': {
            'file': args.model.name,
            'sha256': sha256_file(args.model),
            'outputCount': model_output_count,
            'labelOrder': labels,
        },
        'metrics': {
            'accuracy': float(accuracy_score(actual, predicted)),
            'weightedPrecision': float(precision_score(actual, predicted, average='weighted', zero_division=0)),
            'weightedRecall': float(recall_score(actual, predicted, average='weighted', zero_division=0)),
            'weightedF1': float(f1_score(actual, predicted, average='weighted', zero_division=0)),
            'perClass': per_class,
            'confusionMatrix': matrix.tolist(),
        },
    }

    args.output_dir.mkdir(parents=True, exist_ok=True)
    metrics_path = args.output_dir / 'evaluation_metrics.json'
    metrics_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding='utf-8')

    plt.figure(figsize=(12, 10))
    sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.title(f'Mission17 AI confusion matrix — {args.dataset_version}')
    plt.ylabel('Actual class')
    plt.xlabel('Predicted class')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    chart_path = args.output_dir / 'confusion_matrix.png'
    plt.savefig(chart_path, dpi=180)
    plt.close()

    summary = {
        'metricsFile': str(metrics_path),
        'confusionMatrixFile': str(chart_path),
        'samples': report['dataset']['evaluatedSampleCount'],
        'accuracy': report['metrics']['accuracy'],
        'weightedPrecision': report['metrics']['weightedPrecision'],
        'weightedRecall': report['metrics']['weightedRecall'],
        'weightedF1': report['metrics']['weightedF1'],
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
