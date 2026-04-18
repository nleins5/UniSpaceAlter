from PIL import Image

def generate_preview():
    # Load base body
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    sleeve = Image.open('public/mockups/v_raglan_front_sleeve.png').convert('RGBA')
    w, h = body.size

    # Color the body RED
    body_red = Image.new("RGBA", (w, h), (0,0,0,0))
    bd = body_red.load()
    orig_b = body.load()
    for y in range(h):
        for x in range(w):
            if orig_b[x,y][3] > 0:
                bd[x,y] = (255, 0, 0, orig_b[x,y][3])

    # Color the sleeve BLUE
    sleeve_blue = Image.new("RGBA", (w, h), (0,0,0,0))
    sd = sleeve_blue.load()
    orig_s = sleeve.load()
    for y in range(h):
        for x in range(w):
            if orig_s[x,y][3] > 0:
                sd[x,y] = (0, 0, 255, orig_s[x,y][3])

    # Composite
    comp = Image.alpha_composite(body_red, sleeve_blue)
    comp.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/final_test_visual.png')
    
generate_preview()
