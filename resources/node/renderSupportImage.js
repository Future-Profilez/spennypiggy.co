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
 * Node.js compatible template function (matches the shared SocialImageTemplates design)
 * Uses the same visual design as EditProfile component
 */
function renderSupportCardNode({ creator, supporterName, amount, currency, isAnonymous, message }) {
    const displaySupporter = isAnonymous ? "Anonymous Supporter" : supporterName;
    const avatarUid = creator.avatar;
    const truncatedMessage = message && message.length > 80 ? message.substring(0, 77) + '...' : message;
    
    // Load and embed local assets as data URLs
    const socialBgPath = path.join(assetsPath, 'social-bg.png');
    const logoPath = path.join(assetsPath, 'img/logo.png');
    const socialBgDataUrl = `data:image/png;base64,${fs.readFileSync(socialBgPath, 'base64')}`;
    const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath, 'base64')}`;
    
    return `
        <div id="card-to-capture" class="dot-pattern relative flex items-center justify-center p-6 w-[600px] h-[337.5px] text-white shadow-2xl">
            <img src="${socialBgDataUrl}" alt="Background" class="w-full h-full object-cover absolute top-0 left-0 z-[-1]" crossorigin="anonymous" />

            <div class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.2)_3px,transparent_3px)] bg-[size:30px_30px]"></div>

            <div class="inner-image w-full text-center">
                <div class="mb-6">
                    <h1 class="text-4xl font-bold text-yellow-300 mb-4">🎉 THANK YOU! 🎉</h1>
                    <p class="text-white text-2xl font-bold mb-4">Thank you ${displaySupporter}</p>
                    <p class="text-white text-xl mb-4">for making my day special with</p>
                    <p class="text-yellow-300 font-bold text-3xl mb-4">${currency} ${amount}</p>
                </div>

                <div class="bg-gradient-to-r from-[#9b0039] to-[#9b0039b6] link-shadow text-white px-4 leading-[15px] h-[40px] rounded-[15px] text-center text-[20px] shadow-md flex items-center justify-center">
                    https://spennypiggy.co/${creator.username}
                </div>
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

        // Generate HTML using the Node-compatible template
        const cardHtml = renderSupportCardNode(formattedData);
        
        const htmlContent = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset=\"utf-8\">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
                .relative { position: relative; }
                .absolute { position: absolute; }
                .flex { display: flex; }
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
                .text-white { color: rgb(255 255 255); }
                .text-yellow-300 { color: rgb(253 224 71); }
                .text-cyan-300 { color: rgb(103 232 249); }
                .text-pink-300 { color: rgb(249 168 212); }
                .text-green-300 { color: rgb(134 239 172); }
                .text-gray-100 { color: rgb(243 244 246); }
                .text-purple-300 { color: rgb(196 181 253); }
                .text-blue-300 { color: rgb(147 197 253); }
                .text-sm { font-size: 0.875rem; }
                .text-lg { font-size: 1.125rem; }
                .text-xl { font-size: 1.25rem; }
                .text-2xl { font-size: 1.5rem; }
                .text-3xl { font-size: 1.875rem; }
                .text-4xl { font-size: 2.25rem; }
                .text-5xl { font-size: 3rem; }
                .p-6 { padding: 1.5rem; }
                .ps-3 { padding-left: 0.75rem; }
                .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
                .px-4 { padding-left: 1rem; padding-right: 1rem; }
                .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                .mb-1 { margin-bottom: 0.25rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mt-3 { margin-top: 0.75rem; }
                .mt-\\[20px\\] { margin-top: 20px; }
                .mt-\\[-20px\\] { margin-top: -20px; }
                .pb-2 { padding-bottom: 0.5rem; }
                .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
                .top-4 { top: 1rem; }
                .top-18 { top: 4.5rem; }
                .left-6 { left: 1.5rem; }
                .right-8 { right: 2rem; }
                .bottom-6 { bottom: 1.5rem; }
                .left-8 { left: 2rem; }
                .right-20 { right: 5rem; }
                .bottom-4 { bottom: 1rem; }
                .right-28 { right: 7rem; }
                .top-\\[180px\\] { top: 180px; }
                .left-\\[210px\\] { left: 210px; }
                .top-\\[190px\\] { top: 190px; }
                .left-\\[310px\\] { left: 310px; }
                .max-w-\\[200px\\] { max-width: 200px; }
                .max-w-\\[400px\\] { max-width: 400px; }
                .max-w-\\[100px\\] { max-width: 100px; }
                .mx-auto { margin-left: auto; margin-right: auto; }
                .bg-black { background-color: rgb(0 0 0); }
                .bg-opacity-30 { background-color: rgb(0 0 0 / 0.3); }
                .rounded-lg { border-radius: 0.5rem; }
                .rounded-\\[15px\\] { border-radius: 15px; }
                .italic { font-style: italic; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
                .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
                .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
                .from-\\[\\#9b0039\\] { --tw-gradient-from: #9b0039; --tw-gradient-to: rgb(155 0 57 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
                .to-\\[\\#9b0039b6\\] { --tw-gradient-to: #9b0039b6; }
                .bg-\\[radial-gradient\\(rgba\\(255\\,255\\,255\\,0\\.2\\)_3px\\,transparent_3px\\)\\] { background-image: radial-gradient(rgba(255,255,255,0.2) 3px, transparent 3px); }
                .bg-\\[size\\:30px_30px\\] { background-size: 30px 30px; }
                .border-\\[\\#00ff5e\\] { border-color: #00ff5e; }
                .w-\\[600px\\] { width: 600px; }
                .h-\\[337\\.5px\\] { height: 337.5px; }
                .h-\\[40px\\] { height: 40px; }
                .leading-\\[15px\\] { line-height: 15px; }
                .z-\\[-1\\] { z-index: -1; }
                .z-\\[-2\\] { z-index: -2; }
            </style>
        </head>
        <body style=\"margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">
            ${cardHtml}
        </body>
        </html>`;

        // Launch puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1200,800'
            ]
        });

        const page = await browser.newPage();
        
        // Set viewport to exact dimensions
        await page.setViewport({
            width: 640,
            height: 400,
            deviceScaleFactor: 2
        });

// HTML content is prepared above with shared template
        
// Set content and wait for images to load
        await page.setContent(htmlContent, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000
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
