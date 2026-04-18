from PIL import Image, ImageDraw

def build_perfect_front_with_collar_fixed():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    left_inner_seam = [
        (95, 14), (90, 20), (84, 30), (79, 40), (75, 50), 
        (71, 60), (68, 70), (66, 80), (64, 90), (63, 100), 
        (61, 110), (60, 120), (59, 130), (58, 140), (57, 143)
    ]
    left_sleeve = [(95, 0)] + left_inner_seam + [(0, 143), (0, 0)]
    
    right_inner_seam = [
        (186, 14), (191, 20), (196, 30), (201, 40), (204, 50), 
        (207, 60), (210, 70), (213, 80), (215, 90), (217, 100), 
        (219, 110), (220, 120), (221, 130), (222, 140), (223, 143)
    ]
    right_inner_seam.reverse() 
    right_sleeve = [(223, 143)] + right_inner_seam + [(186, 0), (w, 0), (w, 143)]

    # Front Collar
    collar_bottom_curve = [
        (95, 14), (100, 25), (106, 35), (113, 44), (120, 50), 
        (130, 55), (140, 57), (150, 55), (160, 50), (167, 44), 
        (175, 35), (180, 25), (186, 14)
    ]
    
    # Wide closure ABOVE the curve to catch all collar parts
    collar_polygon = collar_bottom_curve + [(220, 14), (220, 0), (60, 0), (60, 14)]

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

build_perfect_front_with_collar_fixed()

def build_perfect_back_with_collar_fixed():
    body = Image.open('public/mockups/v_raglan_back.png').convert('RGBA')
    w, h = body.size
    
    left_inner_seam = [
        (97, 14), (92, 20), (86, 30), (80, 40), (76, 50), 
        (72, 60), (69, 70), (67, 80), (65, 90), (64, 100), 
        (62, 110), (61, 120), (60, 130), (59, 140), (58, 146)
    ]
    left_sleeve = [(97, 0)] + left_inner_seam + [(0, 146), (0, 0)]
    
    right_inner_seam = [
        (184, 14), (189, 20), (195, 30), (200, 40), (205, 50), 
        (209, 60), (212, 70), (214, 80), (216, 90), (217, 100), 
        (219, 110), (220, 120), (221, 130), (222, 140), (223, 146)
    ]
    right_inner_seam.reverse() 
    right_sleeve = [(223, 146)] + right_inner_seam + [(184, 0), (w, 0), (w, 146)]

    collar_bottom_curve = [
        (97, 14), (105, 25), (115, 32), (125, 36), (140, 38), 
        (155, 36), (165, 32), (175, 25), (184, 14)
    ]
    
    # Wide closure above collar curve
    collar_polygon = collar_bottom_curve + [(220, 14), (220, 0), (60, 0), (60, 14)]

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

    out.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/back_with_collar.png')
    
    # Update public/mockups
    Image.open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/front_with_collar.png').save('public/mockups/v_raglan_front_sleeve.png')
    out.save('public/mockups/v_raglan_back_sleeve.png')

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
    overlay.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/back_collar_debug.png')

build_perfect_back_with_collar_fixed()
