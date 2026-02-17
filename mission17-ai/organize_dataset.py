import os
import shutil

# 👇 CONFIGURATION
BASE_DIR = "dataset"
OLD_FOLDER_NAME = "garbage_classification"
NEW_FOLDER_NAME = "mission_dataset"

# Define the path to the current dataset
current_dataset_path = os.path.join(BASE_DIR, OLD_FOLDER_NAME)

# Map OLD folders to NEW SDG destinations
# We are putting ALL waste items into SDG12 (Responsible Consumption & Production)
MOVES = {
    "SDG12_Recycling": [
        "battery", "biological", "brown-glass", "cardboard", 
        "clothes", "green-glass", "metal", "paper", 
        "plastic", "shoes", "trash", "white-glass"
    ]
}

def organize_files():
    if not os.path.exists(current_dataset_path):
        print(f"❌ Error: Cannot find '{current_dataset_path}'")
        return

    print(f"📦 Organizing dataset in '{OLD_FOLDER_NAME}'...")

    for dest_folder, source_folders in MOVES.items():
        # Make sure destination exists
        dest_path = os.path.join(current_dataset_path, dest_folder)
        if not os.path.exists(dest_path):
            os.makedirs(dest_path)
            print(f"   Created new folder: {dest_folder}")

        for folder in source_folders:
            src_path = os.path.join(current_dataset_path, folder)
            
            if os.path.exists(src_path):
                print(f"   🔄 Merging '{folder}' into '{dest_folder}'...")
                
                # Move every file
                files = os.listdir(src_path)
                for file in files:
                    old_file_path = os.path.join(src_path, file)
                    # Rename to avoid duplicates (e.g. paper_01.jpg)
                    new_filename = f"{folder}_{file}"
                    new_file_path = os.path.join(dest_path, new_filename)
                    
                    try:
                        shutil.move(old_file_path, new_file_path)
                    except Exception as e:
                        print(f"   ⚠️ Could not move {file}: {e}")

                # Delete the empty old folder
                try:
                    os.rmdir(src_path)
                except:
                    print(f"   ⚠️ Could not delete empty folder '{folder}'")

    # Final Step: Rename the main folder
    new_dataset_path = os.path.join(BASE_DIR, NEW_FOLDER_NAME)
    try:
        os.rename(current_dataset_path, new_dataset_path)
        print(f"\n✨ SUCCESS! Dataset renamed to: '{NEW_FOLDER_NAME}'")
        print("✅ All old folders merged into 'SDG12_Recycling'")
    except Exception as e:
        print(f"❌ Error renaming folder: {e}")

if __name__ == "__main__":
    organize_files()