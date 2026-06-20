import os
import shutil
import random

# 👇 CONFIGURATION
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(CURRENT_DIR, '..', '..', '..', 'dataset', 'mission_dataset')

# Target: balance ALL classes to this count
# Set to None to auto-detect the median (safe default)
TARGET_COUNT = 500


def count_classes(dataset_dir):
    counts = {}
    for class_name in os.listdir(dataset_dir):
        class_path = os.path.join(dataset_dir, class_name)
        if os.path.isdir(class_path):
            images = [
                f for f in os.listdir(class_path)
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
            ]
            counts[class_name] = len(images)
    return counts


def balance_dataset():
    print(f"⚖️  Balancing ALL classes in: {DATASET_DIR}\n")

    if not os.path.exists(DATASET_DIR):
        print("❌ Error: Dataset folder not found.")
        return

    counts = count_classes(DATASET_DIR)

    if not counts:
        print("❌ No class folders found.")
        return

    # Determine target
    target = TARGET_COUNT
    if target is None:
        sorted_counts = sorted(counts.values())
        target = sorted_counts[len(sorted_counts) // 2]  # median
        print(f"📊 Auto-detected target (median): {target} images per class\n")
    else:
        print(f"📊 Target: {target} images per class\n")

    print(f"{'Class':<35} {'Before':>8} {'After':>8} {'Action'}")
    print("-" * 65)

    for class_name, count in sorted(counts.items()):
        class_path = os.path.join(DATASET_DIR, class_name)
        images = [
            f for f in os.listdir(class_path)
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
        ]

        if count > target:
            # Trim to target — shuffle first to keep a random selection
            random.shuffle(images)
            excess = images[target:]
            for img in excess:
                os.remove(os.path.join(class_path, img))
            after = target
            action = f"✂️  Trimmed -{len(excess)}"

        elif count < target:
            # Class is under-represented — warn user to add more images
            after = count
            action = f"⚠️  Under-represented (need +{target - count} more images)"

        else:
            after = count
            action = "✅ OK"

        print(f"{class_name:<35} {count:>8} {after:>8}   {action}")

    print("\n✨ Balancing complete! Now run train_ai.py to retrain the model.")
    print("   💡 TIP: For under-represented classes, collect more real photos")
    print("           or use Google Images to download additional training data.")


if __name__ == "__main__":
    balance_dataset()
