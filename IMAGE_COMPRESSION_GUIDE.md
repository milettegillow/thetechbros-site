# Image Compression Guide

Your images are loading slowly because they're too large. Here's how to compress them:

## Quick Options

### 1. Online Tools (Easiest)
- **Squoosh** (Google): https://squoosh.app
  - Drag & drop images
  - Adjust quality slider (try 75-85%)
  - Compare before/after
  - Download optimized versions

- **TinyPNG/TinyJPG**: https://tinypng.com
  - Drag & drop up to 20 images
  - Automatic compression
  - Download all at once

### 2. CLI Tools (Batch Processing)
```bash
# Install ImageMagick (macOS)
brew install imagemagick

# Compress all JPEGs in a directory (quality 80%)
find public/about/events -name "*.jpeg" -exec mogrify -quality 80 -strip {} \;

# For PNGs (reduce colors, optimize)
find public/index/partner-logos -name "*.png" -exec optipng -o7 {} \;
```

### 3. Recommended Settings

**Event Images (JPEG):**
- Quality: 75-85%
- Max width: 1200px (if larger)
- Strip EXIF data

**Hero Images (JPEG):**
- Quality: 80-90%
- Max width: 1920px (if larger)

**Logo Images (PNG):**
- Use TinyPNG or similar
- Or convert to SVG if possible

**Press Images:**
- Quality: 75-85%
- Max width: 800px

## Target File Sizes

- Event thumbnails: < 100KB
- Hero images: < 300KB
- Logo images: < 50KB
- Press images: < 150KB

## After Compression

Replace the original files in `public/` with the compressed versions, keeping the same filenames.
