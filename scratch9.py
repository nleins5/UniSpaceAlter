from PIL import Image, ImageDraw

def build_front():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    left_sleeve = [
        (95, 14), (60, 21), (30, 51), (17, 100), (14, 131),
        (58, 142),
        (60, 100), (66, 70), (73, 50), (83, 30), (95, 14)
    ]
    
    right_sleeve = [(w-x, y) for x, y in reversed(left_sleeve)]

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
    print("Front built.")

def build_back():
    body = Image.open('public/mockups/v_raglan_back.png').convert('RGBA')
    w, h = body.size
    
    left_sleeve = [
        # Adjusting collar curve for back view (slightly higher)
        (98, 14), (60, 21), (30, 51), (17, 100), (14, 131),
        (58, 145),
        (60, 100), (66, 70), (73, 50), (83, 30), (98, 14)
    ]
    
    right_sleeve = [(w-x, y) for x, y in reversed(left_sleeve)]

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
    print("Back built.")

build_front()
build_back()
