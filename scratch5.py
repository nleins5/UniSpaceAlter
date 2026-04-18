from PIL import Image

def analyze(path):
    img = Image.open(path).convert('RGBA')
    print(f"Size of {path}: {img.size}")

analyze('public/mockups/v_raglan_front.png')
analyze('public/mockups/v_raglan_front_sleeve.png')

