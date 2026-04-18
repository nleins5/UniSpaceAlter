from PIL import Image

def analyze_triangle():
    img = Image.open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/front_collar_debug.png')
    
    # Let's see if there is any RED (unmasked) pixel inside the collar region.
    # The collar region is roughly Y=10 to Y=25 near X=100.
    print(f"X=97, Y=14: {img.getpixel((97, 14))}")
    print(f"X=98, Y=15: {img.getpixel((98, 15))}")
    print(f"X=95, Y=11: {img.getpixel((95, 11))}")
    print(f"X=184, Y=11: {img.getpixel((184, 11))}")

analyze_triangle()
