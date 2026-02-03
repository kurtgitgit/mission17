# Barangay Image Analysis API

## Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the API:
```bash
uvicorn main:app --reload
```

API will be available at `http://127.0.0.1:8000`

## File Structure

- **`machine_learning_models/untrained/`** - ML models directory
  - **`deepfake_detector.py`** - DeepfakeDetector class using SigLIP model
  - **`sdg_analyzer.py`** - SDGAnalyzer class using CLIP for zero-shot classification
- **`image_analysis.py`** - ImageAnalysis service combining both models in a layered pipeline
- **`main.py`** - FastAPI application with validation endpoints
- **`requirements.txt`** - Python dependencies

## How It Works

The system uses a **2-layer validation pipeline**:

1. **Layer 1: Deepfake Detection** - Checks if image is AI-generated
2. **Layer 2: SDG Analysis** - Only runs if image passes deepfake check, identifies SDG activities

## API Endpoints

### `POST /analyze-image`
Upload an image for layered validation. Returns whether image is valid with detailed analysis.

**Parameters:**
- `file` - Image file (required)
- `labels` - Comma-separated SDG labels (optional)
- `min_sdg_score` - Minimum confidence threshold for SDG (default: 0.3)

**Response:**
- `valid` - Boolean result
- `message` - Descriptive feedback
- `deepfake_confidence` - Confidence score from deepfake detector
- `sdg_label` - Detected SDG activity (if applicable)
- `sdg_score` - SDG classification score (if applicable)

### `GET /health`
Check API and model status.


