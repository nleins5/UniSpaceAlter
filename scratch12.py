from PIL import Image, ImageDraw

def build_front_custom():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    left_sleeve = [
        (96, 14), (60, 21), (30, 51), (17, 100), (14, 131),
        (56, 142), # hem to armpit
        (60, 100), (68, 70), (75, 50), (84, 30), (96, 14)
    ]
    
    right_sleeve = [
        (186, 14), (220, 21), (250, 51), (266, 106), (267, 133),
        (225, 144),
        (223, 100), (216, 70), (209, 50), (199, 30), (186, 14)
    ]

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
    print("Front custom built.")

def build_back_custom():
    body = Image.open('public/mockups/v_raglan_back.png').convert('RGBA')
    w, h = body.size
    
    left_sleeve = [
        (98, 14), (60, 21), (30, 51), (17, 100), (14, 131),
        (56, 145),
        (62, 100), (68, 70), (75, 50), (84, 30), (98, 14)
    ]
    
    right_sleeve = [
        (183, 14), (220, 21), (250, 51), (266, 106), (267, 131),
        (225, 145),
        (223, 100), (216, 70), (208, 50), (199, 30), (183, 14)
    ]

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
    print("Back custom built.")

build_front_custom()
build_back_custom()
