import os
import shutil
import random
from pathlib import Path

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, '..', '..', '..', 'dataset', 'mission_dataset')
OUTPUT_DIR = os.path.join(BASE_DIR, '..', '..', '..', 'dataset', 'mission_dataset_split')

# Split ratios
TRAIN_RATIO = 0.80
TEST_RATIO = 0.20

def split_dataset():
    """
    Randomly splits the dataset into train/ and test/ folders.
    This prevents 'Data Leakage' so your evaluate_model.py tests on truly unseen images.
    """
    print(f"🚀 Splitting dataset: {DATASET_DIR}")
    print(f"   Outputting to: {OUTPUT_DIR}")

    if not os.path.exists(DATASET_DIR):
        print(f"❌ ERROR: Dataset not found at {DATASET_DIR}")
        return

    # Create output directories
    train_dir = os.path.join(OUTPUT_DIR, 'train')
    test_dir = os.path.join(OUTPUT_DIR, 'test')

    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)

    classes = [d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))]

    total_moved = 0

    for class_name in classes:
        class_path = os.path.join(DATASET_DIR, class_name)
        images = [f for f in os.listdir(class_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        
        # Shuffle images randomly
        random.shuffle(images)
        
        # Calculate split index
        split_idx = int(len(images) * TRAIN_RATIO)
        
        train_images = images[:split_idx]
        test_images = images[split_idx:]
        
        # Create class folders in train/ and test/
        os.makedirs(os.path.join(train_dir, class_name), exist_ok=True)
        os.makedirs(os.path.join(test_dir, class_name), exist_ok=True)

        print(f"📁 [{class_name}] Total: {len(images)} -> Train: {len(train_images)}, Test: {len(test_images)}")

        # Copy files
        for img in train_images:
            shutil.copy2(os.path.join(class_path, img), os.path.join(train_dir, class_name, img))
            total_moved += 1
            
        for img in test_images:
            shutil.copy2(os.path.join(class_path, img), os.path.join(test_dir, class_name, img))
            total_moved += 1

    print("=" * 50)
    print(f"✅ Dataset split complete! {total_moved} images processed.")
    print("   Next steps:")
    print("   1. Check the new folder 'mission_dataset_split'")
    print("   2. Run train_ai_v2.py (which now points to this new folder)")

if __name__ == '__main__':
    split_dataset()
