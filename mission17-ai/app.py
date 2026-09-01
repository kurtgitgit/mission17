import os
import hmac
import logging
from io import BytesIO
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from PIL import Image

from utils.anticheat import AntiCheatEngine
from utils.predictor import Predictor
from utils.verdict import get_verdict

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize components
app = Flask(__name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024
AI_SERVICE_TOKEN = os.getenv('AI_SERVICE_TOKEN', '')

logger.info("🧠 Loading the MISSION 17 AI Brain (Ollama Vision)...")
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

@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({'error': 'Image is too large. Maximum upload size is 5 MB.'}), 413

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "mission17-ai"
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    auth_error = require_backend_service_token()
    if auth_error:
        return auth_error

    try:
        # 🔒 CHECK 1: File Presence
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']

        # 🔒 CHECK 2: Empty File Detection (Bug Fix)
        file.seek(0, os.SEEK_END)
        if file.tell() == 0:
            return jsonify({"error": "Processing failed: Empty file"}), 400
        file.seek(0)

        # 🔒 CHECK 3: Empty Filename
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # 🔒 CHECK 4: File Type Validation
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only JPG/PNG allowed.'}), 400

        # Read file bytes ONCE and reuse them
        file_bytes = file.read()
        try:
            Image.open(BytesIO(file_bytes)).verify()
        except Exception:
            return jsonify({'error': 'Invalid image content.'}), 400
        
        # 🎯 MODULE 11: Calculate Hash and Check for Cheaters
        # Only the authenticated backend can request a re-analysis bypass.
        skip_anticheat = request.headers.get('X-Mission17-Admin-Reanalysis') == '1'
        if not skip_anticheat and anticheat.is_duplicate(file_bytes):
            logger.warning("🚨 ANTI-CHEAT: Duplicate image detected!")
            return jsonify({
                "status": "REJECTED",
                "error": "Duplicate image detected. You cannot farm points!",
                "prediction": "Anti-Cheat: Duplicate"
            }), 400
            
        # 🤖 AI Vision Prediction via Ollama
        logger.info("🤖 Sending image to Ollama Vision...")
        ai_result = predictor.predict(file_bytes)
        
        category = ai_result.get('category', 'Non_SDG_Invalid')
        confidence = ai_result.get('confidence', 0)
        reason = ai_result.get('reason', '')
        
        # ⚖️ Get formatted verdict based on AI output
        verdict_response = get_verdict(category, confidence, threshold=55)
        verdict_response['reason'] = reason
        verdict_response['model'] = predictor.get_model_name()

        # Only register hash if the image was VERIFIED (save memory/prevent false positives on bad images)
        if verdict_response['is_verified']:
            anticheat.register(file_bytes)
            logger.info(f"✅ Unique verified image logged to anticheat.")

        return jsonify(verdict_response)

    except Exception as e:
        logger.exception('Processing Error')
        return jsonify({'error': "Processing failed"}), 500

if __name__ == '__main__':
    # Hugging Face requires the app to listen on 0.0.0.0:7860
    app.run(host='0.0.0.0', port=7860, debug=False)
