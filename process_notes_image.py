import os
from PIL import Image, ImageOps

src_path = r'C:\Users\Mehboob\.gemini\antigravity-ide\brain\4782bc71-55fa-4e82-a0ed-04ae01307fc1\media__1784915820896.png'
dest_path = r'c:\Power BI\Farming\cattle_farm_mobile\assets\rs_notes.png'

# Load the image
img = Image.open(src_path).convert("RGBA")
datas = img.getdata()

newData = []
# Background is dark charcoal.
# We will make any pixel transparent if it is dark and neutral (background color).
# The background ranges around r, g, b < 65 with low variance (saturations).
for item in datas:
    r, g, b, a = item
    # Brightness threshold
    # Also ensure it is close to neutral (background is grey/black, not colored)
    is_neutral = abs(r - g) < 15 and abs(r - b) < 15 and abs(g - b) < 15
    is_dark = r < 60 and g < 60 and b < 65
    
    # Bottom right/left corners can be slightly brighter dark grey, check sum
    is_very_dark = (r + g + b) < 165 and is_neutral

    if is_very_dark or (is_dark and is_neutral):
        # Make transparent
        newData.append((r, g, b, 0))
    else:
        newData.append(item)

img.putdata(newData)

# Crop the image to remove excess transparent borders automatically
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Save the transparent image
img.save(dest_path, "PNG")
print("Image background made transparent, cropped, and saved to assets/rs_notes.png!")
