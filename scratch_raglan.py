from PIL import Image, ImageDraw

img = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')

# Crop the full shirt area with nice pixel metrics, since raglan goes diagonally across
# The shirt is mostly from X=50 to X=350, Y=0 to Y=400
# Let's scale it slightly less to keep the image size reasonable
scale = 3
w, h = img.size
cropped_scaled = img.resize((w * scale, h * scale), Image.NEAREST)

draw = ImageDraw.Draw(cropped_scaled)
for x in range(0, w, 20):
    draw.line([(x * scale, 0), (x * scale, h * scale)], fill=(255, 0, 0, 128))
    draw.text((x * scale + 2, 2), str(x), fill=(255, 0, 0))
for y in range(0, h, 20):
    draw.line([(0, y * scale), (w * scale, y * scale)], fill=(255, 0, 0, 128))
    draw.text((2, y * scale + 2), str(y), fill=(255, 0, 0))

cropped_scaled.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/raglan_grid_front.png')

img_b = Image.open('public/mockups/v_raglan_back.png').convert('RGBA')
cropped_scaled_b = img_b.resize((w * scale, h * scale), Image.NEAREST)
draw_b = ImageDraw.Draw(cropped_scaled_b)
for x in range(0, w, 20):
    draw_b.line([(x * scale, 0), (x * scale, h * scale)], fill=(255, 0, 0, 128))
    draw_b.text((x * scale + 2, 2), str(x), fill=(255, 0, 0))
for y in range(0, h, 20):
    draw_b.line([(0, y * scale), (w * scale, y * scale)], fill=(255, 0, 0, 128))
    draw_b.text((2, y * scale + 2), str(y), fill=(255, 0, 0))
cropped_scaled_b.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/raglan_grid_back.png')
