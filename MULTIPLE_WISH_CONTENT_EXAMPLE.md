# Multiple Wish Items with Content URLs - Implementation Guide

## Scenario: User Purchases 3 Wish Items with Content

Let's say a user adds 3 wish items to their cart, all containing different types of content:

### Cart Items:
1. **Digital Art Bundle** - `content_file`: PDF + Images
2. **Exclusive Video** - `reward`: Video file  
3. **Music Track** - `content_file`: MP3 audio file

## How the System Now Handles This:

### 1. **Stripe Checkout Session Creation**
When the checkout session is created, the system now stores:

**Stripe Metadata:**
```json
{
  "items_count": "3",
  "content_urls": "[
    {
      \"wish_id\": 123,
      \"wish_name\": \"Digital Art Bundle\",
      \"has_content\": true,
      \"content_url\": \"https://ucarecdn.com/abc-123/art-bundle.pdf\",
      \"content_type\": \"pdf\",
      \"delivery_status\": \"ready\",
      \"source\": \"content_file\"
    },
    {
      \"wish_id\": 124,
      \"wish_name\": \"Exclusive Video\",
      \"has_content\": true,
      \"content_url\": \"https://ucarecdn.com/def-456/video.mp4\",
      \"content_type\": \"video\",
      \"delivery_status\": \"ready\",
      \"source\": \"reward\"
    },
    {
      \"wish_id\": 125,
      \"wish_name\": \"Music Track\",
      \"has_content\": true,
      \"content_url\": \"https://ucarecdn.com/ghi-789/track.mp3\",
      \"content_type\": \"audio\",
      \"delivery_status\": \"ready\",
      \"source\": \"content_file\"
    }
  ]",
  "wish_items": "[...]"
}
```

### 2. **Database Storage**
The `StripePaymentDetail` record stores comprehensive metadata:

```json
{
  "wish_items": [...],
  "content_urls": [...],
  "delivery_summary": {
    "total_items": 3,
    "items_with_content": 3,
    "items_ready_for_delivery": 3,
    "content_types": ["pdf", "video", "audio"],
    "primary_delivery_method": "email_with_content"
  },
  "creator_info": {...}
}
```

### 3. **Individual Deliverable Processing**
After successful payment, the system creates:

**3 Separate Deliverable Records:**
```sql
INSERT INTO deliverables (uuid, product_id, item_id, creator_id, gifter_id, deliverable_type, deliverable_url, status, metadata)
VALUES 
  ('uuid-1', '123', 123, 1, 2, 'digital_file', 'https://ucarecdn.com/abc-123/art-bundle.pdf', 'delivered', 
   '{"wish_id": 123, "stripe_product_id": "prod_abc123", "wish_name": "Digital Art Bundle", "content_type": "pdf", "individual_delivery": true}'),
   
  ('uuid-2', '124', 124, 1, 2, 'media_bundle', 'https://ucarecdn.com/def-456/video.mp4', 'delivered', 
   '{"wish_id": 124, "stripe_product_id": "prod_def456", "wish_name": "Exclusive Video", "content_type": "video", "individual_delivery": true}'),
   
  ('uuid-3', '125', 125, 1, 2, 'digital_file', 'https://ucarecdn.com/ghi-789/track.mp3', 'delivered', 
   '{"wish_id": 125, "stripe_product_id": "prod_ghi789", "wish_name": "Music Track", "content_type": "audio", "individual_delivery": true}');
```

**Key Points:**
- ✅ **`item_id` = Database wish_id** (123, 124, 125) - **NEW dedicated column**
- ✅ `product_id` = Database wish_id as string for compatibility
- ✅ `metadata` contains both `wish_id` AND `stripe_product_id` for reference
- ✅ Each wish gets **exactly one deliverable record**
- ✅ `individual_delivery: true` flag identifies these as individual item deliveries
- ✅ **Foreign key relationship** to `wish_items` table via `item_id`

### 4. **Individual Email Notifications**
The system sends **3 separate emails**:

- **Email 1**: "Your Digital Art Bundle is Ready!" with PDF download link
- **Email 2**: "Your Exclusive Video is Ready!" with video access link  
- **Email 3**: "Your Music Track is Ready!" with MP3 download link

### 5. **Deliverable Notifications Tracking**
The system creates **3 tracking records**:

```sql
INSERT INTO deliverable_notifications (deliverable_id, user_id, notification_type, subject, message, status)
VALUES 
  (1, 2, 'deliverable_delivered', 'Content Delivered: Digital Art Bundle', 'Your content for Digital Art Bundle has been delivered...', 'sent'),
  (2, 2, 'deliverable_delivered', 'Content Delivered: Exclusive Video', 'Your content for Exclusive Video has been delivered...', 'sent'),
  (3, 2, 'deliverable_delivered', 'Content Delivered: Music Track', 'Your content for Music Track has been delivered...', 'sent');
```

## Key Benefits:

### 🎯 **For Users:**
- Receive individual emails for each purchased item
- Clear content URLs for each item
- Better organization of purchased content
- Individual tracking per item

### 🛠️ **For Developers:**
- Comprehensive metadata in both Stripe and database
- Individual deliverable tracking
- Enhanced debugging with detailed logs
- Scalable to any number of wish items

### 📊 **For Analytics:**
- Track delivery success per item type
- Monitor content engagement
- Identify popular content formats
- Analyze delivery performance

## Implementation Highlights:

### ✅ **Stripe Metadata Enhancement**
- Stores complete content URL array
- Includes delivery status per item
- Maintains Stripe metadata size limits

### ✅ **Database Metadata Storage**
- Comprehensive JSON metadata in `StripePaymentDetail`
- Individual `deliverables` records per item
- Full audit trail with `deliverable_notifications`

### ✅ **Individual Email Processing**
- Enhanced `CheckoutMailToUser` job
- Metadata-driven content URL resolution
- Separate email per wish item

### ✅ **Smart Content URL Generation**
- Handles Uploadcare URLs and UUIDs
- Supports multiple file formats
- Flexible URL generation logic

This implementation ensures that when a user purchases multiple wish items with content, each item gets proper individual treatment with dedicated deliverable records, email notifications, and comprehensive tracking.