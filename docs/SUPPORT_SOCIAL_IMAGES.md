# Support Social Image Generation System

## Overview

This system automatically generates social media images for support payment thank-you posts, using the exact same HTML-based design approach as the EditProfile component. When someone makes a support payment, a beautiful social image is automatically created and attached to the thank-you post.

**✅ UPDATED**: The system now uses the same HTML template design as EditProfile instead of basic PHP GD library drawing.

**🤖 NEW**: Dynamic content generation using OpenAI ChatGPT for personalized thank you posts.

## Architecture

### Frontend Components
- **`SocialImageTemplates.js`** - Shared HTML templates for both profile and support images
- **`generateSupportSocialImage.js`** - Frontend utility for generating images using html2canvas
- **`SupportImageDemo.jsx`** - Testing component for frontend development

### Backend Components
- **`CreateThankYouPostJob.php`** - Laravel job that handles support payment thank-you posts
- **`renderSupportImage.js`** - Node.js script for server-side image generation using Puppeteer

## How It Works

1. **Support Payment Made** → Triggers `CreateThankYouPostJob`
2. **Data Preparation** → Job extracts creator, supporter, amount, currency, message
3. **Dynamic Content** → OpenAI ChatGPT generates personalized title and content
4. **Node.js Generation** → Calls `renderSupportImage.js` with payload using Symfony Process
5. **HTML Template** → Uses shared `SocialImageTemplates.js` for consistent design
6. **Render with Puppeteer** → Converts HTML template to PNG with embedded assets
7. **Upload** → Image uploaded to Uploadcare via cURL
8. **Post Creation** → Thank-you post created with dynamic content and attached social image

## File Structure

```
resources/
├── js/
│   ├── utils/
│   │   ├── SocialImageTemplates.js      # Shared HTML templates
│   │   └── generateSupportSocialImage.js # Frontend image generation
│   └── Components/
│       └── SupportImageDemo.jsx         # Testing component
├── node/
│   ├── renderSupportImage.js            # Server-side image generation
│   └── test-support-image.js            # Test script
└── assets/
    ├── social-bg.png                    # Background image
    └── img/logo.png                     # Logo
```

## Usage

### Frontend Testing
```javascript
import { generateSupportSocialImage } from '../utils/generateSupportSocialImage.js';

const payload = {
    creator: {
        name: 'Creator Name',
        username: 'creatorusername',
        avatar: 'uploadcare-uuid'
    },
    supporterName: 'Supporter Name',
    amount: 25.50,
    currency: 'GBP',
    isAnonymous: false,
    message: 'Thank you message'
};

const imageFile = await generateSupportSocialImage(payload);
```

### Backend (Automatic via Jobs)
The system runs automatically when support payments are made. The `CreateThankYouPostJob` handles everything.

### Manual Testing
```bash
# Test with latest tip payment (includes OpenAI content test)
php artisan test:support-image

# Test with specific tip payment ID
php artisan test:support-image 123

# Test only OpenAI content generation
php artisan test:openai-content

# Test Node.js script directly
node resources/node/renderSupportImage.js '{"creator":{"name":"Test Creator","username":"test","avatar":"real-uuid"},"supporterName":"Test Supporter","amount":10,"currency":"GBP","isAnonymous":false,"message":"Thanks!"}'

# Run Node.js test suite
node resources/node/test-support-image.js
```

## Template Design

### Profile Template (EditProfile)
- Creator avatar in circular frame with green border
- Creator name (uppercase, large font)
- "is now on" text with Spenny Piggy logo  
- Profile URL in gradient bubble
- Decorative emojis: ✨⭐💰

### Support Template (Thank You Posts)
- **Same background and styling** as EditProfile template
- **Centered layout** optimized for thank you messaging
- **No creator avatar/name** - focuses on thanking the supporter
- **Gratitude-focused content**: 
  - "🎉 THANK YOU! 🎉" prominent heading
  - "Thank you [Supporter Name]" personalized message
  - "for making my day special with" connecting text
  - Amount highlighted in bright yellow/gold
  - Optional support message in italics
- **Profile URL** in identical gradient bubble style
- **Same background**: Pink gradient with white dot overlay (gift boxes already in background)
- **Clean, centered design** perfect for sharing

## Dynamic Content Generation

### OpenAI Integration
- **AI-Powered Content**: Uses ChatGPT to generate unique titles and content for each post
- **Personalized Messages**: Takes into account creator name, supporter name, amount, and support message
- **Variety**: Each thank you post feels authentic and different
- **Fallback System**: If OpenAI fails, uses randomized professional templates

