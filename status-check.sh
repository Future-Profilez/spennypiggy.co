#!/bin/bash

echo "🔍 SpenyPiggy.co Status Check"
echo "=================================="

# Check Laravel server
echo "📱 Checking Laravel server..."
if curl -s -f http://127.0.0.1:8000 > /dev/null; then
    echo "✅ Laravel server is running on http://127.0.0.1:8000"
else
    echo "❌ Laravel server is not responding"
fi

# Check critical image assets
echo ""
echo "🖼️ Checking critical image assets..."

declare -a images=(
    "resources/assets/new/HeroBg.webp"
    "resources/assets/new/HeroBg.avif"
    "resources/assets/new/HeroBg.png"
    "resources/assets/new/HeroBg-mobile.webp"
    "resources/assets/new/HeroBg-mobile.avif"
    "resources/assets/new/HeroBg-mobile.png"
    "resources/assets/img/itsfree.png"
    "resources/assets/img/itsfree-mob.png"
)

for image in "${images[@]}"; do
    if curl -s -f "http://127.0.0.1:8000/$image" > /dev/null; then
        echo "✅ $image"
    else
        echo "❌ $image"
    fi
done

# Check build assets
echo ""
echo "🔨 Checking build status..."
if [ -d "public/build" ] && [ -f "public/build/manifest.json" ]; then
    echo "✅ Build assets exist"
    manifest_size=$(wc -c < "public/build/manifest.json")
    echo "📄 Manifest size: ${manifest_size} bytes"
else
    echo "❌ Build assets not found"
fi

# Check service worker
echo ""
echo "🔧 Checking service worker..."
if curl -s -f http://127.0.0.1:8000/service-worker.js > /dev/null; then
    echo "✅ Service worker is accessible"
else
    echo "❌ Service worker is not accessible"
fi

echo ""
echo "🎉 Status check complete!"
echo "Visit your app at: http://127.0.0.1:8000"
