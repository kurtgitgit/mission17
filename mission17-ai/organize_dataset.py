import os
import shutil

# 👇 CONFIGURATION
# Current script directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# The main project dataset folder (../dataset)
BASE_DIR = os.path.join(CURRENT_DIR, '..', 'dataset')

# 1. The "Correct" Destination
FINAL_DEST = os.path.join(BASE_DIR, "mission_dataset")

# 2. The "Old" Kaggle Dataset
OLD_GARBAGE_DIR = os.path.join(BASE_DIR, "garbage_classification")

# 3. The "Misplaced" Downloads (if any) inside mission17-ai/dataset
MISPLACED_DIR = os.path.join(CURRENT_DIR, "dataset", "mission_dataset")

# Map OLD folders to NEW SDG destinations
# We are putting ALL waste items into SDG12 (Responsible Consumption & Production)
MOVES = {
    "SDG12_Recycling": [
        "battery", "brown-glass", "cardboard", 
        "clothes", "green-glass", "metal", "paper", 
        "plastic", "shoes", "white-glass"
    ],
    "Non_SDG_Invalid": [
        "trash", "biological"
    ]
}

def organize_files():
    print(f"📦 Organizing dataset...")
    
    # Ensure destination exists
    if not os.path.exists(FINAL_DEST):
        os.makedirs(FINAL_DEST)
        print(f"   ✅ Created '{FINAL_DEST}'")

    # --- STEP 1: Merge Kaggle Data ---
    if os.path.exists(OLD_GARBAGE_DIR):
        print(f"   🔄 Merging 'garbage_classification'...")
        for dest_folder, source_folders in MOVES.items():
            dest_path = os.path.join(FINAL_DEST, dest_folder)
            if not os.path.exists(dest_path): os.makedirs(dest_path)

            for folder in source_folders:
                src_path = os.path.join(OLD_GARBAGE_DIR, folder)
                if os.path.exists(src_path):
                    # Move files
                    for file in os.listdir(src_path):
                        try:
                            shutil.move(os.path.join(src_path, file), os.path.join(dest_path, f"{folder}_{file}"))
                        except Exception: pass
                    # Remove empty folder
                    try:
                        os.rmdir(src_path)
                    except: pass
        
        # Try to remove root garbage dir
        try: os.rmdir(OLD_GARBAGE_DIR)
        except: pass
        print("   ✅ Kaggle data merged.")

    # --- STEP 2: Fix Misplaced Downloads ---
    if os.path.exists(MISPLACED_DIR):
        print(f"   ⚠️ Found misplaced images in '{MISPLACED_DIR}'. Moving them...")
        for category in os.listdir(MISPLACED_DIR):
            src = os.path.join(MISPLACED_DIR, category)
            dest = os.path.join(FINAL_DEST, category)
            
            if os.path.isdir(src):
                if not os.path.exists(dest): os.makedirs(dest)
                for file in os.listdir(src):
                    try:
                        shutil.move(os.path.join(src, file), os.path.join(dest, file))
                    except: pass
                try: os.rmdir(src)
                except: pass
        
        # Cleanup parent 'dataset' in mission17-ai if empty
        try: 
            os.rmdir(MISPLACED_DIR)
            os.rmdir(os.path.join(CURRENT_DIR, "dataset"))
        except: pass
        print("   ✅ Misplaced images moved to correct folder.")

    print(f"\n✨ SUCCESS! Dataset is ready at: {FINAL_DEST}")

if __name__ == "__main__":
    organize_files()