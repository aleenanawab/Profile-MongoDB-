import pymupdf
import json

doc = pymupdf.open('desktop.pdf')
page = doc[0]

print(f"Page size: {page.rect.width} x {page.rect.height}")

# Text elements with positions, fonts, colors
blocks = page.get_text("dict")["blocks"]
text_elements = []
for b in blocks:
    if b.get("type") == 0:
        for line in b["lines"]:
            for span in line["spans"]:
                txt = span["text"].strip()
                if txt:
                    color_hex = f"#{span['color']:06X}"
                    bbox = [round(x, 1) for x in span["bbox"]]
                    text_elements.append({
                        "text": span["text"],
                        "bbox": bbox,
                        "font": span["font"],
                        "size": round(span["size"], 1),
                        "color": color_hex,
                        "flags": span["flags"]
                    })

print(f"Extracted {len(text_elements)} text spans.")
with open("scripts/extracted_text.json", "w", encoding="utf-8") as f:
    json.dump(text_elements, f, indent=2)

for item in text_elements:
    print(f"[{item['bbox']}] ({item['size']}px, {item['color']}, {item['font']}): {item['text']}")
