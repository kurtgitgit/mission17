from bing_image_downloader import downloader
import os
import shutil

# 👇 CONFIGURATION
# We point to your EXISTING folder. 
# This script will just ADD the new folders next to the old ones.
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dataset', 'mission_dataset')

# 🚀 NEW MISSIONS ONLY (SDG 3, 4, 7, 8, 11)
CLASSES = {
    # 🏃 SDG 3: Good Health & Well-being
    "SDG3_Health_Wellbeing": [
        "people jogging in park", 
        "group yoga session outdoors", 
        "eating fresh fruit salad bowl", 
        "drinking glass of water", 
        "washing hands with soap"
    ],

    # 📚 SDG 4: Quality Education
    "SDG4_Quality_Education": [
        "student reading open book", 
        "teacher writing on whiteboard", 
        "group study in library", 
        "hand writing notes in notebook", 
        "child using educational tablet"
    ],

    # ⚡ SDG 7: Affordable & Clean Energy
    "SDG7_Clean_Energy": [
        "solar panels on house roof", 
        "hand turning off light switch", 
        "electric vehicle charging station", 
        "wind turbine farm landscape", 
        "modern led light bulb"
    ],

    # 🏙️ SDG 11: Sustainable Cities
    "SDG11_Sustainable_Cities": [
        "riding bicycle on road", 
        "passengers inside city bus", 
        "waiting at train station platform", 
        "walking on pedestrian crossing", 
        "segregated bike lane city"
    ],
    
    # 🛍️ SDG 8: Decent Work (Support Local)
    "SDG8_Support_Local": [
        "buying from street food vendor", 
        "shopping at local farmers market", 
        "handshake business meeting", 
        "artisan crafting handmade goods", 
        "small bakery shop front"
    ],

    # 🚫 ANTI-CHEAT: Things that are NOT missions
    "Non_SDG_Invalid": [
        "random selfie photo",
        "blurry image",
        "sleeping cat",
        "luxury sports car",
        "video game screenshot"
    ]
}

print(f"🚀 Starting ADD-ON Data Collection into: {BASE_DIR}")

if not os.path.exists(BASE_DIR):
    print(f"❌ ERROR: Could not find '{BASE_DIR}'.")
    exit()

for category, terms in CLASSES.items():
    print(f"\n📂 Creating New Category: '{category}'...")
    
    # Ensure the category folder exists
    target_dir = os.path.join(BASE_DIR, category)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    for term in terms:
        print(f"   🔍 Searching for: '{term}'...")
        
        try:
            downloader.download(
                term, 
                limit=50,  # 50 images per term
                output_dir="temp_downloads", 
                adult_filter_off=True, 
                force_replace=False, 
                timeout=5, 
                verbose=False
            )

            # Move files to the main folder
            source_folder = os.path.join("temp_downloads", term)
            if os.path.exists(source_folder):
                files = os.listdir(source_folder)
                for file in files:
                    try:
                        old_file = os.path.join(source_folder, file)
                        
                        # Rename with 'new' so we know it's fresh
                        clean_term = term.replace(" ", "_")
                        new_filename = f"new_{clean_term}_{file}"
                        new_file = os.path.join(target_dir, new_filename)
                        
                        shutil.move(old_file, new_file)
                    except Exception:
                        pass 
                print(f"      ✅ Added {len(files)} images.")

        except Exception as e:
            print(f"   ⚠️ Skipped term due to error: {e}")

    # Cleanup temp folder
    if os.path.exists("temp_downloads"):
        try:
            shutil.rmtree("temp_downloads")
        except:
            pass

print("\n✨ New Missions Added! You are ready to Retrain.")