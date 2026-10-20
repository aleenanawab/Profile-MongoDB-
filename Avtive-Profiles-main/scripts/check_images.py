import glob, os
from PIL import Image

files = sorted(glob.glob("extracted_*.png"), key=lambda x: int(x.split("_")[1].split(".")[0]))
for f in files:
    im = Image.open(f)
    print(f"{f}: size={im.size}, mode={im.mode}")
