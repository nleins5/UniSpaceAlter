import urllib.request
# Wait, I already have front_collar_debug.png locally! Let me double check it.
from PIL import Image

def analyze_debug():
    img = Image.open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/front_collar_debug.png')
    # The inner collar is at X=140, Y=20 roughly.
    print(f"Front Inner collar pixel X=140, Y=20: {img.getpixel((140, 20))}")
    
    img_back = Image.open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/back_collar_debug.png')
    # The inner collar on back view is at the bottom of the neck hole.
    # At X=140, Y=50
    print(f"Back Inner collar pixel X=140, Y=50: {img_back.getpixel((140, 50))}")

analyze_debug()
