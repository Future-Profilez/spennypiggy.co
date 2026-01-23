#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Find all JSX files that don't have React imports
function findJSXFilesWithoutReact() {
    try {
        const output = execSync('find resources/js -name "*.jsx" -exec grep -L "import.*React" {} \\;', { encoding: 'utf8' });
        return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
        console.log('No files found or error occurred:', error.message);
        return [];
    }
}

// Check if a file actually uses JSX elements
function usesJSX(content) {
    // Look for JSX patterns like <div>, <Component>, etc.
    const jsxPatterns = [
        /<[A-Z][a-zA-Z0-9]*[\s>]/, // Component tags like <MyComponent>
        /<[a-z]+[\s>\/]/, // HTML tags like <div>, <span>
        /React\.createElement/,  
        /\s*return\s*\(\s*</, // return statement with JSX
        /\s*return\s*</, // direct return with JSX
    ];
    
    return jsxPatterns.some(pattern => pattern.test(content));
}

// Add React import to a file
function addReactImport(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Skip if already has React import
        if (content.includes('import React') || content.includes('import { React }')) {
            return false;
        }
        
        // Skip if doesn't actually use JSX
        if (!usesJSX(content)) {
            return false;
        }
        
        // Find the first import statement
        const lines = content.split('\n');
        let insertIndex = 0;
        
        // Find where to insert the React import
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('import ')) {
                insertIndex = i;
                break;
            }
            if (line.length > 0 && !line.startsWith('//') && !line.startsWith('/*')) {
                insertIndex = i;
                break;
            }
        }
        
        // Insert React import at the beginning
        lines.splice(insertIndex, 0, 'import React from "react";');
        
        const newContent = lines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        return true;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main execution

const files = findJSXFilesWithoutReact();

let fixed = 0;
let skipped = 0;

files.forEach(file => {
    const result = addReactImport(file);
    if (result) {
        fixed++;
    } else {
        skipped++;
    }
});

if (fixed > 0) {
    console.log('\n🎉 React imports have been added to JSX files that need them!');
    console.log('💡 Tip: Test your app to make sure everything works correctly.');
} else {
    console.log('\n✨ All JSX files already have proper React imports or don\'t need them.');
}
