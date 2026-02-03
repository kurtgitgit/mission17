"""SDG activity analyzer using CLIP zero-shot classification."""

from io import BytesIO
from typing import TypedDict

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor


class AnalysisResult(TypedDict):
    label: str
    score: float


class SDGAnalyzer:
    """Analyzes images for SDG-related activities using CLIP zero-shot classification."""

    def __init__(self, model_name: str = "openai/clip-vit-base-patch32"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.model.eval()

    def analyze(self, image_bytes: bytes, candidate_labels: list[str]) -> AnalysisResult:
        """
        Perform zero-shot classification to find the best matching label.

        Args:
            image_bytes: Raw image bytes.
            candidate_labels: List of text descriptions to match against.

        Returns:
            Dictionary with top matching 'label' and its 'score'.
        """
        image = Image.open(BytesIO(image_bytes)).convert("RGB")

        inputs = self.processor(
            text=candidate_labels,
            images=image,
            return_tensors="pt",
            padding=True
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)
            # Compute similarity scores between image and text embeddings
            logits_per_image = outputs.logits_per_image
            probabilities = torch.softmax(logits_per_image, dim=-1)

        scores = probabilities[0].cpu().numpy()
        top_idx = scores.argmax()

        return AnalysisResult(
            label=candidate_labels[top_idx],
            score=round(float(scores[top_idx]), 4)
        )
