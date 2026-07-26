#!/usr/bin/env python3
"""Regenerate the site's icons and the default social-preview image.

    python3 scripts/generate-icons.py

Outputs into assets/img/:
    icon-32.png          favicon fallback for browsers without SVG support
    icon-180.png         apple-touch-icon
    icon-192.png         site logo (referenced by jekyll-seo-tag)
    og-default.png       1200x630 Open Graph / Twitter card fallback

The hand-written assets/img/favicon.svg is the primary favicon; these are the
raster fallbacks. Requires Pillow.
"""

import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")

BG = (23, 25, 29)
ACCENT = (232, 131, 58)
TEXT = (215, 218, 224)
MUTED = (150, 157, 176)

BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def centred(draw, box, text, fnt, fill):
    """Draw text centred in box = (x0, y0, x1, y1)."""
    x0, y0, x1, y1 = box
    left, top, right, bottom = draw.textbbox((0, 0), text, font=fnt)
    x = x0 + (x1 - x0 - (right - left)) / 2 - left
    y = y0 + (y1 - y0 - (bottom - top)) / 2 - top
    draw.text((x, y), text, font=fnt, fill=fill)


def icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(size * 0.22)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)
    # Accent underline, echoing the site header rule.
    bar_h = max(2, int(size * 0.06))
    d.rounded_rectangle(
        [int(size * 0.22), int(size * 0.74), int(size * 0.78), int(size * 0.74) + bar_h],
        radius=bar_h // 2,
        fill=ACCENT,
    )
    centred(d, (0, int(size * 0.04), size, int(size * 0.74)), "ma",
            font(BOLD, int(size * 0.52)), TEXT)
    return img


def og():
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, w, 10], fill=ACCENT)

    d.text((90, 200), "Michael Aebli", font=font(BOLD, 86), fill=TEXT)
    d.text((90, 320), "Embedded development, Rust,", font=font(REGULAR, 44), fill=MUTED)
    d.text((90, 380), "and the M-Bus protocol", font=font(REGULAR, 44), fill=MUTED)
    d.text((90, 500), "maebli.github.io", font=font(REGULAR, 34), fill=ACCENT)

    badge = icon(120)
    img.paste(badge, (w - 210, 200), badge)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    for size in (32, 180, 192):
        path = os.path.join(OUT, "icon-%d.png" % size)
        icon(size).save(path)
        print("wrote", path)

    path = os.path.join(OUT, "og-default.png")
    og().save(path)
    print("wrote", path)


if __name__ == "__main__":
    main()
