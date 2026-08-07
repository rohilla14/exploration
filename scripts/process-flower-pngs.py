#!/usr/bin/env python3
"""Remove solid black (or white) backgrounds from watercolor flower PNGs.

Uses edge flood-fill so intentional dark ink washes inside the art stay intact.
Also downscales oversized assets for faster bouquet loading.
"""

from collections import deque
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "public" / "assets" / "flowers"
# Near-black treated as background when connected to the edge
BLACK_LUMA = 28
# Soft edge feather distance in luma
FEATHER = 22
# Max long-edge after processing (bouquet never needs 2k art)
MAX_EDGE = 900


def luma(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def remove_edge_black(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    visited = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    def maybe_seed(x: int, y: int) -> None:
        r, g, b, a = px[x, y]
        if a == 0:
            return
        if luma(r, g, b) <= BLACK_LUMA + FEATHER:
            queue.append((x, y))
            visited[y][x] = True

    for x in range(w):
        maybe_seed(x, 0)
        maybe_seed(x, h - 1)
    for y in range(h):
        maybe_seed(0, y)
        maybe_seed(w - 1, y)

    bg = [[False] * w for _ in range(h)]
    while queue:
        x, y = queue.popleft()
        r, g, b, _a = px[x, y]
        L = luma(r, g, b)
        if L > BLACK_LUMA + FEATHER:
            continue
        bg[y][x] = True
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                nr, ng, nb, na = px[nx, ny]
                if na == 0:
                    visited[ny][nx] = True
                    continue
                if luma(nr, ng, nb) <= BLACK_LUMA + FEATHER:
                    visited[ny][nx] = True
                    queue.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if not bg[y][x]:
                continue
            r, g, b, _a = px[x, y]
            L = luma(r, g, b)
            if L <= BLACK_LUMA:
                px[x, y] = (r, g, b, 0)
            else:
                t = (L - BLACK_LUMA) / FEATHER
                px[x, y] = (r, g, b, int(max(0, min(1, t)) * 255))

    return img


def downscale(img: Image.Image) -> Image.Image:
    w, h = img.size
    long_edge = max(w, h)
    if long_edge <= MAX_EDGE:
        return img
    scale = MAX_EDGE / long_edge
    return img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def main():
    for path in sorted(ASSETS.glob("*.png")):
        print(f"Processing {path.name}...")
        img = Image.open(path)
        out = downscale(remove_edge_black(img))
        out.save(path, "PNG", optimize=True)
        print(f"  -> saved {path.name} ({out.size[0]}x{out.size[1]}, RGBA)")


if __name__ == "__main__":
    main()
