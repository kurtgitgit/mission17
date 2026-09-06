"""Validate legacy hashes and backfill MongoDB anti-cheat records safely.

The command is dry-run only unless ``--apply`` is supplied. It never removes
the SQLite or JSON sources.
"""

import argparse
import json
import sqlite3
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from pymongo import MongoClient
from pymongo.errors import PyMongoError

AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ROOT))

from utils.anticheat import AntiCheatEngine, AntiCheatUnavailable  # noqa: E402


def read_json_hashes(path):
    if not path.exists():
        return []
    with path.open('r', encoding='utf-8') as source:
        payload = json.load(source)
    values = payload.get('hashes', []) if isinstance(payload, dict) else []
    return values if isinstance(values, list) else []


def read_sqlite_hashes(path):
    if not path.exists():
        return []
    connection = None
    try:
        connection = sqlite3.connect(f'file:{path.as_posix()}?mode=ro', uri=True)
        return [row[0] for row in connection.execute('SELECT hash_str FROM hashes')]
    except sqlite3.Error as error:
        raise RuntimeError(f'Could not read legacy SQLite database: {error}') from error
    finally:
        if connection is not None:
            connection.close()


def validated_legacy_hashes(sqlite_path, json_path):
    raw_by_source = {
        'sqlite': read_sqlite_hashes(sqlite_path),
        'json': read_json_hashes(json_path),
    }
    valid = set()
    counts = Counter()
    for source_name, values in raw_by_source.items():
        counts[f'{source_name}_read'] = len(values)
        for value in values:
            normalized = AntiCheatEngine.normalize_hash(value)
            if normalized:
                valid.add(normalized)
                counts[f'{source_name}_valid'] += 1
            else:
                counts[f'{source_name}_invalid'] += 1
    counts['unique_valid'] = len(valid)
    return sorted(valid), counts


def backfill_buckets(collection, apply_changes):
    scanned = updated = invalid = 0
    projection = {'hashValue': 1, 'buckets': 1}
    for record in collection.find({}, projection):
        scanned += 1
        normalized = AntiCheatEngine.normalize_hash(record.get('hashValue'))
        if not normalized:
            invalid += 1
            continue
        expected = AntiCheatEngine._buckets(normalized)
        if record.get('hashValue') != normalized or record.get('buckets') != expected:
            updated += 1
            if apply_changes:
                collection.update_one(
                    {'_id': record['_id']},
                    {'$set': {'hashValue': normalized, 'buckets': expected}},
                )
    return {'scanned': scanned, 'updates_needed': updated, 'invalid': invalid}


def migrate_legacy(collection, hashes, apply_changes):
    inserted = existing = 0
    now = datetime.now(timezone.utc)
    for hash_value in hashes:
        selector = {
            'hashType': AntiCheatEngine.LEGACY_HASH_TYPE,
            'algorithmVersion': AntiCheatEngine.LEGACY_ALGORITHM_VERSION,
            'hashValue': hash_value,
        }
        if collection.find_one(selector, {'_id': 1}):
            existing += 1
            continue
        inserted += 1
        if apply_changes:
            collection.update_one(
                selector,
                {'$setOnInsert': {
                    **selector,
                    'buckets': AntiCheatEngine._buckets(hash_value),
                    'createdAt': now,
                    'migrationSource': 'legacy-local-stores',
                }},
                upsert=True,
            )
    return {'inserts_needed': inserted, 'already_present': existing}


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Write validated changes to MongoDB.')
    parser.add_argument('--sqlite', type=Path, default=AI_ROOT / 'anticheat.db')
    parser.add_argument('--json', type=Path, default=AI_ROOT / 'anticheat_hashes.json')
    return parser.parse_args()


def get_collection(engine, apply_changes):
    if apply_changes:
        return engine._get_collection()
    if not engine.mongo_uri:
        raise AntiCheatUnavailable('ANTICHEAT_MONGO_URI is not configured.')
    try:
        client = MongoClient(
            engine.mongo_uri,
            serverSelectionTimeoutMS=5_000,
            connectTimeoutMS=5_000,
            socketTimeoutMS=5_000,
        )
        client.admin.command('ping')
        return client[engine.db_name][engine.collection_name]
    except PyMongoError as error:
        raise AntiCheatUnavailable('Durable anti-cheat storage is unavailable.') from error


def main():
    args = parse_args()
    hashes, source_counts = validated_legacy_hashes(args.sqlite, args.json)
    engine = AntiCheatEngine()
    try:
        collection = get_collection(engine, args.apply)
    except AntiCheatUnavailable as error:
        print(json.dumps({'status': 'error', 'message': str(error)}, indent=2))
        return 2

    report = {
        'mode': 'apply' if args.apply else 'dry-run',
        'legacy_sources': dict(source_counts),
        'legacy_import': migrate_legacy(collection, hashes, args.apply),
        'bucket_backfill': backfill_buckets(collection, args.apply),
        'source_files_removed': False,
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
