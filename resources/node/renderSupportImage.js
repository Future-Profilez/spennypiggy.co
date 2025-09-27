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
 * HTML template for support social image (matches SocialImageTemplates.js)
 */
function renderSupportCard({ creator, supporterName, amount, currency, isAnonymous, message }) {
    const displaySupporter = isAnonymous ? "An anonymous supporter" : supporterName;
    const avatarUid = creator.avatar;
    
    // Convert local asset paths to data URLs or file URLs
    const socialBgPath = path.join(assetsPath, 'social-bg.png');
    const logoPath = path.join(assetsPath, 'img/logo.png');
    
    const socialBgDataUrl = `data:image/png;base64,${fs.readFileSync(socialBgPath, 'base64')}`;
    const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath, 'base64')}`;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 20px;
                }
                .card-wrapper {
                    width: 600px;
                    height: 337.5px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    padding: 24px;
                    color: white;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                .bg-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    z-index: -2;
                }
                .dot-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: radial-gradient(rgba(255,255,255,0.2) 3px, transparent 3px);
                    background-size: 30px 30px;
                    z-index: -1;
                }
                .emoji {
                    position: absolute;
                    font-size: 48px;
                    z-index: 1;
                }
                .emoji-celebrate { top: 16px; left: 24px; }
                .emoji-heart { bottom: 24px; right: 32px; font-size: 40px; }
                .emoji-sparkle { top: 16px; right: 24px; font-size: 40px; }
                .emoji-pray { bottom: 24px; left: 32px; font-size: 32px; }
                .content {
                    width: 100%;
                    z-index: 2;
                }
                .thank-you-section {
                    text-align: center;
                    margin-bottom: 24px;
                }
                .thank-you-title {
                    font-size: 36px;
                    font-weight: bold;
                    color: #fbbf24;
                    margin-bottom: 16px;
                }
                .supporter-info {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                .amount-info {
                    font-size: 20px;
                    margin-bottom: 16px;
                }
                .amount-highlight {
                    color: #fbbf24;
                    font-weight: bold;
                }
                .content-section {
                    text-align: center;
                    margin-bottom: 24px;
                }
                .content-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                .content-subtitle {
                    font-size: 16px;
                    opacity: 0.9;
                }
                .website-link {
                    background: linear-gradient(to right, #9b0039, #9b0039b6);
                    padding: 0 16px;
                    height: 40px;
                    border-radius: 15px;
                    text-align: center;
                    font-size: 18px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            </style>
        </head>
        <body>
            <div class="card-wrapper">
                <img src="${socialBgDataUrl}" alt="Background" class="bg-image" />
                <div class="dot-overlay"></div>
                
                <div class="emoji emoji-celebrate">🎉</div>
                <div class="emoji emoji-heart">💝</div>
                <div class="emoji emoji-sparkle">✨</div>
                <div class="emoji emoji-pray">🙏</div>
                
                <div class="content">
                    <div class="thank-you-section">
                        <div class="thank-you-title">🎉 THANK YOU! 🎉</div>
                        <div class="supporter-info">${displaySupporter}</div>
                        <div class="amount-info">just tipped <span class="amount-highlight">${currency} ${amount}</span></div>
                    </div>
                    
                    <div class="content-section">
                        <div class="content-title">🚀 Supporting Creative Dreams</div>
                        <div class="content-subtitle">Every contribution helps bring amazing content to life!</div>
                    </div>
                    
                    <div class="website-link">
                        https://spennypiggy.co/${creator.username}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Utility functions
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

        console.log('🖼️ Generating HTML content...');
        const htmlContent = renderSupportCard(formattedData);
        
        // Set content and wait for images to load
        await page.setContent(htmlContent, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000
        });

        console.log('📸 Taking screenshot...');
        
        // Take screenshot of the card element
        const cardElement = await page.$('.card-wrapper');
        if (!cardElement) {
            throw new Error('Card wrapper element not found');
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
    generateSupportSocialImage,
    renderSupportCard,
    truncateName,
    formatCurrency
};
