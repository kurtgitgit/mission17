import io
import os
import unittest
from unittest.mock import patch

from PIL import Image

os.environ['AI_SERVICE_TOKEN'] = 'test-service-token'

with patch('utils.predictor.Predictor._load_model', lambda _self: None):
    import app as service

from utils.anticheat import AntiCheatUnavailable


def png_bytes():
    image = Image.new('RGB', (32, 32), 'blue')
    output = io.BytesIO()
    image.save(output, format='PNG')
    return output.getvalue()


class ReadyAntiCheat:
    def health_status(self):
        return 'ready'


class UnavailableAntiCheat:
    def health_status(self):
        return 'unavailable'

    def is_duplicate(self, _file_bytes):
        raise AntiCheatUnavailable('test storage unavailable')


class AIServerTests(unittest.TestCase):
    def setUp(self):
        service.app.config['TESTING'] = True
        service.anticheat = ReadyAntiCheat()
        self.client = service.app.test_client()

    def test_health_reports_ready_without_secrets(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {
            'status': 'ok',
            'service': 'mission17-ai',
            'antiCheatStorage': 'ready',
        })

    def test_predict_rejects_missing_service_token(self):
        response = self.client.post('/predict')
        self.assertEqual(response.status_code, 401)

    def test_predict_rejects_missing_file_after_authentication(self):
        response = self.client.post(
            '/predict',
            headers={'Authorization': 'Bearer test-service-token'},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error'], 'No file uploaded')

    def test_predict_fails_safely_when_anticheat_storage_is_unavailable(self):
        service.anticheat = UnavailableAntiCheat()
        response = self.client.post(
            '/predict',
            headers={'Authorization': 'Bearer test-service-token'},
            data={'file': (io.BytesIO(png_bytes()), 'proof.png')},
            content_type='multipart/form-data',
        )
        self.assertEqual(response.status_code, 503)
        payload = response.get_json()
        self.assertEqual(payload['status'], 'UNCERTAIN')
        self.assertFalse(payload['is_verified'])


if __name__ == '__main__':
    unittest.main()
