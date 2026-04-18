from PIL import Image, ImageDraw

def build_perfect_front():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    # Left inner seam perfectly traced:
    left_inner_seam = [
        (95, 14), (90, 20), (84, 30), (79, 40), (75, 50), 
        (71, 60), (68, 70), (66, 80), (64, 90), (63, 100), 
        (61, 110), (60, 120), (59, 130), (58, 140), (57, 143)
    ]
    
    # Left polygon: Top-Left corner bounded by the seam and the armpit horizontal cut
    left_sleeve = [(95, 0)] + left_inner_seam + [(0, 143), (0, 0)]
    
    # Right inner seam perfectly traced:
    right_inner_seam = [
        (186, 14), (191, 20), (196, 30), (201, 40), (204, 50), 
        (207, 60), (210, 70), (213, 80), (215, 90), (217, 100), 
        (219, 110), (220, 120), (221, 130), (222, 140), (223, 143)
    ]
    # Reverse it so we can draw the bounding box in order, actually order doesn't matter for polygon fill if no self-intersection.
    # From armpit (223, 143) -> seam to collar (186, 14) -> Top Right (w, 0) -> Bottom Right edge (w, 143)
    right_inner_seam.reverse() # now from 143 up to 14
    right_sleeve = [(223, 143)] + right_inner_seam + [(186, 0), (w, 0), (w, 143)]

    mask_surface = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask_surface)
    draw.polygon(left_sleeve, fill=255)
    draw.polygon(right_sleeve, fill=255)

    out = Image.new("RGBA", (w, h), (0,0,0,0))
    md = mask_surface.load()
    od = out.load()
    bd = body.load()
    for y in range(h):
        for x in range(w):
            if md[x,y] == 255 and bd[x,y][3] > 0:
                od[x,y] = (255, 255, 255, bd[x,y][3])

    out.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/front_perfect.png')
    
    # Debug overlay to visually check
    gray_layer = Image.new("RGBA", (w,h), (0,0,0,0))
    gd = gray_layer.load()
    for y in range(h):
        for x in range(w):
            if od[x,y][3] > 0:
                gd[x,y] = (50, 50, 50, 255)
    img = Image.new('RGBA', body.size, (255, 0, 0, 255))
    img.paste(gray_layer, (0,0), gray_layer)
    overlay = Image.new('RGBA', img.size)
    for y in range(img.height):
        for x in range(img.width):
            c = img.getpixel((x,y))
            b = body.getpixel((x,y))
            if b[3] > 0:
                overlay.putpixel((x,y), (int(c[0]*b[0]/255), int(c[1]*b[1]/255), int(c[2]*b[2]/255), 255))
            else:
                overlay.putpixel((x,y), c)
    overlay.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/front_debug.png')

build_perfect_front()
