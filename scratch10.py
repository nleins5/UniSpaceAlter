from PIL import Image, ImageDraw, ImageFont
import os

def create_grid(filename):
    img = Image.open(f'public/mockups/{filename}.png').convert('RGBA')
    scale = 3
    w, h = img.size
    cropped_scaled = img.resize((w * scale, h * scale), Image.NEAREST)
    
    draw = ImageDraw.Draw(cropped_scaled)
    font = ImageFont.load_default()
    
    for x in range(0, w, 20):
        draw.line([(x * scale, 0), (x * scale, h * scale)], fill='cyan', width=1)
        draw.text((x * scale, 10), str(x), fill='red', font=font)

    for y in range(0, h, 20):
        draw.line([(0, y * scale), (w * scale, y * scale)], fill='cyan', width=1)
        draw.text((10, y * scale), str(y), fill='red', font=font)
        
    out_path = f'/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/{filename}_grid.png'
    cropped_scaled.save(out_path)
    print(f"Saved {out_path}")

create_grid('v_raglan_front')
create_grid('v_raglan_back')
