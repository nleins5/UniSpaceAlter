from PIL import Image, ImageDraw

def test_front_custom():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    left_sleeve = [
        (95, 14), (60, 21), (30, 51), (17, 100), (14, 131),
        (58, 142),
        (60, 100), (66, 70), (73, 50), (83, 30), (95, 14)
    ]
    
    right_sleeve = [
        (185, 14), (220, 21), (250, 51), (266, 106), (267, 133),
        (223, 145),
        (221, 100), (214, 70), (206, 50), (198, 30), (185, 14)
    ]

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
    out.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/raglan_debug_front_custom.png')

test_front_custom()
