import html2canvas from 'html2canvas';
import { renderSupportCard, truncateName, formatCurrency } from './SocialImageTemplates.js';

/**
 * Generate support social image using HTML template and html2canvas
 * @param {Object} payload - Support payment data
 * @param {Object} payload.creator - Creator object with name, username, avatar
 * @param {string} payload.supporterName - Supporter name
 * @param {number} payload.amount - Support amount
 * @param {string} payload.currency - Currency code
 * @param {boolean} payload.isAnonymous - Whether supporter is anonymous
 * @param {string} payload.message - Optional support message
 * @returns {Promise<File>} Generated image as File object
 */
export async function generateSupportSocialImage(payload) {
    try {
        console.log('🎨 Generating support social image with payload:', payload);

        // Validate required data
        if (!payload.creator || !payload.creator.avatar) {
            throw new Error('Creator with avatar is required');
        }

        // Prepare data with formatting and truncation
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

        // Create off-screen container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.zIndex = '-1';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);

        // Generate HTML content using template
        container.innerHTML = renderSupportCard(formattedData);
        
        const card = container.querySelector('#card-to-capture');
        if (!card) {
            throw new Error('Card element not found in template');
        }

        // Wait for all images to load
        const images = card.querySelectorAll('img');
        console.log(`⏳ Waiting for ${images.length} images to load...`);
        
        await Promise.all(Array.from(images).map(img => {
            return new Promise((resolve, reject) => {
                if (img.complete && img.naturalWidth > 0) {
                    console.log(`✅ Image already loaded: ${img.src.substring(0, 50)}...`);
                    resolve();
                } else {
                    img.onload = () => {
                        console.log(`✅ Image loaded: ${img.src.substring(0, 50)}...`);
                        resolve();
                    };
                    img.onerror = (error) => {
                        console.warn(`⚠️ Image failed to load: ${img.src}`, error);
                        // Continue even if image fails to prevent blocking
                        resolve();
                    };
                    // Set a timeout to prevent hanging
                    setTimeout(() => {
                        console.warn(`⏰ Image load timeout: ${img.src.substring(0, 50)}...`);
                        resolve();
                    }, 10000);
                }
            });
        }));

        // Add small delay to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🖼️ Converting HTML to canvas...');
        
        // Convert to canvas using html2canvas
        const canvas = await html2canvas(card, {
            useCORS: true,
            scale: 2,
            allowTaint: false,
            backgroundColor: null,
            logging: false,
            width: 600,
            height: 337.5
        });

        console.log(`📐 Canvas dimensions: ${canvas.width}x${canvas.height}`);

        // Convert canvas to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        if (!blob) {
            throw new Error('Failed to convert canvas to blob');
        }

        console.log(`📦 Generated blob size: ${(blob.size / 1024).toFixed(1)}KB`);

        // Create File object
        const filename = `${payload.creator.username}-support-${Date.now()}.png`;
        const file = new File([blob], filename, { type: blob.type });

        console.log(`✅ Support social image generated successfully: ${filename}`);

        return file;

    } catch (error) {
        console.error('❌ Error generating support social image:', error);
        throw error;
    } finally {
        // Cleanup: remove the temporary container
        setTimeout(() => {
            const containers = document.querySelectorAll('div[style*="left: -9999px"]');
            containers.forEach(container => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            });
        }, 1000);
    }
}

/**
 * Helper function to upload generated image to Uploadcare
 * @param {File} imageFile - Generated image file
 * @returns {Promise<string>} Uploadcare UUID
 */
export async function uploadSupportImageToUploadcare(imageFile) {
    try {
        console.log('📤 Uploading support image to Uploadcare...');

        const formData = new FormData();
        formData.append('UPLOADCARE_PUB_KEY', window.uploadcarePublicKey || process.env.UPLOADCARE_PUBLIC_KEY);
        formData.append('UPLOADCARE_STORE', '1');
        formData.append('file', imageFile);

        const response = await fetch('https://upload.uploadcare.com/base/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Uploadcare API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.file) {
            throw new Error('No file UUID returned from Uploadcare');
        }

        console.log(`✅ Image uploaded to Uploadcare: ${data.file}`);
        return data.file;

    } catch (error) {
        console.error('❌ Error uploading to Uploadcare:', error);
        throw error;
    }
}

/**
 * Complete workflow: Generate and upload support social image
 * @param {Object} payload - Support payment data
 * @returns {Promise<Object>} Result with file and uuid
 */
export async function generateAndUploadSupportSocialImage(payload) {
    try {
        console.log('🚀 Starting complete support social image workflow...');

        const imageFile = await generateSupportSocialImage(payload);
        const uuid = await uploadSupportImageToUploadcare(imageFile);

        const result = {
            file: imageFile,
            uuid: uuid,
            url: `https://ucarecdn.com/${uuid}/`,
            filename: imageFile.name
        };

        console.log('🎉 Support social image workflow completed successfully:', result);
        return result;

    } catch (error) {
        console.error('💥 Support social image workflow failed:', error);
        throw error;
    }
}