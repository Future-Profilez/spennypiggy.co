#!/usr/bin/env node

/**
 * Test script for support social image generation
 * Usage: node test-support-image.js
 */

import { generateSupportSocialImage } from './renderSupportImage.js';
import fs from 'fs';

async function testImageGeneration() {
    console.log('🧪 Testing support social image generation...\n');

    const testPayloads = [
        {
            creator: {
                name: 'Emma Thompson',
                username: 'emmathompson',
                avatar: 'test-uuid-123' // This will fail in actual generation, but tests the flow
            },
            supporterName: 'John Smith',
            amount: 25.00,
            currency: 'GBP',
            isAnonymous: false,
            message: 'Love your content! Keep up the great work! 🎉'
        },
        {
            creator: {
                name: 'Alex Rodriguez',
                username: 'alexrod',
                avatar: 'test-uuid-456'
            },
            supporterName: 'Anonymous User',
            amount: 10.50,
            currency: 'USD',
            isAnonymous: true,
            message: null
        },
        {
            creator: {
                name: 'Very Long Creator Name That Should Be Truncated',
                username: 'longnameuser',
                avatar: 'test-uuid-789'
            },
            supporterName: 'Another Very Long Supporter Name That Also Needs Truncating',
            amount: 100.99,
            currency: 'EUR',
            isAnonymous: false,
            message: 'This is a very long message that should be truncated to fit within the message bubble on the social card. It contains lots of text to test the truncation functionality.'
        }
    ];

    for (let i = 0; i < testPayloads.length; i++) {
        const payload = testPayloads[i];
        console.log(`\n📝 Test ${i + 1}/3:`);
        console.log('Creator:', payload.creator.name);
        console.log('Supporter:', payload.supporterName);
        console.log('Amount:', `${payload.currency} ${payload.amount}`);
        console.log('Anonymous:', payload.isAnonymous ? 'Yes' : 'No');
        console.log('Message:', payload.message ? `"${payload.message.substring(0, 50)}${payload.message.length > 50 ? '...' : ''}"` : 'None');

        try {
            console.log('🎨 Generating image...');
            const imageBuffer = await generateSupportSocialImage(payload);
            
            const filename = `test-support-${i + 1}.png`;
            fs.writeFileSync(`/tmp/${filename}`, imageBuffer);
            
            console.log(`✅ Success! Image saved as /tmp/${filename}`);
            console.log(`📏 Size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);

        } catch (error) {
            console.log(`❌ Test ${i + 1} failed:`, error.message);
            
            // For avatar loading errors, this is expected with test UUIDs
            if (error.message.includes('avatar') || error.message.includes('load')) {
                console.log('ℹ️  This is expected with test avatar UUIDs');
            }
        }
        
        console.log('─'.repeat(60));
    }

    console.log('\n🎉 Testing complete!\n');
    console.log('💡 To test with real data:');
    console.log('   node renderSupportImage.js \'{"creator":{"name":"Real Creator","username":"realuser","avatar":"real-uuid"},"supporterName":"Real Supporter","amount":15,"currency":"GBP","isAnonymous":false,"message":"Thanks!"}\'');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testImageGeneration().catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });
}
