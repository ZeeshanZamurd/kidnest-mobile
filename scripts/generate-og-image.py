#!/usr/bin/env python3
"""Generate Open Graph preview image with KidNest branding."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

WIDTH, HEIGHT = 1200, 630
GRADIENT_START = (0x7B, 0x4D, 0xFF)
GRADIENT_END = (0xFF, 0x4D, 0xB8)


def _gradient_bg() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT))
    px = img.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            t = (x / (WIDTH - 1) + y / (HEIGHT - 1)) / 2
            px[x, y] = tuple(
                int(GRADIENT_START[i] + (GRADIENT_END[i] - GRADIENT_START[i]) * t) for i in range(3)
            )
    return img


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: generate-og-image.py <logo.png> <output.png>", file=sys.stderr)
        return 1

    logo_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()

    logo = Image.open(logo_path).convert("RGBA")
    bg = _gradient_bg()

    size = 320
    logo = logo.resize((size, size), Image.Resampling.LANCZOS)
    x = (WIDTH - size) // 2
    y = (HEIGHT - size) // 2
    bg.paste(logo, (x, y), logo)

    draw = ImageDraw.Draw(bg)
    draw.text((WIDTH // 2, y + size + 36), "KidNest", fill=(255, 255, 255), anchor="mm")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    bg.save(output_path, format="PNG", optimize=True)
    print(f"OG image: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
