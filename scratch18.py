from PIL import Image, ImageDraw, ImageFilter

def create_dilated_mask(filename, left_seed, right_seed):
    body = Image.open(f'public/mockups/{filename}.png').convert('RGBA')
    w, h = body.size
    
    target = Image.new('L', (w, h), 0)
    for y in range(h):
        for x in range(w):
            r,g,b,a = body.getpixel((x,y))
            if a > 50:
                if r < 120 and g < 120 and b < 120:
                    target.putpixel((x,y), 0) # border
                else:
                    target.putpixel((x,y), 255) # internal area
                    
    # Floodfill sleeves
    ImageDraw.floodfill(target, left_seed, value=128, border=0)
    ImageDraw.floodfill(target, right_seed, value=128, border=0)
    
    sleeve_mask = Image.new('L', (w, h), 0)
    for y in range(h):
        for x in range(w):
            if target.getpixel((x,y)) == 128:
                sleeve_mask.putpixel((x,y), 255)
    
    # 5x5 window = 2 pixels dilation
    dilated = sleeve_mask.filter(ImageFilter.MaxFilter(5))
    
    # Check if the right sleeve was filled!
    right_filled = False
    for y in range(h):
        for x in range(w//2, w):
            if dilated.getpixel((x,y)) == 255:
                right_filled = True
                break
    print(f"{filename} right sleeve filled: {right_filled}")

    out = Image.new("RGBA", (w, h), (0,0,0,0))
    md = dilated.load()
    od = out.load()
    bd = body.load()
    for y in range(h):
        for x in range(w):
            if md[x,y] == 255 and bd[x,y][3] > 0:
                od[x,y] = (255, 255, 255, bd[x,y][3])

    out.save(f'public/mockups/{filename}_sleeve.png')
    out.save(f'/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/{filename}_sleeve_debug.png')

create_dilated_mask('v_raglan_front', (35, 70), (235, 70))
create_dilated_mask('v_raglan_back', (35, 70), (235, 70))

