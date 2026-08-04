import os
import sqlite3
import io
import imagehash
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_FILE = os.path.join(BASE_DIR, 'anticheat.db')

class AntiCheatEngine:
    def __init__(self):
        self._init_db()

    def _get_connection(self):
        # Create a new connection per thread/request
        conn = sqlite3.connect(DB_FILE)
        # Register hamming distance function in SQLite to offload calculation
        conn.create_function("hamming_distance", 2, self._hamming_distance)
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS hashes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hash_str TEXT UNIQUE
                )
            ''')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_hash_str ON hashes(hash_str)')
            conn.commit()

    def _hamming_distance(self, hash1_str, hash2_str):
        try:
            h1 = imagehash.hex_to_hash(hash1_str)
            h2 = imagehash.hex_to_hash(hash2_str)
            return h1 - h2
        except Exception:
            return 999

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
        Checks if the image is a duplicate using SQLite optimized functions.
        """
        p_hash_str, d_hash_str = self.get_hashes(file_bytes)
        
        if not p_hash_str or not d_hash_str:
            return False

        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Fast exact match
            cursor.execute('SELECT 1 FROM hashes WHERE hash_str = ? OR hash_str = ? LIMIT 1', (p_hash_str, d_hash_str))
            if cursor.fetchone():
                return True

            # 2. Slower similarity match using the custom SQLite function
            cursor.execute('''
                SELECT 1 FROM hashes 
                WHERE hamming_distance(hash_str, ?) < ? 
                   OR hamming_distance(hash_str, ?) < ?
                LIMIT 1
            ''', (p_hash_str, similarity_threshold, d_hash_str, similarity_threshold))
            
            if cursor.fetchone():
                return True

        return False

    def register(self, file_bytes):
        """Registers a new image hash to prevent future duplicates."""
        p_hash_str, d_hash_str = self.get_hashes(file_bytes)
        
        with self._get_connection() as conn:
            if p_hash_str:
                conn.execute('INSERT OR IGNORE INTO hashes (hash_str) VALUES (?)', (p_hash_str,))
            if d_hash_str:
                conn.execute('INSERT OR IGNORE INTO hashes (hash_str) VALUES (?)', (d_hash_str,))
            conn.commit()
            
        return p_hash_str

    def clear(self):
        with self._get_connection() as conn:
            conn.execute('DELETE FROM hashes')
            conn.commit()
        return 0

    def count(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM hashes')
            return cursor.fetchone()[0]
