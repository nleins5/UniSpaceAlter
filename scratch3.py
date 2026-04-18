from PIL import Image

def analyze_image(path):
    try:
        img = Image.open(path).convert('RGBA')
        data = img.getdata()
        opaque = [p for p in data if p[3] > 0]
        if not opaque:
            # no opaque pixels
            return 'empty'
        
        # average color
        avg_r = sum([p[0] for p in opaque]) / len(opaque)
        avg_g = sum([p[1] for p in opaque]) / len(opaque)
        avg_b = sum([p[2] for p in opaque]) / len(opaque)
        return (avg_r, avg_g, avg_b)
    except Exception as e:
        return str(e)

print("v_polo:", analyze_image("public/mockups/v_polo_front.png"))
print("v_tshirt:", analyze_image("public/mockups/v_tshirt_front.png"))
print("v_raglan:", analyze_image("public/mockups/v_raglan_front.png"))

