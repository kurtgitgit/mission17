import os
import io
import traceback
import numpy as np
from PIL import Image
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'mission_model.h5')
LABELS_PATH = os.path.join(BASE_DIR, 'labels.txt')

class Predictor:
    def __init__(self):
        self.model = None
        self.class_names = []
        self._load_model()

    def _load_model(self):
        print("🧠 Loading TensorFlow CNN Brain...")
        if not os.path.exists(MODEL_PATH):
            print(f"❌ ERROR: {MODEL_PATH} not found. You need to train the model!")
            return

        try:
            self.model = load_model(MODEL_PATH)
            print("✅ Model loaded successfully!")
        except Exception as e:
            print(f"❌ Failed to load model: {e}")

        # Load Labels
        try:
            with open(LABELS_PATH, 'r') as f:
                self.class_names = [line.strip() for line in f.readlines()]
            print(f"🏷️  Labels loaded: {self.class_names}")
        except FileNotFoundError:
            print("❌ ERROR: labels.txt not found.")
            self.class_names = []

        # 🔥 WARMUP STEP (Optimization)
        if self.model:
            print("🔥 Warming up model for instant first-prediction...")
            dummy_image = np.zeros((1, 224, 224, 3), dtype=np.float32)
            self.model.predict(dummy_image, verbose=0)
            print("⚡ AI is fully optimized and ready!")

    def predict(self, file_bytes):
        """
        Runs the image through the custom EfficientNet CNN.
        """
        if not self.model or not self.class_names:
            return {"category": "Non_SDG_Invalid", "confidence": 0, "reason": "Model offline or missing."}

        try:
            # 1. Read image using PIL (just like in train_ai.py)
            img = Image.open(io.BytesIO(file_bytes)).convert('RGB')

            # 2. Resize to 224x224 (EfficientNetB0 input size)
            img = img.resize((224, 224), Image.LANCZOS)

            # 3. Apply EfficientNetB0 preprocess_input
            img_array = np.array(img, dtype=np.float32)
            img_array = preprocess_input(img_array)
            img_array = np.expand_dims(img_array, axis=0)

            # 4. Predict
            predictions = self.model.predict(img_array)
            score = predictions[0]

            top_index = np.argmax(score)
            label = self.class_names[top_index]
            
            confidence = int(np.max(score) * 100)

            # Clean up label if it has the SDG prefix (e.g. SDG12_Recycling -> Recycling)
            # The verdict.py MISSION_MAP expects "Recycling", "Planting", etc.
            category = label
            if "_" in label and label.startswith("SDG"):
                # E.g. "SDG12_Recycling" -> "Recycling"
                category = label.split("_", 1)[1]
                # If there are multiple underscores (like SDG13_15_Planting), take the last part
                if "_" in category:
                    category = category.rsplit("_", 1)[-1]
            elif label == "Non_SDG_Invalid":
                category = "Non_SDG_Invalid"
                
            # Quick check for combined strings
            if "Planting" in label: category = "Planting"
            if "Cleanup" in label: category = "Cleanup"
            if "Donation" in label: category = "Donation"
            if "Cities" in label or "Sustainable" in label: category = "Sustainable_Cities"
            if "Local" in label: category = "Support_Local"
            if "Health" in label: category = "Health"
            if "Energy" in label: category = "Energy"
            if "Education" in label: category = "Education"

            return {
                "category": category,
                "confidence": confidence,
                "reason": f"Predicted {label} with {confidence}% confidence"
            }

        except Exception as e:
            traceback.print_exc()
            print(f"⚠️ Predictor error: {e}")
            return {"category": "Non_SDG_Invalid", "confidence": 0, "reason": str(e)}

    def get_model_name(self):
        return "Custom CNN (mission_model.h5)"
