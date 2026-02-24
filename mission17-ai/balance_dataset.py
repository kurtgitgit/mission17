import os
import shutil
import random

# 👇 CONFIGURATION
# Paths relative to this script
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(CURRENT_DIR, '..', 'dataset', 'mission_dataset')

# Target number of images per class
# 500 is a good balance. It keeps your smaller classes (which have ~250) safe,
# but drastically cuts down the huge Recycling class.
TARGET_COUNT = 500 

def balance_dataset():
    print(f"⚖️  Balancing dataset at: {DATASET_DIR}")
    print(f"   (DELETING excess images over {TARGET_COUNT})\n")

    if not os.path.exists(DATASET_DIR):
        print("❌ Error: Dataset folder not found.")
        return

    for class_name in os.listdir(DATASET_DIR):
        class_path = os.path.join(DATASET_DIR, class_name)
        
        if not os.path.isdir(class_path):
            continue

        # Get all images
        images = os.listdir(class_path)
        count = len(images)

        # Safety: Only trim if it is the specific Recycling folder
        if count > TARGET_COUNT and class_name == "SDG12_Recycling":
            print(f"   ✂️  Trimming '{class_name}': {count} -> {TARGET_COUNT}")
            
            # Shuffle to keep a random selection (important!)
            random.shuffle(images)
            
            # Identify excess files
            excess_images = images[TARGET_COUNT:]
            
            # Delete them
            for img in excess_images:
                src = os.path.join(class_path, img)
                os.remove(src)
                
            print(f"      🗑️ Deleted {len(excess_images)} excess images.")
        else:
            print(f"   ✅ '{class_name}' is within limits ({count})")

    print("\n✨ Dataset Balanced! Training will now be fair and fast.")

if __name__ == "__main__":
    balance_dataset()
