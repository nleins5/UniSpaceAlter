from PIL import Image, ImageDraw

base_path = "public/mockups/v_polo_front.png"
base = Image.open(base_path).convert("RGBA")
width, height = base.size

# Exact geometries derived from the pixel grid
left_flap = [(135, 12), (128, 25), (142, 71), (172, 65), (176, 56), (135, 12)]
right_flap = [(218, 12), (224, 25), (210, 71), (180, 65), (178, 56), (218, 12)]
back_neck = [(135, 12), (142, 28), (210, 28), (218, 12), (176, 15)]
placket = [(165, 56), (175, 52), (178, 52), (185, 56), (185, 115), (165, 115)]

mask_surface = Image.new("L", (width, height), 0)
draw = ImageDraw.Draw(mask_surface)
draw.polygon(left_flap, fill=255)
draw.polygon(right_flap, fill=255)
draw.polygon(back_neck, fill=255)
draw.polygon(placket, fill=255)

# PUNCH HOLES for buttons so they stand out and don't get covered by collar color
# Top button approx center: 175, 87. R=3 => bbox: 172, 84, 178, 90
draw.ellipse([171, 83, 179, 91], fill=0)
# Bottom button approx center: 175, 103. R=3 => bbox: 172, 100, 178, 106
draw.ellipse([171, 99, 179, 107], fill=0)


base_data = base.load()
mask_data = mask_surface.load()
out_img = Image.new("RGBA", (width, height), (0,0,0,0))
out_data = out_img.load()
for y in range(height):
    for x in range(width):
        if mask_data[x, y] == 255 and base_data[x, y][3] > 0:
            out_data[x, y] = (255, 255, 255, 255)

out_img.save("public/mockups/v_polo_front_collar.png")
