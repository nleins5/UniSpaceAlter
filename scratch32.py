from PIL import Image, ImageDraw

def process_masks():
    front_mask = Image.open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/v_raglan_front_sleeve_debug.png').convert('L')
    back_mask = Image.open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/v_raglan_back_sleeve_debug.png').convert('L')
    
    body_front = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    body_back = Image.open('public/mockups/v_raglan_back.png').convert('RGBA')
    
    def create_vector_mask(mask_img, base_body, name):
        w, h = mask_img.size
        left_seam = []
        right_seam = []
        
        # We need the inner bound contour.
        # For each Y from 0 to h:
        for y in range(h):
            # Left Seam (right-most edge of left sleeve)
            rx = -1
            for x in range(w // 2, -1, -1):  # start from middle, go left
                if mask_img.getpixel((x,y)) > 128:
                    rx = x
                    break
            if rx != -1:
                left_seam.append((rx, y))
                
            # Right Seam (left-most edge of right sleeve)
            lx = -1
            for x in range(w // 2, w):
                if mask_img.getpixel((x,y)) > 128:
                    lx = x
                    break
            if lx != -1:
                right_seam.append((lx, y))
                
        # Now left_seam represents the rightmost edge of the left sleeve for every Y.
        # If we just draw a polygon from (-10, y_end) down the left seam to (-10, y_start),
        # it will cover the entire left sleeve perfectly.
        # But wait, what about the top curve over the shoulder?
        # The collar/shoulder boundary is also captured!!!
        # Because we scanned from the middle to the left. The first white pixel we hit IS the inner seam/collar boundary!
        # This is PERFECT!
        
        # Let's clean up left_seam to just be an array
        left_sleeve_poly = [(-10, left_seam[-1][1])]
        for p in reversed(left_seam):
            left_sleeve_poly.append(p)
        left_sleeve_poly.append((-10, left_seam[0][1]))
        
        right_sleeve_poly = [(w+10, right_seam[-1][1])]
        for p in reversed(right_seam):
            right_sleeve_poly.append(p)
        right_sleeve_poly.append((w+10, right_seam[0][1]))

        mask_surface = Image.new("L", (w, h), 0)
        draw = ImageDraw.Draw(mask_surface)
        draw.polygon(left_sleeve_poly, fill=255)
        draw.polygon(right_sleeve_poly, fill=255)

        out = Image.new("RGBA", (w, h), (0,0,0,0))
        md = mask_surface.load()
        od = out.load()
        bd = base_body.load()
        for y in range(h):
            for x in range(w):
                if md[x,y] == 255 and bd[x,y][3] > 0:
                    od[x,y] = (255, 255, 255, bd[x,y][3])

        out.save(f'public/mockups/{name}_sleeve.png')
        print(f"Generated {name}_sleeve.png magically!")

    create_vector_mask(front_mask, body_front, 'v_raglan_front')
    create_vector_mask(back_mask, body_back, 'v_raglan_back')

process_masks()
