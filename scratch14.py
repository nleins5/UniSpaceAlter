from PIL import Image, ImageDraw

def create_magic_wand_mask():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    gray = body.convert('L')
    # Threshold: make internal pixels say 100, and lines 0
    # Wait, the body has a lot of transparent pixels! Where alpha is 0.
    
    # Let's create a pure image where background is black, inside is white, lines are black.
    target = Image.new('L', (w, h), 0)
    for y in range(h):
        for x in range(w):
            r,g,b,a = body.getpixel((x,y))
            if a > 0:
                if r < 100 and g < 100 and b < 100: # It's a dark line
                    target.putpixel((x,y), 0)
                else:
                    target.putpixel((x,y), 255) # white inside

    ImageDraw.floodfill(target, (35, 70), value=128, border=0)
    ImageDraw.floodfill(target, (250, 70), value=128, border=0)
    
    # Now extract the 128
    mask = Image.new("RGBA", (w,h), (0,0,0,0))
    for y in range(h):
        for x in range(w):
            if target.getpixel((x,y)) == 128:
                mask.putpixel((x,y), (255,255,255,255))
                
    mask.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/test_floodfill.png')

create_magic_wand_mask()
