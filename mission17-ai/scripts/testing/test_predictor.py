import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils.predictor import Predictor


def test_ollama():
    print("Testing Ollama Predictor...")
    p = Predictor()
    print(f"Model configured: {p.get_model_name()}")
    
    # We will just see if we can reach the API
    # Since we need an image, let's create a dummy 1x1 black pixel image
    import io
    from PIL import Image
    
    img = Image.new('RGB', (10, 10), color = 'black')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()
    
    print("Sending dummy image to Ollama...")
    res = p.predict(img_bytes)
    print("Response:", res)

if __name__ == "__main__":
    test_ollama()
