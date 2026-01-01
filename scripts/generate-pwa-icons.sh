#!/bin/bash

# 🎨 PWA Icon Generator Script
# Creates PNG icons from SVG for all required sizes

echo "🎨 Creating PWA icons..."

# Check if ImageMagick is installed (for SVG to PNG conversion)
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found"
    echo "💡 Install with: brew install imagemagick (macOS)"
    echo "   Or: sudo apt-get install imagemagick (Linux)"
    echo "   Or download from: https://imagemagick.org/script/download.php"
    echo ""
    echo "🔄 Falling back to using SVG directly (won't work on some devices)"
    echo "💡 Consider converting to PNG for full PWA support"
else
    echo "✅ ImageMagick found - Converting SVG to PNGs..."
    
    # Create PNG icons in all required sizes
    convert public/icon.svg -resize 72x72 public/icons/icon-72x72.png
    convert public/icon.svg -resize 96x96 public/icons/icon-96x96.png
    convert public/icon.svg -resize 128x128 public/icons/icon-128x128.png
    convert public/icon.svg -resize 144x144 public/icons/icon-144x144.png
    convert public/icon.svg -resize 152x152 public/icons/icon-152x152.png
    convert public/icon.svg -resize 192x192 public/icons/icon-192x192.png
    convert public/icon.svg -resize 384x384 public/icons/icon-384x384.png
    convert public/icon.svg -resize 512x512 public/icons/icon-512x512.png
    convert public/icon.svg -resize 1024x1024 public/icons/icon-1024x1024.png
    
    # Create maskable icon (transparent background)
    convert public/icon.svg -resize 512x512 public/icons/maskable-icon-512x512.png
    
    echo "✅ PNG icons created successfully"
    echo ""
    echo "Icons generated:"
    ls -lh public/icons/*.png
fi

# Create favicon.ico (16x16 and 32x32 combined)
if command -v convert &> /dev/null; then
    echo "🎨 Creating favicon.ico..."
    convert public/icon.svg -resize 16x16 -define icon:public/icon-16.png public/icon.svg
    convert public/icon.svg -resize 32x32 -define icon:public/icon-32.png public/icon.svg
    convert public/icon-16.png public/icon-32.png public/favicon.ico
    echo "✅ favicon.ico created"
else
    echo "⚠️  Skipping favicon.ico (requires ImageMagick)"
fi

echo ""
echo "🎉 PWA icons generation complete!"
echo ""
echo "📁 Generated files:"
echo "   ✅ public/icon.svg (original)"
if command -v convert &> /dev/null; then
    echo "   ✅ public/icons/*.png (10 PNG icons)"
    echo "   ✅ public/icons/maskable-icon-512x512.png (for Android)"
    echo "   ✅ public/favicon.ico (for browser tab)"
fi
echo ""
echo "💡 If icons don't appear, verify:"
echo "   1. All PNG files exist in public/icons/"
echo "   2. manifest.json references correct paths"
echo "   3. File permissions are readable"
echo "   4. Clear browser cache and reload"
