#!/usr/bin/env node

/**
 * Basic Font Subsetting Script
 * 
 * Creates Latin subsets of fonts for immediate optimization.
 * This is a simpler alternative when full site analysis isn't available.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FONTS_DIR = path.join(__dirname, '..', 'resources', 'assets', 'fonts');
const OPTIMIZED_DIR = path.join(FONTS_DIR, 'optimized');

// Font files to optimize with common character sets
const fonts = [
    {
        name: 'CeraGRMedium',
        file: 'CeraGRMedium.woff2',
        priority: 'high'
    },
    {
        name: 'newfont',
        file: 'newfont.woff2', 
        priority: 'medium'
    },
    {
        name: 'CeraGRBold',
        file: 'CeraGRBold.woff2',
        priority: 'low'
    }
];

// Common characters for a typical website
const BASIC_LATIN = 'U+0020-007F'; // Basic Latin
const LATIN_1 = 'U+00A0-00FF'; // Latin-1 Supplement  
const LATIN_EXTENDED_A = 'U+0100-017F'; // Latin Extended-A
const COMMON_PUNCTUATION = 'U+2010-2027'; // Common punctuation
const CURRENCY_SYMBOLS = 'U+00A2-00A5,U+20AC,U+00A3'; // $, ¢, £, ¤, ¥, €

const UNICODE_RANGES = [BASIC_LATIN, LATIN_1, LATIN_EXTENDED_A, COMMON_PUNCTUATION, CURRENCY_SYMBOLS].join(',');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(OPTIMIZED_DIR)) {
    fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

function subsetFont(font) {
    const inputPath = path.join(FONTS_DIR, font.file);
    const outputPath = path.join(OPTIMIZED_DIR, font.file);
    
    try {
        // Create subset with common Latin characters
        const subsetCommand = `npx glyphhanger --whitelist="${UNICODE_RANGES}" --subset="${inputPath}" --formats=woff2`;
        
        execSync(subsetCommand, { 
            cwd: OPTIMIZED_DIR,
            stdio: 'inherit'
        });
        
        // Check if files were created and get stats
        if (fs.existsSync(outputPath)) {
            const originalSize = fs.statSync(inputPath).size;
            const optimizedSize = fs.statSync(outputPath).size;
            const savings = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
        } else {
            // List files in optimized directory to see what was created
            const files = fs.readdirSync(OPTIMIZED_DIR).filter(f => f.includes(font.name.toLowerCase()));
            if (files.length > 0) {
                console.log(`  📁 Created files: ${files.join(', ')}`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error subsetting ${font.name}:`, error.message);
    }
}

// Function to create updated CSS with optimized fonts
function createOptimizedCSS() {
    const cssPath = path.join(__dirname, '..', 'resources', 'css', 'fonts-optimized.css');
    
    const optimizedCSS = `/* Optimized fonts with subsets */
@font-face {
  font-family: 'CeraGRBold';
  font-display: swap;
  src: url('../assets/fonts/optimized/CeraGRBold.woff2') format('woff2');
  unicode-range: ${UNICODE_RANGES};
}

@font-face {
  font-family: 'CeraGRMedium';
  font-display: swap;
  src: url('../assets/fonts/optimized/CeraGRMedium.woff2') format('woff2');
  unicode-range: ${UNICODE_RANGES};
}

@font-face {
  font-family: 'gulfs';
  font-display: swap;
  src: url('../assets/fonts/optimized/newfont.woff2') format('woff2');
  unicode-range: ${UNICODE_RANGES};
}

/* Fallback fonts for characters outside the subset */
@font-face {
  font-family: 'CeraGRBold';
  font-display: swap;
  src: url('../assets/fonts/CeraGRBold.woff2') format('woff2');
  unicode-range: U+0000-001F, U+0080-009F, U+0180-024F, U+2028-FFFF;
}

@font-face {
  font-family: 'CeraGRMedium';
  font-display: swap;
  src: url('../assets/fonts/CeraGRMedium.woff2') format('woff2');
  unicode-range: U+0000-001F, U+0080-009F, U+0180-024F, U+2028-FFFF;
}

@font-face {
  font-family: 'gulfs';
  font-display: swap;
  src: url('../assets/fonts/newfont.woff2') format('woff2');
  unicode-range: U+0000-001F, U+0080-009F, U+0180-024F, U+2028-FFFF;
}
`;
    
    fs.writeFileSync(cssPath, optimizedCSS);
}

// Main execution
async function main() {
    try {
        // Sort fonts by priority (high priority first for better FOIT prevention)
        const sortedFonts = fonts.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
        });
        
        // Subset each font
        for (const font of sortedFonts) {
            subsetFont(font);
        }
        
        // Create optimized CSS
        createOptimizedCSS();
        
    } catch (error) {
        console.error('❌ Font subsetting failed:', error.message);
        process.exit(1);
    }
}

main();
