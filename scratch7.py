from PIL import Image, ImageDraw

def test_symmetry():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    # Trace left sleeve perfectly!
    # Let's look at raglan_grid_front.png carefully.
    # Center X is 140.5
    # Left collar: X=95, Y=14
    # Left armpit: X=60, Y=142
    # Inner arm curve (collar to armpit):
    # (95, 14) -> (83, 30) -> (73, 50) -> (66, 70) -> (60, 100) -> (58, 142)
    # Bottom hem: (58, 142) to (14, 131)
    # Outer arm curve (shoulder to hem):
    # (95, 14) -> (60, 21) -> (30, 51) -> (17, 100) -> (14, 131)
    
    # Left Sleeve:
    left_sleeve = [
        # Outer
        (95, 14), (60, 21), (30, 51), (17, 100), (14, 131),
        # Hem
        (58, 142),
        # Inner
        (60, 100), (66, 70), (73, 50), (83, 30), (95, 14)
    ]
    
    # Mirror Left Sleeve to Right Sleeve
    right_sleeve = []
    for x, y in left_sleeve:
        # mirror across X=w/2
        rx = w - x
        right_sleeve.append((rx, y))
    # Reverse right sleeve to keep clockwise/counter-clockwise orientation
    right_sleeve.reverse()

    mask_surface = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask_surface)
    draw.polygon(left_sleeve, fill=255)
    draw.polygon(right_sleeve, fill=255)

    grey_layer = Image.new("RGBA", (w, h), (0,0,0,0))
    md = mask_surface.load()
    gd = grey_layer.load()
    bd = body.load()
    for y in range(h):
        for x in range(w):
            if md[x,y] == 255 and bd[x,y][3] > 0:
                gd[x,y] = (50, 50, 50, 255)
                
    img = Image.new('RGBA', body.size, (255, 0, 0, 255))
    img.paste(grey_layer, (0,0), grey_layer)
    out = Image.new('RGBA', img.size)
    for y in range(img.height):
        for x in range(img.width):
            c = img.getpixel((x,y))
            b = body.getpixel((x,y))
            if b[3] > 0:
                out.putpixel((x,y), (int(c[0]*b[0]/255), int(c[1]*b[1]/255), int(c[2]*b[2]/255), 255))
            else:
                out.putpixel((x,y), c)
    out.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/raglan_debug2.png')

test_symmetry()
