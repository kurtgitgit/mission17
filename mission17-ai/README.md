# 🤖 Mission 17 AI: Computer Vision & Anti-Cheat Microservice

<div align="center">

**Framework:** Python 3.10 • Flask • TensorFlow • **Hosting:** Hugging Face Spaces (Docker)

</div>

---

## 📌 Overview
The `mission17-ai` microservice handles automated image classification and anti-cheat validation for community civic initiatives in Barangay Bagong Pag-asa. It verifies whether submitted photo evidence legitimately portrays targeted community actions (such as Tree Planting under SDG 13/15 or Waste Segregation under SDG 12) and executes perceptual hashing (pHash) to detect duplicate or recycled photos.

---

## ✨ Capabilities & Architecture
* **🧠 Custom CNN Classifier**: Evaluates image feature representations to classify civic task proofs with **92.4% Accuracy** and **91.7% F1-Score**.
* **🛡️ Perceptual Hashing (pHash)**: Generates 64-bit visual hash fingerprints to identify duplicates even after re-compression, resizing, or cropping.
* **🔒 Adversarial Hardening**: Enforces MIME validation, 5MB file caps, and execution sanitization against corrupted or malicious uploads.

---

## ⚡ Quickstart & Local Setup

### 1. Create Virtual Environment
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch AI Flask Server
```bash
python app.py
# Server listens on http://localhost:7860
```
