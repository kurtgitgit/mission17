"""Layered image validation service combining deepfake detection and SDG analysis."""

from typing import Optional

from machine_learning_models.untrained.deepfake_detector import DeepfakeDetector
from machine_learning_models.untrained.sdg_analyzer import SDGAnalyzer


class ValidationResult:
    """Result of layered image validation."""

    def __init__(
        self,
        valid: bool,
        message: str,
        deepfake_confidence: float,
        sdg_label: Optional[str] = None,
        sdg_score: Optional[float] = None
    ):
        self.valid = valid
        self.message = message
        self.deepfake_confidence = deepfake_confidence
        self.sdg_label = sdg_label
        self.sdg_score = sdg_score

    def to_dict(self) -> dict:
        return {
            "valid": self.valid,
            "message": self.message,
            "deepfake_confidence": self.deepfake_confidence,
            "sdg_label": self.sdg_label,
            "sdg_score": self.sdg_score
        }


class ImageAnalysis:
    """Layered validation pipeline: Deepfake detection → SDG analysis."""

    DEFAULT_SDG_LABELS = [
        "cleaning environment",
        "planting trees",
        "people cleaning street",
        "waste segregation",
        "tree planting activity",
        "community cleanup",
        "recycling materials",
        "protecting wildlife",
        "forest conservation",
        "coastal cleanup"
    ]

    def __init__(self):
        self.deepfake_detector = DeepfakeDetector()
        self.sdg_analyzer = SDGAnalyzer()

    def analyze_image(
        self,
        image_bytes: bytes,
        candidate_labels: Optional[list[str]] = None,
        min_sdg_score: float = 0.3
    ) -> ValidationResult:
        """
        Perform layered validation on an image.

        Layer 1: Deepfake detection - rejects AI-generated images.
        Layer 2: SDG analysis - identifies SDG-related activities.

        Args:
            image_bytes: Raw image bytes.
            candidate_labels: List of SDG labels to match (optional).
            min_sdg_score: Minimum score threshold for SDG classification.

        Returns:
            ValidationResult with detailed analysis.
        """
        # Layer 1: Deepfake Detection
        deepfake_result = self.deepfake_detector.predict(image_bytes)

        if deepfake_result["label"] == "Fake":
            return ValidationResult(
                valid=False,
                message="Image is AI generated",
                deepfake_confidence=deepfake_result["confidence"]
            )

        # Layer 2: SDG Analysis (only if image is Real)
        labels = candidate_labels if candidate_labels else self.DEFAULT_SDG_LABELS
        sdg_result = self.sdg_analyzer.analyze(image_bytes, labels)

        if sdg_result["score"] >= min_sdg_score:
            return ValidationResult(
                valid=True,
                message=f"Valid SDG activity detected: {sdg_result['label']}",
                deepfake_confidence=deepfake_result["confidence"],
                sdg_label=sdg_result["label"],
                sdg_score=sdg_result["score"]
            )
        else:
            return ValidationResult(
                valid=False,
                message="No significant SDG activity detected",
                deepfake_confidence=deepfake_result["confidence"],
                sdg_label=sdg_result["label"],
                sdg_score=sdg_result["score"]
            )
