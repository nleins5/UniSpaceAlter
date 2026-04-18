from PIL import Image, ImageDraw

base_path = "public/mockups/v_polo_front.png"
base = Image.open(base_path).convert("RGBA")
width, height = base.size

front_collar = [(133, 12), (128, 25), (142, 71), (172, 65), (176, 56), (178, 56), (180, 65), (210, 71), (224, 25), (219, 12), (176, 15)]
mask_surface = Image.new("L", (width, height), 0)
draw = ImageDraw.Draw(mask_surface)
draw.polygon(front_collar, fill=255)
base_data = base.load()
mask_data = mask_surface.load()
out_img = Image.new("RGBA", (width, height), (0,0,0,0))
out_data = out_img.load()
for y in range(height):
    for x in range(width):
        if mask_data[x, y] == 255 and base_data[x, y][3] > 0:
            out_data[x, y] = (255, 255, 255, 255)  
out_img.save("public/mockups/v_polo_front_collar.png")

base_b = Image.open("public/mockups/v_polo_back.png").convert("RGBA")
wb, hb = base_b.size
back_collar = [(131, 23), (144, 25), (176, 27), (209, 25), (222, 23), (213, 9), (139, 9)]
mask_surface_b = Image.new("L", (wb, hb), 0)
draw_b = ImageDraw.Draw(mask_surface_b)
draw_b.polygon(back_collar, fill=255)
base_data_b = base_b.load()
mask_data_b = mask_surface_b.load()
out_img_b = Image.new("RGBA", (wb, hb), (0,0,0,0))
out_data_b = out_img_b.load()
for y in range(hb):
    for x in range(wb):
        if mask_data_b[x, y] == 255 and base_data_b[x, y][3] > 0:
            out_data_b[x, y] = (255, 255, 255, 255) 
out_img_b.save("public/mockups/v_polo_back_collar.png")
