from PIL import Image

def analyze_image():
    # Let me just dump the v_raglan_front.png to a text representation of its non-transparent bounds
    # and print it out to terminal.
    img = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = img.size
    print(f"Size: {w}x{h}")
    
    # Armpit is the junction where the sleeve, body, and background meet.
    # We can trace it by finding the first non-transparent pixel in each row!
    for y in range(0, h, 10):
        for x in range(w):
            if img.getpixel((x,y))[3] > 0:
                print(f"Row {y} left-most non-transparent pixel: {x}")
                break

analyze_image()
