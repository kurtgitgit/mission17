import os
import traceback
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from utils.anticheat import AntiCheatEngine
from utils.predictor import Predictor
from utils.verdict import get_verdict

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize components
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # Limit upload to 100MB

logger.info("🧠 Loading the MISSION 17 AI Brain (Ollama Vision)...")
anticheat = AntiCheatEngine()
predictor = Predictor()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "model": predictor.get_model_name(),
        "anticheat_hashes": anticheat.count()
    }), 200

@app.route('/reset-anti-cheat', methods=['POST', 'GET'])
def reset_anti_cheat():
    count = anticheat.clear()
    logger.info("🛡️ Anti-cheat hash database cleared!")
    return jsonify({"message": "Anti-cheat hash database cleared!", "count": count}), 200

@app.route('/predict', methods=['POST'])
def predict():
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
        
        # 🎯 MODULE 11: Calculate Hash and Check for Cheaters
        if anticheat.is_duplicate(file_bytes):
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
        logger.error(f"❌ Processing Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': "Processing failed", 'detail': str(e)}), 500

if __name__ == '__main__':
    # Hugging Face requires the app to listen on 0.0.0.0:7860
    app.run(host='0.0.0.0', port=7860, debug=False)