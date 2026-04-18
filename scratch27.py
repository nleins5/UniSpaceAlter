from PIL import Image, ImageDraw

def draw_polygon_debug():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    left_inner_seam = [
        (95, 14), (90, 20), (84, 30), (79, 40), (75, 50), 
        (71, 60), (68, 70), (66, 80), (64, 90), (63, 100), 
        (61, 110), (60, 120), (59, 130), (58, 140), (57, 143)
    ]
    left_sleeve = [(95, 0)] + left_inner_seam + [(0, 143), (0, 0)]
    
    right_inner_seam = [
        (186, 14), (191, 20), (196, 30), (201, 40), (204, 50), 
        (207, 60), (210, 70), (213, 80), (215, 90), (217, 100), 
        (219, 110), (220, 120), (221, 130), (222, 140), (223, 143)
    ]
    right_inner_seam.reverse() 
    right_sleeve = [(223, 143)] + right_inner_seam + [(186, 0), (w, 0), (w, 143)]

    # Draw the polygons in semi-transparent red over the body
    overlay = Image.new("RGBA", (w, h), (0,0,0,0))
    draw = ImageDraw.Draw(overlay)
    draw.polygon(left_sleeve, fill=(255,0,0,128))
    draw.polygon(right_sleeve, fill=(255,0,0,128))

    res = Image.alpha_composite(body, overlay)
    res.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/polygon_check.png')
    
draw_polygon_debug()
