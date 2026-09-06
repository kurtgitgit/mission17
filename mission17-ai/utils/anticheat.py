"""Durable perceptual-hash anti-cheat storage backed by MongoDB."""

import io
import os
import re
from datetime import datetime, timezone

import imagehash
from PIL import Image, ImageStat, UnidentifiedImageError
from pymongo import ASCENDING, MongoClient
from pymongo.errors import BulkWriteError, DuplicateKeyError, PyMongoError


class AntiCheatUnavailable(RuntimeError):
    """Raised when duplicate checks cannot safely reach durable storage."""


class AntiCheatIndeterminate(RuntimeError):
    """Raised when duplicate screening cannot make a safe decision."""


class AntiCheatEngine:
    """Stores pHash and dHash values without retaining submitted images."""

    ALGORITHM_VERSION = 'imagehash-v1'
    LEGACY_ALGORITHM_VERSION = 'legacy-untyped-v1'
    LEGACY_HASH_TYPE = 'legacy_unknown'
    DEFAULT_COLLECTION = 'photo_hashes'
    MAX_CANDIDATES = 500
    MAX_SIMILARITY_THRESHOLD = 8
    HASH_PATTERN = re.compile(r'^[0-9a-f]{16}$')

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
        except PyMongoError as error:
            self.collection = None
            raise AntiCheatUnavailable('Durable anti-cheat storage is unavailable.') from error

    @classmethod
    def normalize_hash(cls, hash_value):
        normalized = str(hash_value).strip().lower()
        return normalized if cls.HASH_PATTERN.fullmatch(normalized) else None

    @staticmethod
    def _hamming_distance(hash1, hash2):
        try:
            return imagehash.hex_to_hash(hash1) - imagehash.hex_to_hash(hash2)
        except (TypeError, ValueError):
            return 999

    @classmethod
    def _buckets(cls, hash_value):
        """Create eight positional one-byte buckets for a 64-bit hash.

        With the supported exclusive Hamming threshold of eight, any matching
        near duplicate must leave at least one of the eight byte-sized buckets
        unchanged. This makes candidate lookup bounded without losing matches
        that satisfy the configured threshold.
        """
        normalized = cls.normalize_hash(hash_value)
        if not normalized:
            raise AntiCheatIndeterminate('A valid 64-bit perceptual hash is required.')
        return [f'{position}:{normalized[position:position + 2]}' for position in range(0, 16, 2)]

    @staticmethod
    def _open_image(file_bytes):
        try:
            with Image.open(io.BytesIO(file_bytes)) as candidate:
                candidate.verify()
            with Image.open(io.BytesIO(file_bytes)) as candidate:
                image = candidate.convert('RGB')
                image.load()
        except (UnidentifiedImageError, OSError, ValueError, TypeError) as error:
            raise AntiCheatIndeterminate('Image content is invalid or unsupported.') from error

        grayscale = image.convert('L')
        if ImageStat.Stat(grayscale).stddev[0] < 1.0:
            raise AntiCheatIndeterminate('Image has insufficient visual detail for duplicate screening.')
        return image

    def get_hashes(self, file_bytes):
        image = self._open_image(file_bytes)
        return str(imagehash.phash(image)), str(imagehash.dhash(image))

    def _candidate_distance(self, candidate, p_hash, d_hash):
        if candidate.get('hashType') == 'phash':
            return self._hamming_distance(candidate.get('hashValue'), p_hash)
        if candidate.get('hashType') == 'dhash':
            return self._hamming_distance(candidate.get('hashValue'), d_hash)
        if candidate.get('hashType') == self.LEGACY_HASH_TYPE:
            return min(
                self._hamming_distance(candidate.get('hashValue'), p_hash),
                self._hamming_distance(candidate.get('hashValue'), d_hash),
            )
        return 999

    def is_duplicate(self, file_bytes, similarity_threshold=8):
        if not 1 <= similarity_threshold <= self.MAX_SIMILARITY_THRESHOLD:
            raise AntiCheatIndeterminate('Similarity threshold is outside the supported safe range.')

        p_hash, d_hash = self.get_hashes(file_bytes)
        collection = self._get_collection()
        exact_query = {
            '$or': [
                {
                    'algorithmVersion': self.ALGORITHM_VERSION,
                    'hashType': 'phash',
                    'hashValue': p_hash,
                },
                {
                    'algorithmVersion': self.ALGORITHM_VERSION,
                    'hashType': 'dhash',
                    'hashValue': d_hash,
                },
                {
                    'algorithmVersion': self.LEGACY_ALGORITHM_VERSION,
                    'hashType': self.LEGACY_HASH_TYPE,
                    'hashValue': {'$in': [p_hash, d_hash]},
                },
            ],
        }
        try:
            if collection.find_one(exact_query, {'_id': 1}):
                return True

            candidate_buckets = sorted(set(self._buckets(p_hash) + self._buckets(d_hash)))
            candidates = list(collection.find(
                {
                    '$or': [
                        {
                            'algorithmVersion': self.ALGORITHM_VERSION,
                            'hashType': {'$in': ['phash', 'dhash']},
                        },
                        {
                            'algorithmVersion': self.LEGACY_ALGORITHM_VERSION,
                            'hashType': self.LEGACY_HASH_TYPE,
                        },
                    ],
                    'buckets': {'$in': candidate_buckets},
                },
                {'hashType': 1, 'hashValue': 1},
            ).limit(self.MAX_CANDIDATES + 1))
        except PyMongoError as error:
            raise AntiCheatUnavailable('Durable anti-cheat storage is unavailable.') from error

        if len(candidates) > self.MAX_CANDIDATES:
            raise AntiCheatIndeterminate('Too many near-duplicate candidates require manual review.')

        return any(
            self._candidate_distance(candidate, p_hash, d_hash) < similarity_threshold
            for candidate in candidates
        )

    def register(self, file_bytes, submission_ref=None):
        """Register verified hashes. Return False when a duplicate wins a race."""
        p_hash, d_hash = self.get_hashes(file_bytes)
        now = datetime.now(timezone.utc)
        base = {'algorithmVersion': self.ALGORITHM_VERSION, 'createdAt': now}
        if submission_ref:
            base['submissionRef'] = str(submission_ref)
        documents = [
            {**base, 'hashType': 'phash', 'hashValue': p_hash, 'buckets': self._buckets(p_hash)},
            {**base, 'hashType': 'dhash', 'hashValue': d_hash, 'buckets': self._buckets(d_hash)},
        ]

        try:
            self._get_collection().insert_many(documents, ordered=False)
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
