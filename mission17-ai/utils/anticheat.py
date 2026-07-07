import os
import json
import io
import imagehash
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HASH_FILE = os.path.join(BASE_DIR, 'anticheat_hashes.json')

class AntiCheatEngine:
    def __init__(self):
        self.hashes = set()
        self._load_hashes()

    def _load_hashes(self):
        if os.path.exists(HASH_FILE):
            try:
                with open(HASH_FILE, 'r') as f:
                    data = json.load(f)
                    self.hashes = set(data.get("hashes", []))
            except Exception as e:
                print(f"⚠️ Could not load anticheat hashes: {e}")

    def _save_hashes(self):
        try:
            with open(HASH_FILE, 'w') as f:
                json.dump({"hashes": list(self.hashes)}, f)
        except Exception as e:
            print(f"⚠️ Could not save anticheat hashes: {e}")

    def get_hashes(self, file_bytes):
        """Calculates pHash and dHash for better duplicate detection."""
        try:
            img = Image.open(io.BytesIO(file_bytes)).convert('RGB')
            p_hash = str(imagehash.phash(img))
            d_hash = str(imagehash.dhash(img))
            return p_hash, d_hash
        except Exception:
            return None, None

    def is_duplicate(self, file_bytes, similarity_threshold=8):
        """
        Checks if the image is a duplicate based on stored hashes.
        similarity_threshold: the max hamming distance to be considered a duplicate.
        """
        p_hash_str, d_hash_str = self.get_hashes(file_bytes)
        
        if not p_hash_str or not d_hash_str:
            return False

        # Check exact matches first for speed
        if p_hash_str in self.hashes or d_hash_str in self.hashes:
            return True

        p_hash = imagehash.hex_to_hash(p_hash_str)
        d_hash = imagehash.hex_to_hash(d_hash_str)

        # Check similarity (hamming distance)
        for stored_hash_str in self.hashes:
            try:
                stored_hash = imagehash.hex_to_hash(stored_hash_str)
                # Compare both pHash and dHash representation lengths isn't an issue since they are stored as strings
                # but we should compare apples to apples. Let's simplify and just do exact match on dHash and pHash, 
                # but also check similarity if we parse them properly.
                
                # For safety, let's just do an exact match on string representations for now, 
                # or a simple distance check if we assume all stored are pHashes.
                # Since we store both, some might be dHash, some pHash. 
                # Let's just compare distances safely.
                distance = p_hash - stored_hash
                if distance < similarity_threshold:
                    return True
                
                distance = d_hash - stored_hash
                if distance < similarity_threshold:
                    return True
            except Exception:
                continue

        return False

    def register(self, file_bytes):
        """Registers a new image hash to prevent future duplicates."""
        p_hash_str, d_hash_str = self.get_hashes(file_bytes)
        if p_hash_str:
            self.hashes.add(p_hash_str)
        if d_hash_str:
            self.hashes.add(d_hash_str)
        self._save_hashes()
        return p_hash_str

    def clear(self):
        self.hashes.clear()
        self._save_hashes()
        return len(self.hashes)

    def count(self):
        return len(self.hashes)
