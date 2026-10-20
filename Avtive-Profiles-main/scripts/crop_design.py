import pymupdf
from PIL import Image

doc = pymupdf.open('desktop.pdf')
page = doc[0]

# Render full page at 4x resolution (DPI 288)
pix = page.get_pixmap(dpi=288)
pix.save("page_1_4x.png")

# Let's check size
img = Image.open("page_1_4x.png")
print("Rendered 4x size:", img.size)

# Let's crop the left side (Editor panel) and the right side (Preview / Navigation / Accordion list)
# Total width 1720, height 3728
w, h = img.size
left_crop = img.crop((0, 0, int(w * 0.55), h))
left_crop.save("crop_left_editor.png")

right_crop = img.crop((int(w * 0.40), 0, w, h))
right_crop.save("crop_right_menu.png")

print("Saved crop_left_editor.png and crop_right_menu.png")
