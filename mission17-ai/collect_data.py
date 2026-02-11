from bing_image_downloader import downloader
import os

# 1. Define what we want to find
SEARCH_TERMS = [
    "people planting trees",
    "planting saplings mission",
    "volunteers reforestation",
    "hand planting tree seedling",
    "community tree planting"
]

# 2. Define where to put them
# We are adding this directly to your existing dataset so it becomes a new "class"
OUTPUT_DIR = "dataset/garbage_classification/planting"

# 3. Download Images
print(f"🚀 Starting download for SDG 13/15 Mission data...")

for term in SEARCH_TERMS:
    print(f"🔍 Searching for: '{term}'...")
    downloader.download(
        term, 
        limit=30,  # We will get 30 images per search term (150 total)
        output_dir="temp_downloads", 
        adult_filter_off=True, 
        force_replace=False, 
        timeout=10, 
        verbose=False
    )

# 4. Move them to the right folder
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

import shutil
print("📂 Organizing files...")
source_folder = "temp_downloads"

for folder in os.listdir(source_folder):
    source_path = os.path.join(source_folder, folder)
    if os.path.isdir(source_path):
        for file in os.listdir(source_path):
            # Move and rename to avoid conflicts
            old_file = os.path.join(source_path, file)
            new_file = os.path.join(OUTPUT_DIR, f"planting_{folder}_{file}")
            shutil.move(old_file, new_file)

# 5. Cleanup
shutil.rmtree("temp_downloads")
print(f"✅ Success! You now have a 'planting' folder in your dataset.")
print(f"📁 Location: {OUTPUT_DIR}")