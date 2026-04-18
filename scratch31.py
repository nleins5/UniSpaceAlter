from PIL import Image

def analyze_collar():
    img = Image.open('public/mockups/v_raglan_front.png').convert('RGBA')
    # Let's print out the structure around X=90..100, Y=0..15
    for y in range(5, 16):
        line = ""
        for x in range(85, 105):
            p = img.getpixel((x,y))
            if p[3] == 0:
                line += " "
            elif p[0] < 50:
                line += "#" # dark outline
            else:
                line += "." # white fabric
        print(f"Y={y:2}: {line}")

analyze_collar()
