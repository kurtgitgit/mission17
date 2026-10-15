"""Regression tests for safe on-disk chatbot model loading."""

import os
import pickle
import json
import tempfile
import unittest
from unittest.mock import patch

from chatbot_runtime import smart_classifier


_PICKLE_REDUCER_CALLED = False


def _pickle_reducer_marker():
    global _PICKLE_REDUCER_CALLED
    _PICKLE_REDUCER_CALLED = True
    return {}


class _ExecutablePicklePayload:
    def __reduce__(self):
        return _pickle_reducer_marker, ()


class ChatbotModelSerializationTests(unittest.TestCase):
    def test_model_training_round_trips_through_json(self):
        with tempfile.TemporaryDirectory(dir=os.path.dirname(__file__)) as directory:
            model_path = os.path.join(directory, "synthetic-model.json")
            with patch.object(smart_classifier, "MODEL_FILE", model_path):
                trained = smart_classifier.train()
                loaded = smart_classifier.load_model()

            with open(model_path, "r", encoding="utf-8") as model_file:
                serialized = json.load(model_file)
            self.assertEqual(loaded["version"], smart_classifier.MODEL_VERSION)
            self.assertEqual(loaded["training_sha256"], serialized["training_sha256"])
            self.assertEqual(loaded["centroids"], trained["centroids"])
            before = smart_classifier.handle_message("How do I request a barangay clearance?", model=trained)
            after = smart_classifier.handle_message("How do I request a barangay clearance?", model=loaded)
            self.assertEqual(after["intent"], before["intent"])
            self.assertEqual(after["response"], before["response"])

    def test_model_loader_does_not_execute_pickle_payloads(self):
        global _PICKLE_REDUCER_CALLED
        _PICKLE_REDUCER_CALLED = False
        with tempfile.TemporaryDirectory() as directory:
            model_path = os.path.join(directory, "synthetic-model.json")
            with open(model_path, "wb") as model_file:
                model_file.write(pickle.dumps(_ExecutablePicklePayload()))

            with patch.object(smart_classifier, "MODEL_FILE", model_path), \
                    patch.object(smart_classifier, "train", return_value={"safe": True}) as train:
                self.assertEqual(smart_classifier.load_model(), {"safe": True})

            self.assertFalse(_PICKLE_REDUCER_CALLED)
            train.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
