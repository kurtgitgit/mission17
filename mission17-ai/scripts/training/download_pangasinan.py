import json
import os
from datasets import load_dataset

print("Downloading dataset leklek02/pangasinan...")
ds = load_dataset("leklek02/pangasinan", split="train")

print(f"Total rows downloaded: {len(ds)}")

# 1. Create Few-Shot Examples (Top 100 to keep the prompt size reasonable)
examples = []
for i in range(min(100, len(ds))):
    row = ds[i]
    user_text = str(row['instruction'])
    if row.get('input') and str(row['input']).strip():
        user_text += "\n" + str(row['input'])
    
    examples.append({
        "User": user_text,
        "Bot": str(row['output'])
    })

backend_path = r"c:\Users\Kurt Perez\mission17\mission17-backend\utils\pangasinan_examples.json"
os.makedirs(os.path.dirname(backend_path), exist_ok=True)
with open(backend_path, "w", encoding="utf-8") as f:
    json.dump(examples, f, indent=2, ensure_ascii=False)
print(f"Saved 100 examples to {backend_path} for immediate use in Chatbot.")

# 2. Create Gemini Tuning JSONL (All rows for future Fine-Tuning)
tuning_path = r"c:\Users\Kurt Perez\mission17\dataset\gemini_pangasinan_tuning.jsonl"
os.makedirs(os.path.dirname(tuning_path), exist_ok=True)
with open(tuning_path, "w", encoding="utf-8") as f:
    for row in ds:
        user_text = str(row['instruction'])
        if row.get('input') and str(row['input']).strip():
            user_text += "\n" + str(row['input'])
            
        jsonl_obj = {
            "contents": [
                {"role": "user", "parts": [{"text": user_text}]},
                {"role": "model", "parts": [{"text": str(row['output'])}]}
            ]
        }
        f.write(json.dumps(jsonl_obj, ensure_ascii=False) + "\n")
        
print(f"Saved full tuning dataset to {tuning_path} (Upload this to Google AI Studio to fine-tune Gemini!)")
