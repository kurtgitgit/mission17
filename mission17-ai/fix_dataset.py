import os
import shutil

# Define paths
base_dir = "dataset/garbage_classification"
old_planting = os.path.join(base_dir, "planting")
new_planting = os.path.join(base_dir, "SDG13_15_Planting")

# Create new folder if it doesn't exist
if not os.path.exists(new_planting):
    os.makedirs(new_planting)

# Move files from Old -> New
if os.path.exists(old_planting):
    print(f"🔄 Moving files from '{old_planting}' to '{new_planting}'...")
    files = os.listdir(old_planting)
    for file in files:
        old_path = os.path.join(old_planting, file)
        new_path = os.path.join(new_planting, f"old_{file}") # Rename to avoid conflicts
        shutil.move(old_path, new_path)
    
    # Delete the empty old folder
    os.rmdir(old_planting)
    print("✅ Successfully merged folders!")
    print("🗑️  Deleted old 'planting' folder.")
else:
    print("⚠️  Old 'planting' folder not found. Already merged?")