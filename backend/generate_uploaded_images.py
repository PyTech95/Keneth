"""One-time: convert owner-uploaded photos into slug-named PNGs in static/products.

reconcile_static_images() attaches these on startup by matching:
  main:    {slug}-{hash}.png
  gallery: {slug}-g{n}-{hash}.png
Hashes are derived from the slug so re-runs are idempotent.
"""
import hashlib
import os
from pathlib import Path

from PIL import Image, ImageOps

from uploaded_catalog import UPLOADED

SRC_ROOT = Path(__file__).parent / "uploaded_src"
OUT = Path(__file__).parent / "static" / "products"
OUT.mkdir(parents=True, exist_ok=True)
MAX = 1400

# Resolve each folder's sorted file list once.
_folder_cache: dict[str, list[str]] = {}


def folder_files(folder: str) -> list[str]:
    if folder not in _folder_cache:
        d = SRC_ROOT / folder
        _folder_cache[folder] = sorted(
            f for f in os.listdir(d)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        )
    return _folder_cache[folder]


def resolve(src) -> Path:
    folder, idx = src
    return SRC_ROOT / folder / folder_files(folder)[idx]


def save_png(src_path: Path, out_path: Path):
    im = Image.open(src_path)
    im = ImageOps.exif_transpose(im).convert("RGB")
    im.thumbnail((MAX, MAX))
    im.save(out_path, "PNG", optimize=True)


def main():
    made = 0
    for p in UPLOADED:
        slug = p["slug"]
        h = hashlib.md5(slug.encode()).hexdigest()[:8]
        sources = p["_sources"]
        if not sources:
            print("WARN no sources:", slug)
            continue
        # main
        save_png(resolve(sources[0]), OUT / f"{slug}-{h}.png")
        made += 1
        # gallery
        for i, s in enumerate(sources[1:]):
            save_png(resolve(s), OUT / f"{slug}-g{i}-{h}.png")
            made += 1
    print(f"Generated {made} PNGs for {len(UPLOADED)} products into {OUT}")


if __name__ == "__main__":
    main()
