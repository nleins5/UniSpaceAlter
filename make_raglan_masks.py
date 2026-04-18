from PIL import Image, ImageDraw

# FRONT
base_f = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
wf, hf = base_f.size

left_sleeve_f = [(91, 14), (60, 21), (30, 51), (13, 100), (9, 126), (55, 142), (60, 71), (69, 50)]
right_sleeve_f = [(165, 14), (196, 21), (226, 51), (243, 100), (247, 126), (201, 142), (196, 71), (187, 50)]

mask_surface_f = Image.new("L", (wf, hf), 0)
draw_f = ImageDraw.Draw(mask_surface_f)
draw_f.polygon(left_sleeve_f, fill=255)
draw_f.polygon(right_sleeve_f, fill=255)

out_f = Image.new("RGBA", (wf, hf), (0,0,0,0))
out_data_f = out_f.load()
base_data_f = base_f.load()
mask_data_f = mask_surface_f.load()
for y in range(hf):
    for x in range(wf):
        if mask_data_f[x,y] == 255 and base_data_f[x,y][3] > 0:
            out_data_f[x,y] = (255, 255, 255, 255)
out_f.save("public/mockups/v_raglan_front_sleeve.png")

# BACK
base_b = Image.open('public/mockups/v_raglan_back.png').convert('RGBA')
wb, hb = base_b.size

left_sleeve_b = [(75, 11), (64, 40), (47, 71), (38, 133), (7, 124), (11, 100), (27, 52), (47, 27), (60, 15)]
right_sleeve_b = [(180, 11), (200, 15), (220, 27), (240, 52), (255, 100), (257, 122), (216, 131), (210, 71), (192, 40)]

mask_surface_b = Image.new("L", (wb, hb), 0)
draw_b = ImageDraw.Draw(mask_surface_b)
draw_b.polygon(left_sleeve_b, fill=255)
draw_b.polygon(right_sleeve_b, fill=255)

out_b = Image.new("RGBA", (wb, hb), (0,0,0,0))
out_data_b = out_b.load()
base_data_b = base_b.load()
mask_data_b = mask_surface_b.load()
for y in range(hb):
    for x in range(wb):
        if mask_data_b[x,y] == 255 and base_data_b[x,y][3] > 0:
            out_data_b[x,y] = (255, 255, 255, 255)
out_b.save("public/mockups/v_raglan_back_sleeve.png")

