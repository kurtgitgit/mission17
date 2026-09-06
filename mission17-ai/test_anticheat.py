import io
import unittest

import mongomock
from PIL import Image, ImageDraw

from utils.anticheat import AntiCheatEngine, AntiCheatIndeterminate, AntiCheatUnavailable


def image_bytes(kind, image_format='PNG', quality=95, size=(128, 128)):
    image = Image.new('RGB', size, 'white')
    draw = ImageDraw.Draw(image)
    if kind == 'diagonal':
        draw.polygon([(0, 0), (size[0], 0), (0, size[1])], fill='black')
        draw.rectangle((size[0] * 2 // 3, size[1] * 2 // 3, size[0] - 10, size[1] - 10), fill='red')
    elif kind == 'stripes':
        for x in range(0, size[0], 16):
            draw.rectangle((x, 0, x + 7, size[1] - 1), fill='navy')
    else:
        raise ValueError('Unknown test image kind.')

    output = io.BytesIO()
    image.save(output, format=image_format, quality=quality)
    return output.getvalue()


class AntiCheatEngineTests(unittest.TestCase):
    def setUp(self):
        self.client = mongomock.MongoClient()
        self.engine = AntiCheatEngine(
            mongo_uri='mongodb://mock-host/mission17_anticheat',
            client=self.client,
        )
        self.primary_image = image_bytes('diagonal')
        self.different_image = image_bytes('stripes')

    def test_exact_duplicate_is_detected_and_cannot_register_twice(self):
        self.assertFalse(self.engine.is_duplicate(self.primary_image))
        self.assertTrue(self.engine.register(self.primary_image, submission_ref='test-run'))
        self.assertTrue(self.engine.is_duplicate(self.primary_image))
        self.assertFalse(self.engine.register(self.primary_image, submission_ref='test-run'))

    def test_recompressed_near_duplicate_is_detected(self):
        changed_image = Image.open(io.BytesIO(self.primary_image)).convert('RGB')
        ImageDraw.Draw(changed_image).rectangle((50, 50, 58, 58), fill='gray')
        changed_output = io.BytesIO()
        changed_image.save(changed_output, format='JPEG', quality=70)
        recompressed = changed_output.getvalue()
        original_hashes = self.engine.get_hashes(self.primary_image)
        recompressed_hashes = self.engine.get_hashes(recompressed)
        distances = [
            self.engine._hamming_distance(original, changed)
            for original, changed in zip(original_hashes, recompressed_hashes)
        ]
        self.assertTrue(any(0 < distance < 8 for distance in distances), distances)
        self.assertTrue(self.engine.register(self.primary_image, submission_ref='test-run'))
        self.assertTrue(self.engine.is_duplicate(recompressed))

    def test_clearly_different_pattern_is_not_a_duplicate(self):
        self.assertTrue(self.engine.register(self.primary_image, submission_ref='test-run'))
        self.assertFalse(self.engine.is_duplicate(self.different_image))

    def test_invalid_and_low_information_images_fail_safely(self):
        with self.assertRaises(AntiCheatIndeterminate):
            self.engine.get_hashes(b'not an image')

        blank = io.BytesIO()
        Image.new('RGB', (64, 64), 'white').save(blank, format='PNG')
        with self.assertRaises(AntiCheatIndeterminate):
            self.engine.is_duplicate(blank.getvalue())

    def test_missing_durable_storage_fails_safely(self):
        engine = AntiCheatEngine(mongo_uri='')
        with self.assertRaises(AntiCheatUnavailable):
            engine.is_duplicate(self.primary_image)

    def test_candidate_limit_routes_to_manual_review(self):
        self.engine.MAX_CANDIDATES = 2
        p_hash, _ = self.engine.get_hashes(self.primary_image)
        shared_bucket = self.engine._buckets(p_hash)[0]
        collection = self.engine._get_collection()
        for index in range(3):
            collection.insert_one({
                'hashType': 'phash',
                'algorithmVersion': self.engine.ALGORITHM_VERSION,
                'hashValue': f'{p_hash[:2]}{index + 1:014x}',
                'buckets': [shared_bucket],
            })
        with self.assertRaises(AntiCheatIndeterminate):
            self.engine.is_duplicate(self.primary_image)

    def test_hashes_persist_across_engine_recreation(self):
        self.assertTrue(self.engine.register(self.primary_image, submission_ref='test-run'))
        recreated = AntiCheatEngine(
            mongo_uri='mongodb://mock-host/mission17_anticheat',
            client=self.client,
        )
        self.assertTrue(recreated.is_duplicate(self.primary_image))

    def test_legacy_untyped_exact_hash_is_detected(self):
        p_hash, _ = self.engine.get_hashes(self.primary_image)
        self.engine._get_collection().insert_one({
            'hashType': self.engine.LEGACY_HASH_TYPE,
            'algorithmVersion': self.engine.LEGACY_ALGORITHM_VERSION,
            'hashValue': p_hash,
            'buckets': self.engine._buckets(p_hash),
        })
        self.assertTrue(self.engine.is_duplicate(self.primary_image))

    def test_threshold_outside_bucket_guarantee_fails_safely(self):
        with self.assertRaises(AntiCheatIndeterminate):
            self.engine.is_duplicate(self.primary_image, similarity_threshold=9)


if __name__ == '__main__':
    unittest.main()
