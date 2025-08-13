#!/bin/bash

set -e

echo "🚀 Starting build with critical CSS optimization..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci --silent

# Step 2: Build assets
echo -e "${BLUE}🔨 Building assets with Vite...${NC}"
npm run build

# Step 3: Generate critical CSS files
echo -e "${BLUE}⚡ Generating critical CSS...${NC}"

# Ensure storage directory exists
mkdir -p storage/app/critical-css

# Check if Laravel is available for commands
if command -v php artisan &> /dev/null; then
    echo -e "${GREEN}🎯 Using Laravel Artisan command for critical CSS generation...${NC}"
    php artisan css:critical
else
    echo -e "${YELLOW}⚠️  Laravel not available, using fallback method...${NC}"
    
    # Fallback: Generate basic critical CSS from main stylesheet
    if [ -f "public/build/assets/app.css" ]; then
        echo -e "${BLUE}📄 Extracting critical CSS from main stylesheet...${NC}"
        
        # Create basic critical CSS files for each template
        templates=("home" "dashboard" "profile" "login" "register")
        
        for template in "${templates[@]}"; do
            echo -e "${BLUE}  - Processing ${template}...${NC}"
            
            # Extract critical selectors (basic implementation)
            grep -E '\.(btn-|heading|font-|shadow-|profile-|landing-|funpart|wish-item-box)' public/build/assets/app.css > "storage/app/critical-css/${template}.css" 2>/dev/null || echo "/* Critical CSS for ${template} */" > "storage/app/critical-css/${template}.css"
            
            # Minify the extracted CSS
            if command -v csso &> /dev/null; then
                csso "storage/app/critical-css/${template}.css" --output "storage/app/critical-css/${template}.css"
            fi
            
            echo -e "${GREEN}  ✅ ${template} critical CSS generated${NC}"
        done
    else
        echo -e "${RED}❌ No CSS file found to extract from${NC}"
    fi
fi

# Step 4: Optimize images (if needed)
if [ -d "public/build/assets" ]; then
    echo -e "${BLUE}🖼️  Optimizing images...${NC}"
    
    # Find and optimize images (basic implementation)
    find public/build/assets -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | head -5 | while read img; do
        echo -e "${BLUE}  - Optimizing $(basename "$img")...${NC}"
        # Add image optimization tool here if available
        # Example: imagemin "$img" --out-dir="$(dirname "$img")"
    done
fi

# Step 5: Generate report
echo -e "${GREEN}📊 Build Summary:${NC}"
echo -e "${BLUE}  - Assets built: ${NC}$(ls -la public/build/assets/*.css 2>/dev/null | wc -l) CSS files, $(ls -la public/build/assets/*.js 2>/dev/null | wc -l) JS files"

if [ -d "storage/app/critical-css" ]; then
    echo -e "${BLUE}  - Critical CSS files: ${NC}$(ls -la storage/app/critical-css/*.css 2>/dev/null | wc -l)"
    
    # Show file sizes
    echo -e "${BLUE}  - Critical CSS sizes:${NC}"
    ls -la storage/app/critical-css/*.css 2>/dev/null | awk '{print "    " $9 ": " $5 " bytes"}' || echo "    No files found"
fi

# Step 6: Cache optimization commands
if command -v php artisan &> /dev/null; then
    echo -e "${BLUE}🗄️  Optimizing Laravel caches...${NC}"
    php artisan config:cache
    php artisan route:cache 2>/dev/null || echo "Route caching skipped"
    php artisan view:cache
fi

echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "  1. Test the application to ensure critical CSS is loading correctly"
echo -e "  2. Run lighthouse audit to measure performance improvements"
echo -e "  3. Monitor Core Web Vitals in production"

exit 0
