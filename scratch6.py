from PIL import Image

def test_composite(front_size, sleeve_size):
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    sleeve = Image.open('public/mockups/v_raglan_front_sleeve.png').convert('RGBA')

    # Simulate the browser render
    img = Image.new('RGBA', body.size, (255, 0, 0, 255)) # body background red
    
    # Apply sleeve mask (overwriting red with dark grey)
    grey_layer = Image.new('RGBA', sleeve.size, (50, 50, 50, 255))
    img.paste(grey_layer, (0,0), sleeve)

    # Multiply the body details 
    out = Image.new('RGBA', img.size)
    for y in range(img.height):
        for x in range(img.width):
            c = img.getpixel((x,y))
            b = body.getpixel((x,y))
            # Multiply
            if b[3] > 0:
                r = int(c[0] * b[0] / 255)
                g = int(c[1] * b[1] / 255)
                bl = int(c[2] * b[2] / 255)
                out.putpixel((x,y), (r,g,bl, 255))
            else:
                out.putpixel((x,y), c)
                
    out.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/raglan_debug.png')

test_composite(None, None)
