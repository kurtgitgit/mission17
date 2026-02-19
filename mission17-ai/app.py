import os
import numpy as np
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

print("🧠 Loading the MISSION 17 AI Brain...")

# 🔒 SECURITY CONFIGURATION (Rubric Category 2)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # Limit upload to 5MB

app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 1. LOAD THE MODEL
MODEL_PATH = 'mission_model.h5' 
if not os.path.exists(MODEL_PATH):
    print(f"❌ ERROR: {MODEL_PATH} not found. Did you run train_ai.py?")
    model = None
else:
    model = load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")

# 2. LOAD LABELS
try:
    with open('labels.txt', 'r') as f:
        class_names = [line.strip() for line in f.readlines()]
    print(f"🏷️  Labels loaded: {class_names}")
except FileNotFoundError:
    print("❌ ERROR: labels.txt not found.")
    class_names = []

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'AI Model is offline'}), 503

    # 🔒 CHECK 1: File Presence
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']

    # 🔒 CHECK 2: Empty Filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # 🔒 CHECK 3: File Type Validation
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only JPG/PNG allowed.'}), 400

    try:
        # Preprocessing
        img = image.load_img(io.BytesIO(file.read()), target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0  # Normalize to [0,1]

        # Prediction
        predictions = model.predict(img_array)
        score = predictions[0]

        top_index = np.argmax(score)
        label = class_names[top_index] 
        
        # Confidence Calculation
        raw_confidence = float(np.max(score) * 100)
        sanitized_confidence = int(raw_confidence)

        # --- 🤖 MISSION VERIFICATION LOGIC ---
        
        verdict = "REJECT" # Default assumption
        is_verified = False
        message = "Unknown Image"

        # 1. CHECK FOR ANTI-CHEAT (The "Invalid" Class)
        if "Non_SDG" in label or "Invalid" in label:
            verdict = "REJECTED"
            message = "⚠️ Image Rejected: Does not match any mission criteria."
        
        # 2. CHECK FOR LOW CONFIDENCE
        elif sanitized_confidence < 40:
            verdict = "UNCERTAIN"
            message = f"❓ Unclear Image ({sanitized_confidence}%). Please take a clearer photo."
        
        # 3. VERIFY SPECIFIC MISSIONS
        else:
            # 🌍 EXISTING MISSIONS
            if "Planting" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Planting Mission (SDG 13/15)"
                is_verified = True
            
            elif "Recycling" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Recycling Mission (SDG 12)"
                is_verified = True

            elif "Cleanup" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Cleanup Mission (SDG 6/14)"
                is_verified = True
            
            elif "Donation" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Donation Mission (SDG 1/2)"
                is_verified = True

            # 🚀 NEW MISSIONS (LIFESTYLE)
            elif "Health" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Health & Wellness Activity (SDG 3)"
                is_verified = True

            elif "Education" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Education Activity (SDG 4)"
                is_verified = True

            elif "Energy" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Energy Saving Action (SDG 7)"
                is_verified = True
            
            elif "Cities" in label or "Sustainable" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Sustainable Commute (SDG 11)"
                is_verified = True
            
            elif "Support_Local" in label or "Decent_Work" in label:
                verdict = "VERIFIED"
                message = "✅ Valid Support for Local Business (SDG 8)"
                is_verified = True

        response = {
            'prediction': label,
            'confidence': f"{sanitized_confidence}%",
            'verdict': verdict,
            'message': message,
            'is_verified': is_verified
        }
        return jsonify(response)

    except Exception as e:
        print(f"❌ Processing Error: {str(e)}")
        return jsonify({'error': "Processing failed"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)