import io
import os
import unittest
from unittest.mock import patch

from PIL import Image, ImageDraw

os.environ['AI_SERVICE_TOKEN'] = 'test-service-token'

with patch('utils.predictor.Predictor._load_model', lambda _self: None):
    import app as service

from utils.anticheat import AntiCheatUnavailable
from utils.predictor import PredictorUnavailable


def png_bytes():
    image = Image.new('RGB', (64, 64), 'blue')
    ImageDraw.Draw(image).rectangle((8, 8, 40, 45), fill='yellow')
    output = io.BytesIO()
    image.save(output, format='PNG')
    return output.getvalue()


class ReadyAntiCheat:
    def __init__(self, duplicate=False, register_result=True):
        self.duplicate = duplicate
        self.register_result = register_result
        self.register_calls = 0

    def health_status(self):
        return 'ready'

    def is_duplicate(self, _file_bytes):
        return self.duplicate

    def register(self, _file_bytes):
        self.register_calls += 1
        return self.register_result


class UnavailableAntiCheat(ReadyAntiCheat):
    def health_status(self):
        return 'unavailable'

    def is_duplicate(self, _file_bytes):
        raise AntiCheatUnavailable('test storage unavailable')


class ReadyPredictor:
    def health_status(self):
        return 'ready'

    def predict(self, _file_bytes):
        return {'category': 'Cleanup', 'confidence': 95, 'reason': 'test prediction'}

    def get_model_name(self):
        return 'Test TensorFlow CNN'


class UnavailablePredictor(ReadyPredictor):
    def health_status(self):
        return 'unavailable'

    def predict(self, _file_bytes):
        raise PredictorUnavailable('test model unavailable')


class AIServerTests(unittest.TestCase):
    def setUp(self):
        service.app.config['TESTING'] = True
        service.anticheat = ReadyAntiCheat()
        service.predictor = ReadyPredictor()
        self.client = service.app.test_client()
        self.headers = {'Authorization': 'Bearer test-service-token'}

    def post_image(self, content=None, filename='proof.png', headers=None):
        return self.client.post(
            '/predict',
            headers=headers or self.headers,
            data={'file': (io.BytesIO(content if content is not None else png_bytes()), filename)},
            content_type='multipart/form-data',
        )

    def test_health_reports_component_readiness_without_secrets(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {
            'status': 'ok',
            'service': 'mission17-ai',
            'antiCheatStorage': 'ready',
            'modelStatus': 'ready',
        })

    def test_health_is_degraded_when_model_is_unavailable(self):
        service.predictor = UnavailablePredictor()
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()['modelStatus'], 'unavailable')

    def test_predict_rejects_missing_and_incorrect_service_tokens(self):
        self.assertEqual(self.client.post('/predict').status_code, 401)
        response = self.client.post('/predict', headers={'Authorization': 'Bearer wrong'})
        self.assertEqual(response.status_code, 401)

    def test_predict_rejects_missing_empty_invalid_and_unsupported_files(self):
        self.assertEqual(self.client.post('/predict', headers=self.headers).status_code, 400)
        self.assertEqual(self.post_image(b'').status_code, 400)
        self.assertEqual(self.post_image(b'not an image').status_code, 400)
        self.assertEqual(self.post_image(png_bytes(), filename='proof.gif').status_code, 400)

    def test_predict_rejects_oversized_upload(self):
        response = self.post_image(b'x' * (5 * 1024 * 1024 + 1))
        self.assertEqual(response.status_code, 413)

    def test_valid_authorized_prediction_registers_verified_hashes(self):
        response = self.post_image()
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload['status'], 'VERIFIED')
        self.assertTrue(payload['is_verified'])
        self.assertEqual(service.anticheat.register_calls, 1)

    def test_duplicate_is_rejected_before_model_prediction(self):
        service.anticheat = ReadyAntiCheat(duplicate=True)
        response = self.post_image()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['status'], 'REJECTED')

    def test_concurrent_duplicate_registration_is_rejected(self):
        service.anticheat = ReadyAntiCheat(register_result=False)
        response = self.post_image()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['status'], 'REJECTED')

    def test_anticheat_unavailable_uses_stable_uncertain_schema(self):
        service.anticheat = UnavailableAntiCheat()
        response = self.post_image()
        self.assertEqual(response.status_code, 503)
        payload = response.get_json()
        self.assertEqual(payload['status'], 'UNCERTAIN')
        self.assertEqual(payload['verdict'], 'UNCERTAIN')
        self.assertFalse(payload['is_verified'])

    def test_model_unavailable_uses_stable_uncertain_schema(self):
        service.predictor = UnavailablePredictor()
        response = self.post_image()
        self.assertEqual(response.status_code, 503)
        payload = response.get_json()
        self.assertEqual(payload['status'], 'UNCERTAIN')
        self.assertEqual(payload['prediction'], 'Model Unavailable')
        self.assertFalse(payload['is_verified'])

    def test_admin_reanalysis_bypasses_duplicate_registration(self):
        service.anticheat = ReadyAntiCheat(duplicate=True)
        response = self.post_image(headers={
            **self.headers,
            'X-Mission17-Admin-Reanalysis': '1',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(service.anticheat.register_calls, 0)


if __name__ == '__main__':
    unittest.main()
