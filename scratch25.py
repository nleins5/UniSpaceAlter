from PIL import Image, ImageDraw

# Remaking perfect flawless 15-point masks WITHOUT the collar included.
# This makes the Collar take the BODY color!

def build_perfect_front():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    left_inner_seam = [
        (95, 14), (90, 20), (84, 30), (79, 40), (75, 50), 
        (71, 60), (68, 70), (66, 80), (64, 90), (63, 100), 
        (61, 110), (60, 120), (59, 130), (58, 140), (57, 143)
    ]
    # Bound the left sleeve perfectly
    left_sleeve = [(95, 0)] + left_inner_seam + [(0, 143), (0, 0)]
    
    right_inner_seam = [
        (186, 14), (191, 20), (196, 30), (201, 40), (204, 50), 
        (207, 60), (210, 70), (213, 80), (215, 90), (217, 100), 
        (219, 110), (220, 120), (221, 130), (222, 140), (223, 143)
    ]
    right_inner_seam.reverse() 
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

    out.save('public/mockups/v_raglan_front_sleeve.png')
    print("Front reverted to NO collar.")

def build_perfect_back():
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

    out.save('public/mockups/v_raglan_back_sleeve.png')
    print("Back reverted to NO collar.")

build_perfect_front()
build_perfect_back()
