import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

import mongomock

from scripts.migrate_anticheat_storage import (
    backfill_buckets,
    migrate_legacy,
    validated_legacy_hashes,
)
from utils.anticheat import AntiCheatEngine


class AntiCheatMigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_directory.name)
        self.sqlite_path = self.root / 'legacy.db'
        self.json_path = self.root / 'legacy.json'
        connection = sqlite3.connect(self.sqlite_path)
        try:
            connection.execute('CREATE TABLE hashes (hash_str TEXT UNIQUE)')
            connection.executemany(
                'INSERT INTO hashes (hash_str) VALUES (?)',
                [('ABCDEF0123456789',), ('invalid-hash',), ('0000000000000000',)],
            )
            connection.commit()
        finally:
            connection.close()
        self.json_path.write_text(json.dumps({
            'hashes': ['abcdef0123456789', '1111111111111111', None],
        }), encoding='utf-8')
        self.collection = mongomock.MongoClient().db.photo_hashes

    def tearDown(self):
        self.temp_directory.cleanup()

    def test_validation_normalizes_deduplicates_and_counts_invalid_values(self):
        hashes, counts = validated_legacy_hashes(self.sqlite_path, self.json_path)
        self.assertEqual(hashes, [
            '0000000000000000',
            '1111111111111111',
            'abcdef0123456789',
        ])
        self.assertEqual(counts['unique_valid'], 3)
        self.assertEqual(counts['sqlite_invalid'], 1)
        self.assertEqual(counts['json_invalid'], 1)

    def test_dry_run_reports_without_writing(self):
        hashes, _ = validated_legacy_hashes(self.sqlite_path, self.json_path)
        report = migrate_legacy(self.collection, hashes, apply_changes=False)
        self.assertEqual(report['inserts_needed'], 3)
        self.assertEqual(self.collection.count_documents({}), 0)

    def test_apply_is_idempotent_and_uses_honest_legacy_type(self):
        hashes, _ = validated_legacy_hashes(self.sqlite_path, self.json_path)
        first = migrate_legacy(self.collection, hashes, apply_changes=True)
        second = migrate_legacy(self.collection, hashes, apply_changes=True)
        self.assertEqual(first['inserts_needed'], 3)
        self.assertEqual(second['already_present'], 3)
        self.assertEqual(self.collection.count_documents({}), 3)
        self.assertEqual(
            set(self.collection.distinct('hashType')),
            {AntiCheatEngine.LEGACY_HASH_TYPE},
        )

    def test_bucket_backfill_is_dry_run_safe_and_idempotent(self):
        record_id = self.collection.insert_one({
            'hashType': 'phash',
            'algorithmVersion': AntiCheatEngine.ALGORITHM_VERSION,
            'hashValue': 'ABCDEF0123456789',
            'buckets': ['old'],
        }).inserted_id
        dry_run = backfill_buckets(self.collection, apply_changes=False)
        self.assertEqual(dry_run['updates_needed'], 1)
        self.assertEqual(self.collection.find_one({'_id': record_id})['buckets'], ['old'])

        applied = backfill_buckets(self.collection, apply_changes=True)
        self.assertEqual(applied['updates_needed'], 1)
        record = self.collection.find_one({'_id': record_id})
        self.assertEqual(record['hashValue'], 'abcdef0123456789')
        self.assertEqual(record['buckets'], AntiCheatEngine._buckets(record['hashValue']))
        self.assertEqual(backfill_buckets(self.collection, True)['updates_needed'], 0)


if __name__ == '__main__':
    unittest.main()
