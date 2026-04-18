from PIL import Image

def extract_perfect_seam():
    mask = Image.open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/v_raglan_front_sleeve_debug.png').convert('L')
    w, h = mask.size
    
    left_seam = []
    # For the left sleeve, the inner seam is the right-most point of the white region for each Y.
    for y in range(14, 150):
        rightmost_x = -1
        # Scan from junction X=95 to left
        for x in range(100, -1, -1):
            if mask.getpixel((x,y)) > 128:
                rightmost_x = x
                break
        if rightmost_x != -1:
            left_seam.append((rightmost_x, y))
            
    print("Left seam array:")
    print(left_seam)

extract_perfect_seam()
