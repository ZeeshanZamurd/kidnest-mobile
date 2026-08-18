#!/usr/bin/env python3
"""Prepare KidNest logo assets from a source PNG/JPEG."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# Brand gradient matches constants/branding.ts (horizontal purple → pink).
GRADIENT_START = (0x7B, 0x4D, 0xFF)
GRADIENT_END = (0xFF, 0x4D, 0xB8)
DARK_GRADIENT_START = (0x55, 0x32, 0xBF)
DARK_GRADIENT_END = (0xD6, 0x3D, 0x98)

# Splash layout — matches constants/branding.ts LOGO_SIZES.splash (168dp).
SPLASH_LOGO_DP = 168
SPLASH_TITLE_DP = 28
SPLASH_TAGLINE_DP = 14
SPLASH_LOGO_TEXT_GAP_DP = 20
SPLASH_TITLE_TAGLINE_GAP_DP = 10
SPLASH_TITLE_TRACKING_DP = 5
SPLASH_TITLE_KIDO = "Kido"
SPLASH_TITLE_NEST = "Nest"
SPLASH_TAGLINE = "Safe Learning & Growth"
# Website wordmark — white Kido + yellow Nest on gradient splash.
SPLASH_KIDO_COLOR = (255, 255, 255, 255)
SPLASH_NEST_COLOR = (0xFF, 0xD9, 0x3D, 255)

BLACK_THRESHOLD = 12
ALPHA_VISIBLE = 16
CROP_PADDING = 8
CANVAS_SIZE = 1024
# Adaptive icon / legacy Android mipmaps: ~70% fits inside OS mask without clipping.
SAFE_LAUNCHER = 0.70
# iOS home screen: squircle fills the slot (iOS applies its own rounded mask).
IOS_FILL_RATIO = 1.0
# Android 12+ splash uses a circular mask — scale logo to fill more of the circle.
SAFE_SPLASH = 0.82


def _remove_black_letterbox(img: Image.Image) -> Image.Image:
    pixels = img.load()
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0 and r <= BLACK_THRESHOLD and g <= BLACK_THRESHOLD and b <= BLACK_THRESHOLD:
                pixels[x, y] = (0, 0, 0, 0)
    return img


def _clean_alpha_fringe(img: Image.Image) -> Image.Image:
    pixels = img.load()
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                pixels[x, y] = (0, 0, 0, 0)
            elif a < 24:
                pixels[x, y] = (0, 0, 0, 0)
            elif a < 255 and r < 48 and g < 48 and b < 48:
                pixels[x, y] = (0, 0, 0, 0)
    return img


def _content_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    pixels = img.load()
    width, height = img.size
    min_x, min_y, max_x, max_y = width, height, 0, 0
    found = False
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > ALPHA_VISIBLE:
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if not found:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def _crop_to_content(img: Image.Image) -> Image.Image:
    bbox = _content_bbox(img)
    if bbox is None:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - CROP_PADDING)
    top = max(0, top - CROP_PADDING)
    right = min(img.width, right + CROP_PADDING)
    bottom = min(img.height, bottom + CROP_PADDING)
    return img.crop((left, top, right, bottom))


def _center_opaque_color(img: Image.Image) -> tuple[int, int, int]:
    px = img.load()
    cx, cy = img.width // 2, img.height // 2
    r, g, b, a = px[cx, cy]
    if a == 0:
        return GRADIENT_START
    return (r, g, b)


def _make_linear_gradient(size: int, start: tuple[int, int, int] = GRADIENT_START, end: tuple[int, int, int] = GRADIENT_END) -> Image.Image:
    """Brand gradient — matches RN LinearGradient start (0,0) → end (1,1)."""
    img = Image.new("RGB", (size, size))
    pixels = img.load()
    denom = max(size - 1, 1)
    for y in range(size):
        for x in range(size):
            t = (x / denom + y / denom) / 2
            pixels[x, y] = tuple(int(start[i] + (end[i] - start[i]) * t) for i in range(3))
    return img


def _make_portrait_gradient(
    width: int,
    height: int,
    start: tuple[int, int, int] = GRADIENT_START,
    end: tuple[int, int, int] = GRADIENT_END,
) -> Image.Image:
    """Full-screen splash gradient — horizontal left (purple) → right (pink)."""
    img = Image.new("RGB", (width, height))
    pixels = img.load()
    denom_x = max(width - 1, 1)
    for y in range(height):
        for x in range(width):
            t = x / denom_x
            pixels[x, y] = tuple(int(start[i] + (end[i] - start[i]) * t) for i in range(3))
    return img


def _load_brand_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/SFNSRounded.ttf",
        "/System/Library/Fonts/SFCompactRounded.ttf",
        "/System/Library/Fonts/Supplemental/Verdana Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _text_width_tracking(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, tracking: int) -> int:
    if not text:
        return 0
    width = 0
    for index, char in enumerate(text):
        bbox = draw.textbbox((0, 0), char, font=font)
        width += bbox[2] - bbox[0]
        if index < len(text) - 1:
            width += tracking
    return width


def _draw_text_tracking(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int, int],
    tracking: int,
) -> None:
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        bbox = draw.textbbox((0, 0), char, font=font)
        x += (bbox[2] - bbox[0]) + tracking


def _resize_logo(ui: Image.Image, size: int) -> Image.Image:
    return ui.resize((size, size), Image.Resampling.LANCZOS)


def _make_splash_branding(ui: Image.Image, scale: int = 3) -> Image.Image:
    """Transparent splash branding — logo + title + tagline (shared by iOS & Android)."""
    logo_px = SPLASH_LOGO_DP * scale
    title_px = SPLASH_TITLE_DP * scale
    tagline_px = SPLASH_TAGLINE_DP * scale
    logo_gap = SPLASH_LOGO_TEXT_GAP_DP * scale
    title_gap = SPLASH_TITLE_TAGLINE_GAP_DP * scale
    tracking = SPLASH_TITLE_TRACKING_DP * (scale / 3)
    h_pad = 48 * scale
    v_pad = 24 * scale

    logo = _resize_logo(ui, logo_px)
    title_font = _load_brand_font(title_px, bold=True)
    tagline_font = _load_brand_font(tagline_px, bold=False)

    measure = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(measure)
    kido_w = _text_width_tracking(draw, SPLASH_TITLE_KIDO, title_font, int(tracking))
    nest_w = _text_width_tracking(draw, SPLASH_TITLE_NEST, title_font, int(tracking))
    title_w = kido_w + nest_w
    title_bbox = draw.textbbox((0, 0), SPLASH_TITLE_KIDO, font=title_font)
    title_h = title_bbox[3] - title_bbox[1]
    tag_bbox = draw.textbbox((0, 0), SPLASH_TAGLINE, font=tagline_font)
    tag_w = tag_bbox[2] - tag_bbox[0]
    tag_h = tag_bbox[3] - tag_bbox[1]

    width = max(logo_px, title_w, tag_w) + 2 * h_pad
    height = logo_px + logo_gap + title_h + title_gap + tag_h + 2 * v_pad
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.paste(logo, ((width - logo_px) // 2, v_pad), logo)

    draw = ImageDraw.Draw(canvas)
    title_y = v_pad + logo_px + logo_gap
    title_x = (width - title_w) // 2
    _draw_text_tracking(
        draw,
        (title_x, title_y),
        SPLASH_TITLE_KIDO,
        title_font,
        SPLASH_KIDO_COLOR,
        int(tracking),
    )
    _draw_text_tracking(
        draw,
        (title_x + kido_w, title_y),
        SPLASH_TITLE_NEST,
        title_font,
        SPLASH_NEST_COLOR,
        int(tracking),
    )
    tag_y = title_y + title_h + title_gap
    draw.text(
        ((width - tag_w) // 2, tag_y),
        SPLASH_TAGLINE,
        font=tagline_font,
        fill=(255, 255, 255, 210),
    )
    return canvas


def _make_splash_composite(
    ui: Image.Image,
    width: int,
    height: int,
    start: tuple[int, int, int] = GRADIENT_START,
    end: tuple[int, int, int] = GRADIENT_END,
) -> Image.Image:
    """Full iOS launch screen — gradient + branding in one image (no layer/color drift)."""
    canvas = _make_portrait_gradient(width, height, start, end).convert("RGBA")
    branding = _make_splash_branding(ui, scale=3)
    x = (width - branding.width) // 2
    y = (height - branding.height) // 2
    canvas.paste(branding, (x, y), branding)
    return canvas.convert("RGB")


def _make_launch_splash_icon(ui: Image.Image, width: int, height: int, icon_pt: int = 200) -> Image.Image:
    """Legacy launch icon screen — gradient + transparent logo only (no icon background box)."""
    canvas = _make_portrait_gradient(width, height).convert("RGBA")
    icon_px = icon_pt * 3
    icon = _resize_logo(ui, icon_px)
    x = (width - icon_px) // 2
    y = (height - icon_px) // 2
    canvas.paste(icon, (x, y), icon)
    return canvas.convert("RGB")


def _make_solid_launcher_icon(
    ui: Image.Image,
    canvas_size: int = CANVAS_SIZE,
    safe_ratio: float = SAFE_LAUNCHER,
    bg_rgb: tuple[int, int, int] = GRADIENT_START,
) -> Image.Image:
    """Android legacy / iOS — logo on solid brand purple (no pink gradient)."""
    cropped = _crop_to_content(ui)
    cw, ch = cropped.size
    target = int(canvas_size * safe_ratio)
    scale = target / max(cw, ch)
    new_w = max(1, int(cw * scale))
    new_h = max(1, int(ch * scale))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (*bg_rgb, 255))
    canvas.paste(resized, ((canvas_size - new_w) // 2, (canvas_size - new_h) // 2), resized)
    return canvas.convert("RGB")


def _make_ios_app_icon(ui: Image.Image, canvas_size: int = CANVAS_SIZE) -> Image.Image:
    """iOS home screen — logo on solid purple, scaled to fill the slot."""
    return _make_solid_launcher_icon(ui, canvas_size, IOS_FILL_RATIO, GRADIENT_START)


def _fit_on_canvas(img: Image.Image, canvas_size: int, safe_ratio: float, opaque: bool) -> Image.Image:
    """Scale logo to safe_ratio of canvas and center — prevents OS mask clipping."""
    cropped = _crop_to_content(img)
    cw, ch = cropped.size
    target = int(canvas_size * safe_ratio)
    scale = target / max(cw, ch)
    new_w = max(1, int(cw * scale))
    new_h = max(1, int(ch * scale))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    if opaque:
        fill = _center_opaque_color(resized)
        canvas = Image.new("RGB", (canvas_size, canvas_size), fill)
        canvas.paste(resized, ((canvas_size - new_w) // 2, (canvas_size - new_h) // 2), resized)
        return canvas

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.paste(resized, ((canvas_size - new_w) // 2, (canvas_size - new_h) // 2), resized)
    return canvas


def prepare_logo(input_path: Path, brand_dir: Path) -> None:
    img = Image.open(input_path).convert("RGBA")
    img = _remove_black_letterbox(img)
    ui = _clean_alpha_fringe(img.copy())
    launcher = _make_solid_launcher_icon(ui)
    # Transparent logo for adaptive foreground — background color comes from ic_launcher_background.xml.
    foreground = _fit_on_canvas(ui, CANVAS_SIZE, SAFE_LAUNCHER, opaque=False)
    splash_native = _fit_on_canvas(ui, CANVAS_SIZE, SAFE_SPLASH, opaque=False)

    ios_icon = _make_ios_app_icon(ui)
    splash_gradient = _make_portrait_gradient(1290, 2796)
    splash_gradient_dark = _make_portrait_gradient(1290, 2796, DARK_GRADIENT_START, DARK_GRADIENT_END)
    splash_branding = _make_splash_branding(ui, scale=3)
    splash_screen = _make_splash_composite(ui, 1290, 2796)
    splash_screen_dark = _make_splash_composite(ui, 1290, 2796, DARK_GRADIENT_START, DARK_GRADIENT_END)
    launch_splash_icon = _make_launch_splash_icon(ui, 1290, 2796)

    brand_dir.mkdir(parents=True, exist_ok=True)
    ui.save(brand_dir / "app-icon-ui.png", format="PNG", optimize=True)
    launcher.save(brand_dir / "app-icon-launcher.png", format="PNG", optimize=True)
    foreground.save(brand_dir / "app-icon-foreground.png", format="PNG", optimize=True)
    splash_native.save(brand_dir / "app-icon-splash-native.png", format="PNG", optimize=True)
    ios_icon.save(brand_dir / "app-icon-ios.png", format="PNG", optimize=True)
    splash_gradient.save(brand_dir / "splash-gradient.png", format="PNG", optimize=True)
    splash_gradient_dark.save(brand_dir / "splash-gradient-dark.png", format="PNG", optimize=True)
    splash_branding.save(brand_dir / "splash-branding.png", format="PNG", optimize=True)
    splash_screen.save(brand_dir / "splash-screen.png", format="PNG", optimize=True)
    splash_screen_dark.save(brand_dir / "splash-screen-dark.png", format="PNG", optimize=True)
    launch_splash_icon.save(brand_dir / "launch-splash-icon.png", format="PNG", optimize=True)
    ui.save(brand_dir / "app-icon-source.png", format="PNG", optimize=True)


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: prepare-logo-source.py <input-image> [brand-dir]", file=sys.stderr)
        return 1

    input_path = Path(sys.argv[1]).resolve()
    brand_dir = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else input_path.parent

    if not input_path.is_file():
        print(f"Input not found: {input_path}", file=sys.stderr)
        return 1

    prepare_logo(input_path, brand_dir)
    print(f"Prepared logo assets in: {brand_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
