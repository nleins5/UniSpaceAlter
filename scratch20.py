from PIL import Image, ImageDraw

def build_perfect_front_with_collar():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    # Left inner seam perfectly traced:
    left_inner_seam = [
        (95, 14), (90, 20), (84, 30), (79, 40), (75, 50), 
        (71, 60), (68, 70), (66, 80), (64, 90), (63, 100), 
        (61, 110), (60, 120), (59, 130), (58, 140), (57, 143)
    ]
    left_sleeve = [(95, 0)] + left_inner_seam + [(0, 143), (0, 0)]
    
    # Right inner seam perfectly traced:
    right_inner_seam = [
        (186, 14), (191, 20), (196, 30), (201, 40), (204, 50), 
        (207, 60), (210, 70), (213, 80), (215, 90), (217, 100), 
        (219, 110), (220, 120), (221, 130), (222, 140), (223, 143)
    ]
    right_inner_seam.reverse() 
    right_sleeve = [(223, 143)] + right_inner_seam + [(186, 0), (w, 0), (w, 143)]

    # Collar Polygon (Front View)
    # The front lower curve goes from 95,14 to 186,14.
    # The back inner curve goes from 104,11 (approx) down to 140,24 and up to 176,11.
    # We want the entire collar! So everything between these curves.
    # Since the area ABOVE the collar is transparent neck hole, and the rest is white, 
    # we can draw a polygon that covers the whole top neck area and let Alpha composite handle the edges!
    # Wait, the alpha mask is NOT transparent inside the back-collar! The back-collar is part of the shirt!
    # The neck hole background is transparent, but the collar IS the shirt.
    # If the neck hole is transparent, we can just cover a rectangle: (95, 0) to (186, 57).
    # Wait! If we cover to Y=57, we will clip into the BODY! The body is in the center right below the collar!
    # So the BOTTOM curve of the collar MUST be perfectly traced!
    
    # Front Collar Bottom Curve (The seam connecting collar to body chest):
    # From left to right:
    collar_bottom_curve = [
        (95, 14), (100, 25), (106, 35), (113, 44), (120, 50), 
        (130, 55), (140, 57), (150, 55), (160, 50), (167, 44), 
        (175, 35), (180, 25), (186, 14)
    ]
    
    # We can just make the polygon go straight UP from (186,14) to (186,0), across to (95,0) and down to (95,14).
    # Because above the collar is the neck opening (which is transparent) and the back collar (which we ALSO WANT to color!).
    # Wait, do we want to color the back collar too? "Collar matches sleeves". Yes, the entire collar binding should be colored!
    # So the only boundary that matters for the collar is the bottom curve where it touches the chest!
    collar_polygon = collar_bottom_curve + [(186, 0), (95, 0)]

    mask_surface = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask_surface)
    draw.polygon(left_sleeve, fill=255)
    draw.polygon(right_sleeve, fill=255)
    draw.polygon(collar_polygon, fill=255)

    out = Image.new("RGBA", (w, h), (0,0,0,0))
    md = mask_surface.load()
    od = out.load()
    bd = body.load()
    for y in range(h):
        for x in range(w):
            if md[x,y] == 255 and bd[x,y][3] > 0:
                od[x,y] = (255, 255, 255, bd[x,y][3])

    out.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/front_with_collar.png')

    # Debug
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
    overlay.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/front_collar_debug.png')

build_perfect_front_with_collar()
