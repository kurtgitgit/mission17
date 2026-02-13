import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import io

app = Flask(__name__)
CORS(app)

print("🧠 Loading the NEW AI Brain (13 Classes)...")
# Make sure your model file name is correct!
model = load_model('mission17_trash_classifier.h5')

try:
    with open('labels.txt', 'r') as f:
        class_names = f.read().splitlines()
    print(f"✅ Ready to verify: {class_names}")
except FileNotFoundError:
    print("❌ ERROR: labels.txt not found. Please make sure it exists.")
    class_names = []

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    try:
        # Preprocessing the image
        img = image.load_img(io.BytesIO(file.read()), target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0  # Normalize to [0,1]

        # AI Prediction
        predictions = model.predict(img_array)
        score = predictions[0]

        top_index = np.argmax(score)
        label = class_names[top_index].lower()
        
        # 🛡️ SECURITY FIX 1: Sanitize Output (Risk #3)
        # We round to an integer so users can't see the exact decimal (e.g., 98.234%)
        raw_confidence = float(np.max(score) * 100)
        sanitized_confidence = int(raw_confidence)

        # --- SMART MISSION LOGIC ---
        is_planting = "planting" in label
        is_recyclable = any(x in label for x in ["glass", "plastic", "metal", "paper", "cardboard"])
        
        # 🛡️ SECURITY FIX 2: Confidence Threshold (Risk #1)
        # If AI is unsure (< 60%), we don't trust the label.
        if sanitized_confidence < 60:
            verdict = "UNCERTAIN - IMAGE UNCLEAR"
            label = "Unknown" # Hide the guess if it's bad
            is_planting = False
            is_recyclable = False
        else:
            # Only trust the verdict if confidence is high
            verdict = "REJECT" # Default
            
            if is_planting:
                verdict = "VALID MISSION (SDG 13/15)"
            elif is_recyclable:
                verdict = "VALID RECYCLABLE (SDG 12)"
            elif "trash" in label:
                verdict = "GENERAL TRASH - REQUIRES REVIEW"

        response = {
            'prediction': label.upper(),
            'confidence': f"{sanitized_confidence}%",  # Sending clean integer
            'is_planting': is_planting,
            'is_recyclable': is_recyclable,
            'verdict': verdict
        }
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': "Processing failed"}), 500  # Generic error to hide details

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)