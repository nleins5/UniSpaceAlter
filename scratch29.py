from PIL import Image

def trace_real_armpit():
    # Use the flood filled mask to find the bottom-most pixel of the inner seam!
    try:
        mask = Image.open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/v_raglan_front_sleeve_debug.png').convert('L')
    except:
        mask = Image.open('public/mockups/v_raglan_front_sleeve.png').convert('L') # from earlier

    # Let's find the bottom-most point of the LEFT sleeve mask!
    # The sleeve mask is white (255)
    w, h = mask.size
    
    # We look for the lowest Y that has a white pixel in the left half
    lowest_y = 0
    bottom_x = 0
    for y in range(h):
        for x in range(w//2):
            if mask.getpixel((x,y)) > 128:
                lowest_y = y
                bottom_x = x
                
    print(f"Lowest point of left sleeve (cuff): X={bottom_x}, Y={lowest_y}")
    
    # What about the ARMPIT? The armpit is the right-most point of the left sleeve's BOTTOM edge.
    # Actually, the armpit is the lowest point of the INNER seam.
    # Let's just scan the mask and print its shape.
    for y in range(110, 150, 5):
        line = ""
        for x in range(50, 80):
            if mask.getpixel((x,y)) > 128:
                line += "#"
            else:
                line += "."
        print(f"Y={y}: {line}")

trace_real_armpit()
