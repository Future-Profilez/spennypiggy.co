#!/usr/bin/env node

/**
 * Headless Node.js script for generating support social images
 * This script is called from Laravel Queue jobs to generate social images server-side
 * 
 * Usage: node renderSupportImage.js '{"creator":{"name":"John","username":"john","avatar":"uuid"},"supporterName":"Jane","amount":10,"currency":"GBP","isAnonymous":false,"message":"Great content!"}'
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory
const projectRoot = path.resolve(__dirname, '../..');
const assetsPath = path.join(projectRoot, 'resources/assets');

/**
 * Modern elegant template function for support payment social images
 * Beautiful design with pink gradient background and decorative elements
 */
function renderSupportCardNode({ creator, supporterName, amount, currency, isAnonymous, message, logoDataUrl, bgDataUrl }) {
    const displaySupporter = isAnonymous ? "Anonymous Supporter" : supporterName;
    const truncatedMessage = message && message.length > 80 ? message.substring(0, 77) + '...' : message;

    return `
        <div id="card-to-capture" class="relative w-[600px] h-[337px] overflow-hidden rounded-[28px] shadow-2xl">
            ${bgDataUrl ? `<img src="${bgDataUrl}" alt="Background" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:-2;filter:contrast(1.0) saturate(1.25);" />` : `<div class="absolute inset-0" style="background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0b1220 100%);"></div>`}

            <div class="absolute inset-0" style="background: radial-gradient(800px 200px at 80% 10%, rgba(167,139,250,0.35), transparent 50%), radial-gradient(600px 180px at 20% 90%, rgba(34,211,238,0.35), transparent 55%);"></div>
            <div class="absolute inset-0" style="opacity:0.15;background-image: radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px); background-size: 18px 18px; mix-blend: screen;"></div>

            

            <div class="relative z-10 flex flex-col items-center justify-center h-full px-10 text-center text-white">
                ${logoDataUrl ? `<img src="${logoDataUrl}" alt="SpennyPiggy" style="width:42px;height:42px;object-fit:contain;opacity:0.95;margin-bottom:8px;" />` : ''}

                <h1 class="text-4xl font-outfit tracking-wide mb-2 gradient-accent" style="letter-spacing:0.3px; text-transform: uppercase; color:#fde046;">🎉 THANK YOU! 🎉</h1>

                <p class="text-xl font-inter font-semibold opacity-95 mb-1">Thank you ${displaySupporter}</p>
                <p style="margin-bottom:10px;" class="text-base font-inter opacity-80">for making my day special with</p>

                <div style="margin-top:10px; margin-bottom:10px;display:inline-block;padding:6px 14px; font-weight:bold;">
                    <span class="text-2xl font-outfit gradient-amount" style="letter-spacing:0.2px;color: #fde046">${(currency || '').toUpperCase()} ${amount}</span>
                </div>

                <div class="mt-6 link-pill-modern font-inter" style="">https://spennypiggy.co/${creator.username}</div>
            </div>
        </div>
    `;
}

/**
 * Utility functions (matching shared SocialImageTemplates.js)
 */
function truncateName(name, maxLength = 20) {
    if (!name || name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
}

function formatCurrency(amount, currency = 'GBP') {
    try {
        return new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (e) {
        return parseFloat(amount).toFixed(2);
    }
}

/**
 * Main function to generate support social image
 */
async function generateSupportSocialImage(payload) {
    let browser;
    
    try {
        console.log('🚀 Starting Node.js support social image generation...');
        console.log('📦 Payload received:', JSON.stringify(payload, null, 2));
        
        // Validate required data
        if (!payload.creator || !payload.creator.avatar) {
            throw new Error('Creator with avatar is required');
        }

// Format the data
        const formattedData = {
            creator: {
                name: truncateName(payload.creator.name, 20),
                username: payload.creator.username,
                avatar: payload.creator.avatar
            },
            supporterName: truncateName(payload.supporterName || 'Anonymous', 25),
            amount: formatCurrency(payload.amount, payload.currency),
            currency: payload.currency || 'GBP',
            isAnonymous: payload.isAnonymous || false,
            message: payload.message || null
        };

        console.log('✅ Data formatted:', JSON.stringify(formattedData, null, 2));

        // Resolve logo and decorative assets (optional)
        let logoDataUrl = null;
        let bgDataUrl = null;
        try {
            const logoPath = path.join(projectRoot, 'public', 'img', 'logo.png');
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
            }
            const bgPath = path.join(projectRoot, 'resources', 'assets', 'social-bg.png');
            if (fs.existsSync(bgPath)) {
                const bgBuffer = fs.readFileSync(bgPath);
                bgDataUrl = `data:image/png;base64,${bgBuffer.toString('base64')}`;
            }
            // Removed decorative gift icons per request
        } catch {}

        // Generate HTML using the Node-compatible template
        const cardHtml = renderSupportCardNode({ ...formattedData, logoDataUrl, bgDataUrl });
        
        const htmlContent = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset=\"utf-8\">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
                h1 { font-weight: 700; }
                .relative { position: relative; }
                .absolute { position: absolute; }
                .flex { display: flex; }
                .flex-col { flex-direction: column; }
                .items-center { align-items: center; }
                .justify-center { justify-content: center; }
                .text-center { text-align: center; }
                .text-start { text-align: left; }
                .w-full { width: 100%; }
                .h-full { height: 100%; }
                .w-28 { width: 7rem; }
                .h-28 { height: 7rem; }
                .rounded-full { border-radius: 9999px; }
                .overflow-hidden { overflow: hidden; }
                .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
                .border-4 { border-width: 4px; }
                .object-cover { object-fit: cover; }
                .uppercase { text-transform: uppercase; }
                .font-bold { font-weight: 700; }
                .font-medium { font-weight: 500; }
                .tracking-wide { letter-spacing: 0.025em; }
                .text-white { color: rgb(255 255 255); }
                .text-yellow-300 { color: rgb(253 224 71); }
                .text-cyan-300 { color: rgb(103 232 249); }
                .text-pink-300 { color: rgb(249 168 212); }
                .text-green-300 { color: rgb(134 239 172); }
                .text-gray-100 { color: rgb(243 244 246); }
                .text-purple-300 { color: rgb(196 181 253); }
                .text-blue-300 { color: rgb(147 197 253); }
                .text-sm { font-size: 0.875rem; }
                .text-base { font-size: 1rem; }
                .text-lg { font-size: 1.125rem; }
                .text-xl { font-size: 1.25rem; }
                .text-2xl { font-size: 1.5rem; }
                .text-3xl { font-size: 1.875rem; }
                .text-4xl { font-size: 2.25rem; }
                .text-5xl { font-size: 3rem; }
                .p-6 { padding: 1.5rem; }
                .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
                .px-4 { padding-left: 1rem; padding-right: 1rem; }
                .px-8 { padding-left: 2rem; padding-right: 2rem; }
                .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
                .mb-1 { margin-bottom: 0.25rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .mt-3 { margin-top: 0.75rem; }
                .mt-auto { margin-top: auto; }
                .space-y-2 > * + * { margin-top: 0.5rem; }
                .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
                .top-4 { top: 1rem; }
                .top-6 { top: 1.5rem; }
                .left-6 { left: 1.5rem; }
                .right-8 { right: 2rem; }
                .bottom-6 { bottom: 1.5rem; }
                .bottom-8 { bottom: 2rem; }
                .left-8 { left: 2rem; }
                .right-6 { right: 1.5rem; }
                .max-w-\\[400px\\] { max-width: 400px; }
                .mx-auto { margin-left: auto; margin-right: auto; }
                .bg-black { background-color: rgb(0 0 0); }
                .bg-opacity-20 { background-color: rgb(0 0 0 / 0.2); }
                .opacity-30 { opacity: 0.3; }
                .opacity-60 { opacity: 0.6; }
                .opacity-80 { opacity: 0.8; }
                .opacity-90 { opacity: 0.9; }
                .rounded-lg { border-radius: 0.5rem; }
                .rounded-\\[20px\\] { border-radius: 20px; }
                .italic { font-style: italic; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
                .drop-shadow-lg { filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1)); }
                .z-10 { z-index: 10; }
                
                /* Font smoothing */
                html, body, #card-to-capture, h1, p, span {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }
                
                /* Glass pill for amount */
                .glass-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 24px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    border: 1px solid rgba(255,255,255,0.25);
                    margin: 0 auto;
                    width: fit-content;
                }
                
                /* Gradient gold text */
                .gradient-gold-strong {
                    background: linear-gradient(135deg, #fff1a8 0%, #ffe066 30%, #ffc233 60%, #ffb300 78%, #f39c12 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    text-shadow: 3px 3px 0 rgba(0,0,0,0.28);
                }
                .gradient-gold-flat {
                    background: linear-gradient(135deg, #ffea80 0%, #ffd54f 35%, #ffb300 65%, #fbc02d 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                
                /* Gradient backgrounds */
                .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
                .from-\\[\\#b91c7c\\] { --tw-gradient-from: #b91c7c; --tw-gradient-to: rgb(185 28 124 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
                .via-\\[\\#c2185b\\] { --tw-gradient-to: rgb(194 24 91 / 0); --tw-gradient-stops: var(--tw-gradient-from), #c2185b, var(--tw-gradient-to); }
                .to-\\[\\#ad1457\\] { --tw-gradient-to: #ad1457; }
                
                /* Fun fonts */
                @import url('https://fonts.googleapis.com/css2?family=Bungee:wght@400&display=swap');
                .font-bungee { font-family: 'Bungee', cursive; }
                
                /* Smooth display font */
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&display=swap');
                .font-outfit { font-family: 'Outfit', -apple-system, Segoe UI, Roboto, sans-serif; }
                
                /* Professional fonts */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .font-inter { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
                
                /* Dimensions */
                .w-\\[600px\\] { width: 600px; }
                .h-\\[337px\\] { height: 337px; }
                .w-\\[80px\\] { width: 80px; }
                .h-\\[80px\\] { height: 80px; }
                
                /* Modern gradient text */
                .gradient-accent {
                    background: linear-gradient(90deg, #8b5cf6 0%, #06b6d4 50%, #22d3ee 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                .gradient-amount {
                    background: linear-gradient(90deg, #f97316 0%, #fb7185 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                
                /* Modern link pill */
                .link-pill-modern {
                    display: inline-block;
                    padding: 8px 14px;
                    border-radius: 9999px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.18);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
                    backdrop-filter: blur(4px);
                    color: rgba(255,255,255,0.92);
                    font-size: 14px;
                }
            </style>
        </head>
        <body style=\"margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">
            ${cardHtml}
        </body>
        </html>`;

        // Launch puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--window-size=1200,800'
            ],
            timeout: 60000
        });

        const page = await browser.newPage();
        
        // Set viewport to exact dimensions
        await page.setViewport({
            width: 640,
            height: 400,
            deviceScaleFactor: 2
        });

        // Set page timeout
        page.setDefaultTimeout(60000);