### Content Examples
**AI-Generated Titles:**
- "✨ Heartfelt Thanks!"
- "🎊 You Made My Day!"
- "💝 Amazing Support Received!"
- "🙌 Incredible Generosity!"

**AI-Generated Content:**
- Personalized thank you messages
- Contextual references to the support amount
- Mentions supporter by name (or "anonymous supporter")
- Includes relevant emojis and hashtags
- Incorporates supporter's message when provided

### Fallback Templates
- **5 Professional Templates**: Randomly selected if AI fails
- **Placeholder Replacement**: Dynamic insertion of names, amounts, currency
- **Consistent Quality**: Ensures posts are always professional
- **Emoji Integration**: Maintains engaging visual appeal

## Design Specifications

- **Dimensions**: 600×337.5px (16:9 aspect ratio)
- **Background**: Pink gradient with gift box decorations
- **Avatar**: 112px circular with green border (#00ff5e)
- **Typography**: System fonts, mixed weights
- **Colors**: 
  - Primary: White text
  - Accent: Gold (#fbbf24) for amounts/highlights
  - Secondary: Light gray for supporting text

## Configuration

### Dependencies
```json
{
  "html2canvas": "^1.4.1",
  "puppeteer": "^23.9.0"
}
```

### Environment Variables
```env
UPLOADCARE_PUBLIC_KEY=your-public-key
UPLOADCARE_SECRET_KEY=your-secret-key
```

## Error Handling

### Common Issues
1. **Missing Avatar**: Job skips image generation if creator has no avatar
2. **Uploadcare Timeout**: 30-second timeout for uploads
3. **Puppeteer Failures**: Fallback to text-only posts
4. **Long Names**: Automatic truncation (20 chars for creator, 25 for supporter)
5. **Large Messages**: Truncated to 80 characters with ellipsis

### Logging
All operations are logged with structured data:
```php
Log::info('HTML-based support social image generated successfully', [
    'image_uuid' => $imageUuid,
    'tip_payment_id' => $this->tipPayment->id
]);
```

## Deployment Checklist

- [ ] Install Puppeteer: `npm install puppeteer`
- [ ] Verify Node.js path: `which node` 
- [ ] Test script execution: `node resources/node/test-support-image.js`
- [ ] Check file permissions on `/tmp` directory
- [ ] Verify Uploadcare credentials
- [ ] Test with real support payment in staging
- [ ] Monitor queue worker logs

## Development Workflow

### Making Design Changes
1. Edit templates in `SocialImageTemplates.js`
2. Test changes using `SupportImageDemo.jsx` component
3. Verify Node.js script picks up changes
4. Test end-to-end with queue worker

### Adding New Templates
1. Add template function to `SocialImageTemplates.js`
2. Update Node.js script to handle new template
3. Add corresponding utility in `generateSupportSocialImage.js`

## Performance

- **Generation Time**: ~2-3 seconds per image
- **File Size**: ~50-150KB PNG files
- **Memory Usage**: ~100MB peak during Puppeteer rendering
- **Concurrency**: Handled via Laravel queue system

## Future Enhancements

- [ ] Support for different languages/currencies
- [ ] Custom themes based on creator preferences  
- [ ] Video/GIF support for premium creators
- [ ] A/B testing for different template designs
- [ ] Analytics on social image engagement
- [ ] Automatic color palette extraction from creator branding

## Troubleshooting

### Image Generation Fails
```bash
# Check Node.js and dependencies
node --version
npm list puppeteer

# Test script manually
node resources/node/renderSupportImage.js '{"creator":{"name":"Test","username":"test","avatar":"real-uuid"},"supporterName":"Test","amount":1,"currency":"GBP","isAnonymous":false}'

# Check Laravel logs
tail -f storage/logs/laravel.log | grep "support social image"
```

### Queue Job Issues
```bash
# Restart queue worker
php artisan queue:restart

# Process jobs manually
php artisan queue:work --once

# Check failed jobs
php artisan queue:failed
```

## Related Documentation

- [EditProfile Social Images](./PROFILE_SOCIAL_IMAGES.md)
- [Queue System](./QUEUE_SYSTEM.md)
- [Uploadcare Integration](./UPLOADCARE.md)
- [Thank You Posts](./THANK_YOU_POSTS.md)