---
title: Mission 17 AI
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Mission17-AI

Mission17-AI is a Flask microservice for civic-task photo classification and duplicate-photo screening. It is deployed as a Hugging Face Docker Space and can be called only by the Mission17 backend using a service token.

## What it does

- Uses a TensorFlow CNN (`mission_model.h5`) to classify supported civic-task proof images.
- Maps model results to SDG mission verdicts.
- Rejects exact duplicate photos and screens bounded candidate sets for near duplicates using pHash and dHash.
- Accepts PNG, JPG, JPEG, and WebP images up to 5 MB.
- Validates image content with Pillow before classification.

## Security and storage

- `/predict` requires `Authorization: Bearer <AI_SERVICE_TOKEN>`.
- `ANTICHEAT_MONGO_URI` must use a separate least-privilege MongoDB user restricted to the anti-cheat database.
- The anti-cheat collection stores only perceptual hashes and minimal non-personal metadata. It does not store submitted images, email addresses, names, Firebase UIDs, or tokens.
- If durable anti-cheat storage is unavailable, the service returns `UNCERTAIN`; it must not approve a photo without duplicate screening.
- Near-duplicate checks use indexed candidate buckets to keep queries bounded. This is an approximate screen and may require human review for ambiguous cases.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `AI_SERVICE_TOKEN` | Shared secret required for backend access to `/predict`. |
| `ANTICHEAT_MONGO_URI` | MongoDB URI for the restricted anti-cheat database user. |
| `ANTICHEAT_DB_NAME` | Optional database name; defaults to `mission17_anticheat`. |
| `ANTICHEAT_COLLECTION` | Optional collection name; defaults to `photo_hashes`. |

Never commit real values for these variables.

## Local setup

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
python test_anticheat.py
python test_app.py
python app.py
```

The service listens on `http://localhost:7860`.

## Endpoints

| Endpoint | Access | Behavior |
| --- | --- | --- |
| `GET /health` | Public | Reports service and anti-cheat storage readiness without exposing configuration. |
| `POST /predict` | Backend service token | Returns a verified, rejected, or uncertain photo-analysis result. |

## Model evidence and limitations

- The saved model has 10 output classes, matching the 10 labels in `labels.txt`.
- Public accuracy, precision, recall, and F1 claims are **unverified** until `scripts/training/evaluate_model.py` is run against the documented held-out dataset and its outputs are retained as evidence.
- The model can make false positive and false negative classifications. Low-confidence, unavailable, and ambiguous anti-cheat results require human review.
- Perceptual hashes help identify reused/recompressed images but are not proof of fraud by themselves.