// HTML content is prepared above with shared template
        
// Set content and wait for images to load
        await page.setContent(htmlContent, {
            waitUntil: ['domcontentloaded'],
            timeout: 60000
        });

        console.log('📸 Taking screenshot...');
        
        // Take screenshot of the card element (the support card root id)
        const cardElement = await page.$('#card-to-capture');
        if (!cardElement) {
            throw new Error('Support card element not found');
        }

        const imageBuffer = await cardElement.screenshot({
            type: 'png'
        });

        console.log(`✅ Screenshot generated, size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);

        return imageBuffer;

    } catch (error) {
        console.error('❌ Error in generateSupportSocialImage:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        if (args.length === 0) {
            throw new Error('No JSON payload provided');
        }

        const payloadJson = args[0];
        console.log('📝 Raw payload:', payloadJson);
        
        const payload = JSON.parse(payloadJson);
        
        // Generate image
        const imageBuffer = await generateSupportSocialImage(payload);
        
        // Write image to temporary file
        const tempFileName = `support-social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
        const tempFilePath = path.join('/tmp', tempFileName);
        
        fs.writeFileSync(tempFilePath, imageBuffer);
        
        console.log(`🎉 Image generated successfully: ${tempFilePath}`);
        
        // Output the file path for Laravel to read
        console.log(`IMAGE_PATH:${tempFilePath}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    generateSupportSocialImage
};
