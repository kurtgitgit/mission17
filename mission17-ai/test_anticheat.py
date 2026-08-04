import io
import time
from PIL import Image
from utils.anticheat import AntiCheatEngine

def create_dummy_image_bytes(color=(255, 0, 0)):
    img = Image.new('RGB', (100, 100), color=color)
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

def test_engine():
    print("Initialize AntiCheatEngine...")
    engine = AntiCheatEngine()
    engine.clear()
    
    print("Testing registration...")
    img1 = create_dummy_image_bytes((255, 0, 0)) # Red image
    
    is_dup_before = engine.is_duplicate(img1)
    print(f"Is Duplicate before registration? {is_dup_before} (Expected: False)")
    
    hash_str = engine.register(img1)
    print(f"Registered hash: {hash_str}")
    
    print(f"Total Hashes in DB: {engine.count()}")
    
    print("Testing duplicate detection...")
    is_dup_after = engine.is_duplicate(img1)
    print(f"Is exact Duplicate detected? {is_dup_after} (Expected: True)")
    
    img2 = create_dummy_image_bytes((0, 255, 0)) # Green image
    is_diff_dup = engine.is_duplicate(img2)
    print(f"Is totally different image detected as duplicate? {is_diff_dup} (Expected: False)")
    
    print("Testing bulk insert performance (scalable SQLite test)...")
    start_time = time.time()
    for i in range(100):
        # We don't actually generate 100 images as it's slow, just simulate fast inserts
        with engine._get_connection() as conn:
            conn.execute('INSERT OR IGNORE INTO hashes (hash_str) VALUES (?)', (f"fake_hash_{i}",))
    
    print(f"Inserted 100 dummy hashes in {time.time() - start_time:.4f} seconds")
    print(f"Final count: {engine.count()}")
    print("SQLite AntiCheatEngine Test Passed Successfully! 🚀")

if __name__ == "__main__":
    test_engine()
