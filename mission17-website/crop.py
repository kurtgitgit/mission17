import sys
try:
    from PIL import Image
    import os

    img_path = 'public/bridge_bg.jpg'
    img = Image.open(img_path)
    # The watermark is usually at the bottom right. We'll crop 100px from the right and bottom.
    width, height = img.size
    # crop box is (left, upper, right, lower)
    cropped_img = img.crop((0, 0, width - 150, height - 150))
    cropped_img.save(img_path)
    print("Successfully cropped the image.")
except Exception as e:
    print(f"Error: {e}")
