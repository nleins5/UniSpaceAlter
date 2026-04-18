from PIL import Image, ImageDraw

base_path = "public/mockups/v_polo_front.png"
base = Image.open(base_path).convert("RGBA")
width, height = base.size

# Left Flap
left_flap = [(135, 12), (128, 25), (142, 71), (172, 65), (176, 56), (135, 12)]
# Right Flap
right_flap = [(218, 12), (224, 25), (210, 71), (180, 65), (178, 56), (218, 12)]
# Back neck collar band
back_neck = [(135, 12), (142, 28), (210, 28), (218, 12), (176, 15)]
# Placket
placket = [(165, 65), (176, 56), (178, 56), (185, 65), (185, 108), (165, 108)]

mask_surface = Image.new("L", (width, height), 0)
draw = ImageDraw.Draw(mask_surface)
draw.polygon(left_flap, fill=255)
draw.polygon(right_flap, fill=255)
draw.polygon(back_neck, fill=255)
draw.polygon(placket, fill=255)

base_data = base.load()
mask_data = mask_surface.load()
out_img = Image.new("RGBA", (width, height), (0,0,0,0))
out_data = out_img.load()
for y in range(height):
    for x in range(width):
        if mask_data[x, y] == 255 and base_data[x, y][3] > 0:
            out_data[x, y] = (255, 0, 0, 255)

# Render base under it to see the contrast
combined = Image.alpha_composite(base, out_img)

# Crop
crop_box = (100, 0, 280, 120)
cropped = combined.crop(crop_box)
scale = 5
cropped_scaled = cropped.resize((180 * scale, 120 * scale), Image.NEAREST)

cropped_scaled.save("/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/collar_with_placket_test2.png")
