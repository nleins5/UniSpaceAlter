from PIL import Image, ImageDraw

def create_magic_wand_mask():
    body = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    w, h = body.size
    
    # Create mask purely via flood fill
    # Right sleeve point: X=240, Y=70
    # Left sleeve point: X=40, Y=70
    # Let's see if we can do a fuzzy flood fill.
    # Since boundary is dark pixels, we can threshold the image, then flood fill.
    
    # 1. Convert body to grayscale
    gray = body.convert('L')
    
    # 2. Threshold: everything darker than say 200 is boundary.
    threshold = gray.point(lambda p: 255 if p > 230 else 0, mode='1')
    
    # We will use ImageDraw.floodfill
    mask = Image.new('L', (w, h), 0)
    
    # We want to fill the sleeves with 255.
    ImageDraw.floodfill(mask, (35, 70), value=255, border=None)
    ImageDraw.floodfill(mask, (250, 70), value=255, border=None)
    mask.save('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/test_floodfill.png')

create_magic_wand_mask()
