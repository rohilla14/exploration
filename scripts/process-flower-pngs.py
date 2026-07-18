#!/usr/bin/env python3
"""Remove white/near-white backgrounds from watercolor flower PNGs."""

from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "public" / "assets" / "flowers"
THRESHOLD = 235  # pixels brighter than this become transparent
FEATHER = 18     # soft edge transition range


def remove_white_bg(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            brightness = (r + g + b) / 3
            if brightness >= THRESHOLD:
                pixels[x, y] = (r, g, b, 0)
            elif brightness >= THRESHOLD - FEATHER:
                # Soft feather for watercolor edges
                t = (brightness - (THRESHOLD - FEATHER)) / FEATHER
                alpha = int((1 - t) * 255)
                pixels[x, y] = (r, g, b, alpha)

    return img


def main():
    for path in sorted(ASSETS.glob("*.png")):
        print(f"Processing {path.name}...")
        img = Image.open(path)
        out = remove_white_bg(img)
        out.save(path, "PNG", optimize=True)
        print(f"  → saved {path.name} ({out.size[0]}×{out.size[1]}, RGBA)")


if __name__ == "__main__":
    main()
