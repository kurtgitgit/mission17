"""TensorFlow CNN prediction adapter for Mission17 proof images."""

import io
import logging
import os

import numpy as np
from PIL import Image
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.models import load_model


logger = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'mission_model.h5')
LABELS_PATH = os.path.join(BASE_DIR, 'labels.txt')


class PredictorUnavailable(RuntimeError):
    """Raised when the saved model cannot safely provide a prediction."""


class Predictor:
    def __init__(self):
        self.model = None
        self.class_names = []
        self.load_error = None
        self._load_model()

    def _load_model(self):
        logger.info('Loading the Mission17 TensorFlow CNN model.')
        try:
            with open(LABELS_PATH, 'r', encoding='utf-8') as labels_file:
                self.class_names = [line.strip() for line in labels_file if line.strip()]
            if not self.class_names:
                raise ValueError('labels.txt is empty.')
            if not os.path.exists(MODEL_PATH):
                raise FileNotFoundError('mission_model.h5 is missing.')

            self.model = load_model(MODEL_PATH)
            output_count = int(self.model.output_shape[-1])
            if output_count != len(self.class_names):
                raise ValueError(
                    f'Model output count ({output_count}) does not match label count ({len(self.class_names)}).'
                )

            dummy_image = np.zeros((1, 224, 224, 3), dtype=np.float32)
            self.model.predict(dummy_image, verbose=0)
            logger.info('TensorFlow CNN loaded and warmed successfully with %d classes.', output_count)
        except Exception as error:
            self.model = None
            self.load_error = str(error)
            logger.exception('TensorFlow CNN failed to load.')

    def health_status(self):
        return 'ready' if self.model is not None and self.class_names else 'unavailable'

    def predict(self, file_bytes):
        """Run an image through the saved EfficientNet-based CNN."""
        if self.health_status() != 'ready':
            raise PredictorUnavailable('The TensorFlow CNN is unavailable.')

        try:
            image = Image.open(io.BytesIO(file_bytes)).convert('RGB')
            image = image.resize((224, 224), Image.Resampling.LANCZOS)
            image_array = np.asarray(image, dtype=np.float32)
            image_array = preprocess_input(image_array)
            image_array = np.expand_dims(image_array, axis=0)

            predictions = self.model.predict(image_array, verbose=0)
            score = predictions[0]
            top_index = int(np.argmax(score))
            label = self.class_names[top_index]
            confidence = int(np.max(score) * 100)

            category = label
            if '_' in label and label.startswith('SDG'):
                category = label.split('_', 1)[1]
                if '_' in category:
                    category = category.rsplit('_', 1)[-1]
            elif label == 'Non_SDG_Invalid':
                category = 'Non_SDG_Invalid'

            category_overrides = {
                'Planting': 'Planting',
                'Cleanup': 'Cleanup',
                'Donation': 'Donation',
                'Health': 'Health',
                'Energy': 'Energy',
                'Education': 'Education',
            }
            for fragment, mapped_category in category_overrides.items():
                if fragment in label:
                    category = mapped_category
            if 'Cities' in label or 'Sustainable' in label:
                category = 'Sustainable_Cities'
            if 'Local' in label:
                category = 'Support_Local'

            return {
                'category': category,
                'confidence': confidence,
                'reason': f'Predicted {label} with {confidence}% confidence',
            }
        except PredictorUnavailable:
            raise
        except Exception as error:
            logger.exception('TensorFlow CNN prediction failed.')
            raise PredictorUnavailable('The TensorFlow CNN could not process the image.') from error

    def get_model_name(self):
        return 'TensorFlow CNN (mission_model.h5)'
