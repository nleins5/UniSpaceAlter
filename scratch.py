from PIL import Image, ImageDraw

img = Image.open('public/mockups/v_polo_back.png').convert('RGBA')

# Crop the top center area
crop_box = (100, 0, 280, 120)
cropped = img.crop(crop_box)

scale = 5
cropped_scaled = cropped.resize((180 * scale, 120 * scale), Image.NEAREST)

draw = ImageDraw.Draw(cropped_scaled)
for x in range(0, 180, 10):
    draw.line([(x * scale, 0), (x * scale, 120 * scale)], fill=(255, 0, 0, 128))
    draw.text((x * scale + 2, 2), str(x + 100), fill=(255, 0, 0))
for y in range(0, 120, 10):
    draw.line([(0, y * scale), (180 * scale, y * scale)], fill=(255, 0, 0, 128))
    draw.text((2, y * scale + 2), str(y), fill=(255, 0, 0))

cropped_scaled.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/collar_grid_back.png')
