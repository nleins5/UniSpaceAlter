import base64

def generate_preview():
    with open('public/mockups/v_raglan_front.png', 'rb') as f:
        front_b64 = base64.b64encode(f.read()).decode('utf-8')
    with open('public/mockups/v_raglan_front_sleeve.png', 'rb') as f:
        sleeve_b64 = base64.b64encode(f.read()).decode('utf-8')

    html = f"""
    <html>
    <body style="background: white;">
        <div style="position: relative; width: 281px; height: 295px; background: lightblue;">
            <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; mix-blend-mode: multiply; background-image: url(data:image/png;base64,{front_b64});"></div>
            <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background-color: purple; mask-image: url(data:image/png;base64,{sleeve_b64}); -webkit-mask-image: url(data:image/png;base64,{sleeve_b64});"></div>
            <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; mix-blend-mode: multiply; background-image: url(data:image/png;base64,{front_b64});"></div>
        </div>
    </body>
    </html>
    """
    with open('/Users/lananh/.gemini/antigravity/brain/5b1e4144-8cb8-45ee-b4d0-5e8804794129/preview.html', 'w') as f:
        f.write(html)

generate_preview()
