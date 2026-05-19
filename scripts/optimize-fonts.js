#!/usr/bin/env node

/**
 * Font Subsetting and Optimization Script
 * 
 * This script uses glyphhanger to analyze the website and create
 * optimized font subsets containing only the glyphs actually used.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = process.env.SITE_URL || 'http://localhost:8000';
const FONTS_DIR = path.join(__dirname, '..', 'resources', 'assets', 'fonts');
const OPTIMIZED_DIR = path.join(FONTS_DIR, 'optimized');

// Font files to optimize
const fonts = [
    {
        name: 'CeraGRMedium',
        file: 'CeraGRMedium.woff2',
        priority: 'high' // Most used font
    },
    {
        name: 'newfont',
        file: 'newfont.woff2', 
        priority: 'medium' // Headings font
    },
    {
        name: 'CeraGRBold',
        file: 'CeraGRBold.woff2',
        priority: 'low' // Less frequently used
    }
];

// Create optimized directory if it doesn't exist
if (!fs.existsSync(OPTIMIZED_DIR)) {
    fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

// Function to run glyphhanger and create optimized fonts
function optimizeFont(font) {
    const inputPath = path.join(FONTS_DIR, font.file);
    const outputPath = path.join(OPTIMIZED_DIR, font.file);
    
    try {
        // Step 1: Analyze the website to find used characters
        const glyphCommand = `npx glyphhanger ${SITE_URL} --verbose`;
        const usedChars = execSync(glyphCommand, { encoding: 'utf8' });
        
        // Step 2: Create subset with only used characters
        const subsetCommand = `npx glyphhanger --whitelist="${usedChars.trim()}" --subset=${inputPath} --css --formats=woff2`;
        execSync(subsetCommand, { cwd: OPTIMIZED_DIR });
        
        // Step 3: Get file size stats
        const originalSize = fs.statSync(inputPath).size;
        const optimizedSize = fs.statSync(outputPath).size;
        const savings = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
        
    } catch (error) {
        console.error(`❌ Error optimizing ${font.name}:`, error.message);
        
        // Fallback: create basic Latin subset if site analysis fails
        const fallbackCommand = `npx glyphhanger --US_ASCII --subset=${inputPath} --css --formats=woff2`;
        try {
            execSync(fallbackCommand, { cwd: OPTIMIZED_DIR });
        } catch (fallbackError) {
            console.error(`❌ Fallback also failed:`, fallbackError.message);
        }
    }
}

// Function to create updated CSS with optimized fonts
function updateFontCSS() {
    const cssPath = path.join(__dirname, '..', 'resources', 'css', 'theme-optimized.css');
    
    const optimizedCSS = `/* Optimized theme.css with subsetted fonts */
@font-face {
  font-family: 'CeraGRBold';
  font-display: swap;
  src: url('../assets/fonts/optimized/CeraGRBold.woff2') format('woff2');
  unicode-range: U+0020-#FF007F, U+00A0-00FF, U+0100-017F; /* Latin, Latin-1, Latin Extended-A */
}

@font-face {
  font-family: 'CeraGRMedium';
  font-display: swap;
  src: url('../assets/fonts/optimized/CeraGRMedium.woff2') format('woff2');
  unicode-range: U+0020-#FF007F, U+00A0-00FF, U+0100-017F; /* Latin, Latin-1, Latin Extended-A */
}

@font-face {
  font-family: 'gulfs';
  font-display: swap;
  src: url('../assets/fonts/optimized/newfont.woff2') format('woff2');
  unicode-range: U+0020-#FF007F, U+00A0-00FF, U+0100-017F; /* Latin, Latin-1, Latin Extended-A */
}

body {
  --white:#ffffff;
  --black:#000000;
  --gray:#cccccc;
  --gray2:#4D4D4D;
  --mint:#05EFB8;
  --pink:#FF007F;
  --yellow:#E6EA7B;
  --lightpink:#FFC4E2;
  --voilet: #8C52FF;
  --purple: #8C52FF;
  --body-font:'gulfs';
  --heading-font: 'gulfs';
  --para-font: 'CeraGRMedium';
  --parabold-font: 'CeraGRBold';
  --text-wh: #ffffff;
  --text-bl: #000000;
  --text-gray: #616161;
  --text-graydark: #333333;
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
        
        // Optimize each font
        for (const font of sortedFonts) {
            optimizeFont(font);
        }
        
        // Create optimized CSS
        updateFontCSS();
        
    } catch (error) {
        console.error('❌ Font optimization failed:', error.message);
        process.exit(1);
    }
}

// Handle command line arguments
if (process.argv.length > 2) {
    const url = process.argv[2];
    if (url.startsWith('http')) {
        process.env.SITE_URL = url;
    }
}

main();
