import os

def count_images():
    # Define the path to the dataset
    # Based on your other scripts, it is in ../dataset/mission_dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(base_dir, '..', 'dataset', 'mission_dataset')

    print(f"📊 Checking dataset at: {os.path.abspath(dataset_dir)}\n")

    if not os.path.exists(dataset_dir):
        print(f"❌ Error: Folder not found. Have you run 'organize_dataset.py'?")
        return

    total_images = 0
    
    # Get all subfolders (classes)
    try:
        classes = [d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))]
        classes.sort()
    except Exception as e:
        print(f"❌ Error reading directory: {e}")
        return

    print(f"{'CLASS NAME':<35} | {'COUNT':<10} | {'STATUS'}")
    print("-" * 50)

    for class_name in classes:
        class_path = os.path.join(dataset_dir, class_name)
        # Count files that look like images
        images = [f for f in os.listdir(class_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp'))]
        count = len(images)
        
        status = "✅ Ready" if count >= 100 else "⚠️ Low Data" if count > 0 else "❌ Empty"
        
        print(f"{class_name:<35} | {count:<10} | {status}")
        total_images += count

    print("-" * 50)
    print(f"✅ TOTAL IMAGES: {total_images}")

if __name__ == "__main__":
    count_images()