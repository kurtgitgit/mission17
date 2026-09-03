"""Durable perceptual-hash anti-cheat storage backed by MongoDB."""

import io
import os
from datetime import datetime, timezone

import imagehash
from PIL import Image
from pymongo import ASCENDING, MongoClient
from pymongo.errors import BulkWriteError, DuplicateKeyError, PyMongoError, ServerSelectionTimeoutError


class AntiCheatUnavailable(RuntimeError):
    """Raised when duplicate checks cannot safely reach durable storage."""


class AntiCheatIndeterminate(RuntimeError):
    """Raised when a bounded near-duplicate search cannot decide safely."""


class AntiCheatEngine:
    """Stores pHash and dHash values without retaining submitted images."""

    ALGORITHM_VERSION = 'imagehash-v1'
    DEFAULT_COLLECTION = 'photo_hashes'
    MAX_CANDIDATES = 500

    def __init__(self, mongo_uri=None, db_name=None, collection_name=None, client=None):
        self.mongo_uri = mongo_uri or os.getenv('ANTICHEAT_MONGO_URI', '')
        self.db_name = db_name or os.getenv('ANTICHEAT_DB_NAME', 'mission17_anticheat')
        self.collection_name = collection_name or os.getenv('ANTICHEAT_COLLECTION', self.DEFAULT_COLLECTION)
        self.client = client
        self.collection = None

    def _get_collection(self):
        if self.collection is not None:
            return self.collection
        if not self.mongo_uri:
            raise AntiCheatUnavailable('ANTICHEAT_MONGO_URI is not configured.')

        try:
            self.client = self.client or MongoClient(
                self.mongo_uri,
                serverSelectionTimeoutMS=5_000,
                connectTimeoutMS=5_000,
                socketTimeoutMS=5_000,
                retryWrites=True,
            )
            self.client.admin.command('ping')
            self.collection = self.client[self.db_name][self.collection_name]
            self.collection.create_index(
                [('hashType', ASCENDING), ('algorithmVersion', ASCENDING), ('hashValue', ASCENDING)],
                unique=True,
                name='unique_hash_value',
            )
            self.collection.create_index(
                [('hashType', ASCENDING), ('algorithmVersion', ASCENDING), ('buckets', ASCENDING)],
                name='near_duplicate_candidates',
            )
            return self.collection
        except (PyMongoError, ServerSelectionTimeoutError) as error:
            self.collection = None
            raise AntiCheatUnavailable('Durable anti-cheat storage is unavailable.') from error

    @staticmethod
    def _hamming_distance(hash1, hash2):
        try:
            return imagehash.hex_to_hash(hash1) - imagehash.hex_to_hash(hash2)
        except Exception:
            return 999

    @staticmethod
    def _buckets(hash_value):
        """Return candidate buckets for a bounded approximate search.

        Buckets reduce the candidate set; they do not guarantee detection of
        every possible near duplicate. Exact matching remains exact.
        """
        return sorted({hash_value[:4], hash_value[-4:]})

    def get_hashes(self, file_bytes):
        try:
            image = Image.open(io.BytesIO(file_bytes)).convert('RGB')
            return str(imagehash.phash(image)), str(imagehash.dhash(image))
        except Exception:
            return None, None

    def is_duplicate(self, file_bytes, similarity_threshold=8):
        p_hash, d_hash = self.get_hashes(file_bytes)
        if not p_hash or not d_hash:
            return False

        collection = self._get_collection()
        exact_query = {
            'algorithmVersion': self.ALGORITHM_VERSION,
            '$or': [
                {'hashType': 'phash', 'hashValue': p_hash},
                {'hashType': 'dhash', 'hashValue': d_hash},
            ],
        }
        try:
            if collection.find_one(exact_query, {'_id': 1}):
                return True

            candidate_buckets = self._buckets(p_hash) + self._buckets(d_hash)
            candidates = list(collection.find(
                {
                    'algorithmVersion': self.ALGORITHM_VERSION,
                    'hashType': {'$in': ['phash', 'dhash']},
                    'buckets': {'$in': candidate_buckets},
                },
                {'hashType': 1, 'hashValue': 1},
            ).limit(self.MAX_CANDIDATES + 1))
        except PyMongoError as error:
            raise AntiCheatUnavailable('Durable anti-cheat storage is unavailable.') from error

        if len(candidates) > self.MAX_CANDIDATES:
            raise AntiCheatIndeterminate('Too many near-duplicate candidates require manual review.')

        for candidate in candidates:
            incoming_hash = p_hash if candidate['hashType'] == 'phash' else d_hash
            if self._hamming_distance(candidate['hashValue'], incoming_hash) < similarity_threshold:
                return True
        return False

    def register(self, file_bytes, submission_ref=None):
        """Register verified hashes. Returns False if a concurrent duplicate won."""
        p_hash, d_hash = self.get_hashes(file_bytes)
        if not p_hash or not d_hash:
            raise AntiCheatIndeterminate('Image hashes could not be generated.')

        now = datetime.now(timezone.utc)
        base = {'algorithmVersion': self.ALGORITHM_VERSION, 'createdAt': now}
        if submission_ref:
            base['submissionRef'] = str(submission_ref)
        documents = [
            {**base, 'hashType': 'phash', 'hashValue': p_hash, 'buckets': self._buckets(p_hash)},
            {**base, 'hashType': 'dhash', 'hashValue': d_hash, 'buckets': self._buckets(d_hash)},
        ]

        try:
            self._get_collection().insert_many(documents, ordered=True)
            return True
        except (DuplicateKeyError, BulkWriteError):
            return False
        except PyMongoError as error:
            raise AntiCheatUnavailable('Durable anti-cheat storage is unavailable.') from error

    def health_status(self):
        try:
            self._get_collection()
            return 'ready'
        except AntiCheatUnavailable:
            return 'unavailable'
