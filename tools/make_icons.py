from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / "aigc" / "quick-export-icon.png").convert("RGBA")
pixels = source.load()
width, height = source.size

dark = Image.new("RGBA", (width, height))
light = Image.new("RGBA", (width, height))
dark_pixels = dark.load()
light_pixels = light.load()

for y in range(height):
    for x in range(width):
        red, green, blue, _ = pixels[x, y]
        luminance = (red + green + blue) / 3
        alpha = max(0, min(255, int((luminance - 45) * 6)))
        if alpha == 0:
            dark_pixels[x, y] = (0, 0, 0, 0)
            light_pixels[x, y] = (0, 0, 0, 0)
            continue

        is_blue = blue > red * 1.25 and blue > green * 1.03
        dark_pixels[x, y] = (red, green, blue, alpha)
        light_pixels[x, y] = (75, 156, 255, alpha) if is_blue else (45, 45, 45, alpha)


output_dir = ROOT / "icons"
output_dir.mkdir(exist_ok=True)


def crop_to_square(image):
    cropped = image.crop(image.getbbox())
    side = max(cropped.size)
    canvas = Image.new("RGBA", (side, side))
    offset = ((side - cropped.width) // 2, (side - cropped.height) // 2)
    canvas.alpha_composite(cropped, offset)
    return canvas


dark_icon = crop_to_square(dark)
light_icon = crop_to_square(light)

# Keep a dark outline around the white strokes so the toolbar icon stays
# visible against both dark and light Photoshop themes.
outline_mask = dark_icon.getchannel("A").filter(ImageFilter.MaxFilter(3))
outline = Image.new("RGBA", dark_icon.size, (24, 24, 24, 0))
outline.putalpha(outline_mask)
universal_icon = outline
universal_icon.alpha_composite(dark_icon)

def export_icon(image, size, path):
    margin = max(1, round(size * 0.12))
    inner_size = size - margin * 2
    fitted = image.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size))
    canvas.alpha_composite(fitted, (margin, margin))
    canvas.save(path)


export_icon(dark_icon, 23, output_dir / "quick-export-toolbar-dark-v2.png")
export_icon(dark_icon, 23, output_dir / "quick-export-toolbar-dark-v2@1x.png")
export_icon(dark_icon, 46, output_dir / "quick-export-toolbar-dark-v2@2x.png")
export_icon(light_icon, 23, output_dir / "quick-export-toolbar-light-v2.png")
export_icon(light_icon, 23, output_dir / "quick-export-toolbar-light-v2@1x.png")
export_icon(light_icon, 46, output_dir / "quick-export-toolbar-light-v2@2x.png")
export_icon(dark_icon, 48, output_dir / "plugin.png")
export_icon(dark_icon, 48, output_dir / "plugin@1x.png")
export_icon(dark_icon, 96, output_dir / "plugin@2x.png")
export_icon(universal_icon, 23, output_dir / "quick-export-toolbar-final.png")
export_icon(universal_icon, 23, output_dir / "quick-export-toolbar-final@1x.png")
export_icon(universal_icon, 46, output_dir / "quick-export-toolbar-final@2x.png")
