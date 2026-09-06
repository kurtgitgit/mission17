"""Mission17 TensorFlow proof-verification HTTP service."""

import hmac
import logging
import os
from io import BytesIO

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from PIL import Image
from werkzeug.exceptions import RequestEntityTooLarge

from utils.anticheat import AntiCheatEngine, AntiCheatIndeterminate, AntiCheatUnavailable
from utils.predictor import Predictor, PredictorUnavailable
from utils.verdict import get_verdict


load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
ALLOWED_IMAGE_FORMATS = {'png', 'jpeg', 'webp'}
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024
AI_SERVICE_TOKEN = os.getenv('AI_SERVICE_TOKEN', '')

logger.info('Loading the Mission17 TensorFlow CNN verification service.')
anticheat = AntiCheatEngine()
predictor = Predictor()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def require_backend_service_token():
    if not AI_SERVICE_TOKEN:
        logger.error('AI_SERVICE_TOKEN is not configured.')
        return jsonify({'error': 'AI service is not configured.'}), 503

    authorization = request.headers.get('Authorization', '')
    if not authorization.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401

    provided_token = authorization.removeprefix('Bearer ')
    if not hmac.compare_digest(provided_token, AI_SERVICE_TOKEN):
        return jsonify({'error': 'Unauthorized'}), 401
    return None


def unavailable_response(component, message):
    return jsonify({
        'status': 'UNCERTAIN',
        'verdict': 'UNCERTAIN',
        'is_verified': False,
        'prediction': component,
        'message': message,
        'sdg': 'N/A',
        'source_check': 'Unavailable',
    }), 503


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({'error': 'Image is too large. Maximum upload size is 5 MB.'}), 413


@app.route('/health', methods=['GET'])
def health():
    storage_status = anticheat.health_status()
    model_status = predictor.health_status()
    ready = storage_status == 'ready' and model_status == 'ready'
    return jsonify({
        'status': 'ok' if ready else 'degraded',
        'service': 'mission17-ai',
        'antiCheatStorage': storage_status,
        'modelStatus': model_status,
    }), 200 if ready else 503


@app.route('/predict', methods=['POST'])
def predict():
    auth_error = require_backend_service_token()
    if auth_error:
        return auth_error

    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        file.seek(0, os.SEEK_END)
        if file.tell() == 0:
            return jsonify({'error': 'Processing failed: Empty file'}), 400
        file.seek(0)

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type. Only PNG, JPG, JPEG, and WebP are allowed.'
            }), 400

        file_bytes = file.read()
        try:
            with Image.open(BytesIO(file_bytes)) as uploaded_image:
                detected_format = uploaded_image.format
                uploaded_image.verify()
        except Exception:
            return jsonify({'error': 'Invalid image content.'}), 400

        if not detected_format or detected_format.lower() not in ALLOWED_IMAGE_FORMATS:
            return jsonify({'error': 'Image content type does not match a supported format.'}), 400

        # Only the authenticated backend can supply this re-analysis header.
        skip_anticheat = request.headers.get('X-Mission17-Admin-Reanalysis') == '1'
        if not skip_anticheat and anticheat.is_duplicate(file_bytes):
            logger.warning('Anti-cheat duplicate image detected.')
            return jsonify({
                'status': 'REJECTED',
                'verdict': 'REJECTED',
                'is_verified': False,
                'error': 'Duplicate image detected.',
                'prediction': 'Anti-Cheat: Duplicate',
            }), 400

        logger.info('Sending image to the Mission17 TensorFlow CNN.')
        ai_result = predictor.predict(file_bytes)
        category = ai_result.get('category', 'Non_SDG_Invalid')
        confidence = ai_result.get('confidence', 0)

        verdict_response = get_verdict(category, confidence, threshold=55)
        verdict_response['reason'] = ai_result.get('reason', '')
        verdict_response['model'] = predictor.get_model_name()

        if verdict_response['is_verified'] and not skip_anticheat:
            if not anticheat.register(file_bytes):
                return jsonify({
                    'status': 'REJECTED',
                    'verdict': 'REJECTED',
                    'is_verified': False,
                    'error': 'Duplicate image detected during verification.',
                    'prediction': 'Anti-Cheat: Duplicate',
                }), 400
            logger.info('Unique verified image registered in durable anti-cheat storage.')

        return jsonify(verdict_response)

    except PredictorUnavailable as error:
        logger.warning('Model verification unavailable: %s', error)
        return unavailable_response(
            'Model Unavailable',
            'Photo verification requires manual review because the model is unavailable.',
        )
    except (AntiCheatUnavailable, AntiCheatIndeterminate) as error:
        logger.warning('Anti-cheat verification unavailable: %s', error)
        return unavailable_response(
            'Anti-Cheat Unavailable',
            'Photo verification requires manual review. Please try again later.',
        )
    except RequestEntityTooLarge:
        return request_too_large(None)
    except Exception:
        logger.exception('Processing error')
        return jsonify({'error': 'Processing failed'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860, debug=False)
