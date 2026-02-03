"""Deepfake detection module using SigLIP model."""

from io import BytesIO
from typing import TypedDict

import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification


class PredictionResult(TypedDict):
    label: str
    confidence: float


class DeepfakeDetector:
    """Detects deepfake images using the SigLIP-based deepfake detector model."""

    def __init__(self, model_name: str = "prithivMLmods/deepfake-detector-model-v1"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.processor = AutoImageProcessor.from_pretrained(model_name)
        self.model = AutoModelForImageClassification.from_pretrained(model_name).to(self.device)
        self.model.eval()

    def predict(self, image_bytes: bytes) -> PredictionResult:
        """
        Predict whether an image is real or fake.

        Args:
            image_bytes: Raw image bytes.

        Returns:
            Dictionary with 'label' ("Real" or "Fake") and 'confidence' score.
        """
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=-1)

        predicted_idx = probabilities.argmax(dim=-1).item()
        confidence = probabilities[0, predicted_idx].item()

        # Map model labels to human-readable format
        label_mapping = self.model.config.id2label
        predicted_label = label_mapping.get(predicted_idx, "Unknown")

        # Normalize label to "Real" or "Fake"
        normalized_label = "Fake" if "fake" in predicted_label.lower() else "Real"

        return PredictionResult(label=normalized_label, confidence=round(confidence, 4))
