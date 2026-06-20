from bing_image_downloader import downloader
import os
import shutil
import math

# 👇 CONFIGURATION
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'dataset', 'mission_dataset')

# Target images per class — everything will be brought up to this number
TARGET = 500

# ─────────────────────────────────────────────────────────────────────────────
# CLASS DEFINITIONS
# Each class has:
#   "current": how many images it already has
#   "terms":   list of 5 search terms to download from
#
# limit_per_term = ceil((TARGET - current) / len(terms))
# Classes already at TARGET are automatically skipped.
# ─────────────────────────────────────────────────────────────────────────────
CLASSES = {

    # 🍱 SDG 1/2: Donation — WEAKEST CLASS (150 → 500, needs +350, 70/term)
    "SDG1_2_Donation": {
        "current": 150,
        "terms": [
            "people donating food to community",
            "clothes donation box charity",
            "feeding program volunteers serving food",
            "grocery donation drive event",
            "charity relief goods distribution"
        ]
    },

    # 🏖️ SDG 6/14: Cleanup — WEAKEST CLASS (150 → 500, needs +350, 70/term)
    "SDG6_14_Cleanup": {
        "current": 150,
        "terms": [
            "beach cleanup volunteers collecting trash",
            "river cleanup community activity",
            "coastal cleanup garbage bags collected",
            "people picking up litter shoreline",
            "estero creek waterway cleanup"
        ]
    },

    # 📚 SDG 4: Education (253 → 500, needs +247, 50/term)
    "SDG4_Quality_Education": {
        "current": 253,
        "terms": [
            "student reading open book",
            "teacher writing on whiteboard classroom",
            "group study session library",
            "hand writing notes in notebook",
            "child using educational tablet learning"
        ]
    },

    # 🏃 SDG 3: Health (262 → 500, needs +238, 48/term)
    "SDG3_Health_Wellbeing": {
        "current": 262,
        "terms": [
            "people jogging in park",
            "group yoga session outdoors",
            "eating fresh fruit salad bowl",
            "drinking glass of water healthy",
            "washing hands with soap hygiene"
        ]
    },

    # 🛍️ SDG 8: Support Local (267 → 500, needs +233, 47/term)
    "SDG8_Support_Local": {
        "current": 267,
        "terms": [
            "buying from street food vendor",
            "shopping at local farmers market",
            "artisan crafting handmade goods",
            "small bakery local shop front",
            "supporting small business community"
        ]
    },

    # 🌱 SDG 13/15: Planting (270 → 500, needs +230, 46/term)
    "SDG13_15_Planting": {
        "current": 270,
        "terms": [
            "person planting tree sapling",
            "community tree planting activity",
            "garden seedling transplanting soil",
            "plant growing hands holding soil",
            "reforestation volunteers planting trees"
        ]
    },

    # 🏙️ SDG 11: Sustainable Cities (275 → 500, needs +225, 45/term)
    "SDG11_Sustainable_Cities": {
        "current": 275,
        "terms": [
            "riding bicycle on city road",
            "passengers inside public city bus",
            "waiting at train station platform",
            "walking on pedestrian crossing street",
            "segregated bike lane urban city"
        ]
    },

    # ⚡ SDG 7: Clean Energy (277 → 500, needs +223, 45/term)
    "SDG7_Clean_Energy": {
        "current": 277,
        "terms": [
            "solar panels on house roof",
            "hand turning off light switch",
            "electric vehicle charging station",
            "wind turbine farm landscape",
            "modern led light bulb energy saving"
        ]
    },

    # 🚫 Non-SDG Invalid (430 → 500, needs +70, 14/term)
    "Non_SDG_Invalid": {
        "current": 430,
        "terms": [
            "random indoor selfie photo",
            "luxury sports car fast",
            "video game screenshot gaming",
            "cat sleeping on sofa",
            "abstract digital art wallpaper"
        ]
    },

    # ♻️ SDG 12: Recycling — ALREADY AT TARGET (500), will be skipped
    "SDG12_Recycling": {
        "current": 500,
        "terms": []
    },
}

# ─────────────────────────────────────────────────────────────────────────────

print(f"🚀 Smart Data Collection — Target: {TARGET} images per class")
print(f"   Dataset path: {BASE_DIR}\n")

if not os.path.exists(BASE_DIR):
    print(f"❌ ERROR: Could not find '{BASE_DIR}'. Check your folder structure.")
    exit()

total_added = 0

for category, info in CLASSES.items():
    current   = info["current"]
    terms     = info["terms"]
    needed    = TARGET - current

    # Skip classes already at or above target
    if needed <= 0:
        print(f"⏭️  [{category}] already at {current}/{TARGET} — SKIPPED\n")
        continue

    limit_per_term = math.ceil(needed / len(terms))
    target_dir = os.path.join(BASE_DIR, category)
    os.makedirs(target_dir, exist_ok=True)

    print(f"📂 [{category}]")
    print(f"   {current} → {TARGET}  |  need +{needed}  |  {limit_per_term} images/term")

    category_added = 0

    for term in terms:
        print(f"   🔍 '{term}' ({limit_per_term} images)...")
        try:
            downloader.download(
                term,
                limit=limit_per_term,
                output_dir="temp_downloads",
                adult_filter_off=True,
                force_replace=False,
                timeout=10,
                verbose=False
            )

            source_folder = os.path.join("temp_downloads", term)
            if os.path.exists(source_folder):
                files = os.listdir(source_folder)
                moved = 0
                for file in files:
                    old_path = os.path.join(source_folder, file)
                    if not os.path.isfile(old_path):
                        continue
                    clean_term = term.replace(" ", "_")
                    new_filename = f"{clean_term}_{file}"
                    new_path = os.path.join(target_dir, new_filename)
                    if os.path.exists(new_path):
                        continue  # Skip duplicates
                    try:
                        shutil.move(old_path, new_path)
                        moved += 1
                    except Exception:
                        pass
                print(f"      ✅ +{moved} images")
                category_added += moved

        except Exception as e:
            print(f"   ⚠️  Skipped '{term}': {e}")

        # Clean up temp after each term
        if os.path.exists("temp_downloads"):
            try:
                shutil.rmtree("temp_downloads")
            except Exception:
                pass

    new_total = current + category_added
    print(f"   📊 Result: {current} → {new_total} images (+{category_added})\n")
    total_added += category_added

print("=" * 55)
print(f"✨ Done! Total new images added: {total_added}")
print(f"   All classes should now be near {TARGET} images each.")
print("\n   Next steps:")
print("   1. python train_ai.py        ← retrain the model")
print("   2. python evaluate_model.py  ← check accuracy")