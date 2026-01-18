#!/bin/bash

# Image compression script for The Tech Bros site
# Requires: ImageMagick (install with: brew install imagemagick)

echo "Compressing images..."

# Compress event JPEGs (quality 80%)
echo "Compressing event images..."
find public/about/events -name "*.jpeg" -type f | while read file; do
  echo "  Compressing: $file"
  mogrify -quality 80 -strip -resize "1200x1200>" "$file"
done

# Compress hero images (quality 85%)
echo "Compressing hero images..."
find public -name "*hero*.jpg" -o -name "*hero*.jpeg" | while read file; do
  echo "  Compressing: $file"
  mogrify -quality 85 -strip -resize "1920x1920>" "$file"
done

# Compress press images (quality 80%)
echo "Compressing press images..."
find public/press -name "*.jpg" -o -name "*.jpeg" | while read file; do
  echo "  Compressing: $file"
  mogrify -quality 80 -strip -resize "800x800>" "$file"
done

# Compress partner images (quality 80%)
echo "Compressing partner images..."
find public/partner -name "*.jpg" -o -name "*.jpeg" | while read file; do
  echo "  Compressing: $file"
  mogrify -quality 80 -strip -resize "1200x1200>" "$file"
done

# Compress apply images (quality 85%)
echo "Compressing apply images..."
find public/apply -name "*.jpg" -o -name "*.jpeg" | while read file; do
  echo "  Compressing: $file"
  mogrify -quality 85 -strip -resize "1920x1920>" "$file"
done

# Compress other JPEGs (quality 80%)
echo "Compressing other JPEGs..."
find public -name "*.jpg" -o -name "*.jpeg" | grep -v -E "(hero|events|press|partner|apply)" | while read file; do
  echo "  Compressing: $file"
  mogrify -quality 80 -strip "$file"
done

echo "✅ Image compression complete!"
echo ""
echo "Note: PNG logos should be compressed separately using TinyPNG or optipng"
