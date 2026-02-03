"""FastAPI application for image validation."""

from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from image_analysis import ImageAnalysis

# Global image analysis instance
image_analysis: ImageAnalysis | None = None


class ValidationResponse(BaseModel):
    valid: bool
    message: str
    deepfake_confidence: float
    sdg_label: Optional[str] = None
    sdg_score: Optional[float] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize models on startup."""
    global image_analysis
    print("Loading models...")
    image_analysis = ImageAnalysis()
    print("Models loaded successfully.")
    yield
    # Cleanup on shutdown
    image_analysis = None


app = FastAPI(
    title="Barangay Image Validation API",
    description="Layered validation pipeline for image authenticity and SDG activity classification",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware to allow requests from browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze-image", response_model=ValidationResponse)
async def analyze_image(
    file: UploadFile = File(...),
    labels: Optional[str] = Form(default=None),
    min_sdg_score: Optional[float] = Form(default=0.3)
) -> ValidationResponse:
    """
    Analyze image through layered validation pipeline.

    Args:
        file: Image file to validate.
        labels: Comma-separated list of SDG labels (optional).
        min_sdg_score: Minimum score threshold for SDG classification (default: 0.3).

    Returns:
        Validation result with detailed information.
    """
    if image_analysis is None:
        raise HTTPException(status_code=503, detail="Image analysis service not initialized")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_bytes = await file.read()

        # Parse custom labels if provided
        candidate_labels = None
        if labels:
            candidate_labels = [label.strip() for label in labels.split(",") if label.strip()]

        result = image_analysis.analyze_image(image_bytes, candidate_labels, min_sdg_score)
        return ValidationResponse(**result.to_dict())

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service_ready": image_analysis is not None
    }
