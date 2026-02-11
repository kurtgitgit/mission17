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
model = load_model('mission17_trash_classifier.h5')

with open('labels.txt', 'r') as f:
    class_names = f.read().splitlines()
print(f"✅ Ready to verify: {class_names}")

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    try:
        img = image.load_img(io.BytesIO(file.read()), target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0

        predictions = model.predict(img_array)
        score = predictions[0]

        top_index = np.argmax(score)
        label = class_names[top_index].lower()
        confidence = float(np.max(score) * 100)

        # --- SMART MISSION LOGIC ---
        is_planting = "planting" in label
        is_recyclable = any(x in label for x in ["glass", "plastic", "metal", "paper", "cardboard"])
        
        # Determine the "Verdict" for the Admin
        verdict = "REJECT"
        if is_planting:
            verdict = "VALID MISSION (SDG 13/15)"
        elif is_recyclable:
            verdict = "VALID RECYCLABLE (SDG 12)"
        elif "trash" in label:
            verdict = "GENERAL TRASH - REQUIRES REVIEW"

        response = {
            'prediction': label.upper(),
            'confidence': f"{confidence:.2f}%",
            'is_planting': is_planting,
            'is_recyclable': is_recyclable,
            'verdict': verdict
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)