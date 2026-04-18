from PIL import Image

def analyze_mask():
    img = Image.open('public/mockups/v_raglan_front_sleeve.png').convert('RGBA')
    # Check pixels below Y=143. If my hypothesis is correct, they should be transparent (alpha=0).
    print("Testing Y=150, left side (waist area):")
    for x in range(0, 100, 10):
        print(f"X={x}, Y=150: {img.getpixel((x, 150))}")

analyze_mask()
