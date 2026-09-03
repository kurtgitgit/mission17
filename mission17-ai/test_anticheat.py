import io
import unittest

import mongomock
from PIL import Image, ImageDraw

from utils.anticheat import AntiCheatEngine, AntiCheatUnavailable


def image_bytes(kind):
    image = Image.new('RGB', (128, 128), 'white')
    draw = ImageDraw.Draw(image)
    if kind == 'diagonal':
        draw.polygon([(0, 0), (128, 0), (0, 128)], fill='black')
        draw.rectangle((85, 85, 115, 115), fill='red')
    elif kind == 'stripes':
        for x in range(0, 128, 16):
            draw.rectangle((x, 0, x + 7, 127), fill='navy')
    else:
        raise ValueError('Unknown test image kind.')

    output = io.BytesIO()
    image.save(output, format='PNG')
    return output.getvalue()


class AntiCheatEngineTests(unittest.TestCase):
    def setUp(self):
        self.engine = AntiCheatEngine(
            mongo_uri='mongodb://mock-host/mission17_anticheat',
            client=mongomock.MongoClient(),
        )
        self.primary_image = image_bytes('diagonal')
        self.different_image = image_bytes('stripes')

    def test_exact_duplicate_is_detected_and_cannot_register_twice(self):
        self.assertFalse(self.engine.is_duplicate(self.primary_image))
        self.assertTrue(self.engine.register(self.primary_image))
        self.assertTrue(self.engine.is_duplicate(self.primary_image))
        self.assertFalse(self.engine.register(self.primary_image))

    def test_clearly_different_pattern_is_not_a_duplicate(self):
        self.assertTrue(self.engine.register(self.primary_image))
        p_hash, d_hash = self.engine.get_hashes(self.different_image)
        stored_p_hash, stored_d_hash = self.engine.get_hashes(self.primary_image)
        self.assertGreaterEqual(self.engine._hamming_distance(p_hash, stored_p_hash), 8)
        self.assertGreaterEqual(self.engine._hamming_distance(d_hash, stored_d_hash), 8)
        self.assertFalse(self.engine.is_duplicate(self.different_image))

    def test_invalid_image_does_not_generate_hashes(self):
        self.assertEqual(self.engine.get_hashes(b'not an image'), (None, None))

    def test_missing_durable_storage_fails_safely(self):
        engine = AntiCheatEngine(mongo_uri='')
        with self.assertRaises(AntiCheatUnavailable):
            engine.is_duplicate(self.primary_image)


if __name__ == '__main__':
    unittest.main()
