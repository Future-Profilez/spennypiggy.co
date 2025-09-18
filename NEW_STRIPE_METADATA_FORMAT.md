# New Stripe Metadata Format - Flattened Content URLs

## ✅ **Problem Solved**

**Before**: Content URLs were stored as JSON strings in Stripe metadata, making them hard to access directly.  
**After**: Content URLs are flattened into individual keys with `content_delivery_status` added.

## 📊 **Before vs After Comparison**

### **❌ OLD Format (JSON strings):**
```json
{
  "content_urls": "[{\"wish_id\":47,\"wish_name\":\"Content wish 2\",\"has_content\":true,\"content_url\":\"https://ucarecdn.com/2b9df342-0f0b-4036-becb-96b2f296a359/\",\"content_type\":\"file\",\"delivery_status\":\"ready\",\"source\":\"content_file\"},{\"wish_id\":46,\"wish_name\":\"Test Wishlist\",\"has_content\":true,\"content_url\":\"https://ucarecdn.com/ef8cec02-b286-4801-ab90-9d9ceb54c8a6/\",\"content_type\":\"\",\"delivery_status\":\"ready\",\"source\":\"content_file\"}]",
  "wish_items": "[{\"wish_id\":47,\"wish_name\":\"Content wish 2\",\"quantity\":1,\"amount\":99.99},{\"wish_id\":46,\"wish_name\":\"Test Wishlist\",\"quantity\":1,\"amount\":399.99}]",
  "wish_id": "47",
  "deliverable_type": "media_bundle"
}
```

### **✅ NEW Format (Flattened keys):**
```json
{
  // Basic payment info
  "buyer_email": "anonymous@spennypiggy.co",
  "buyer_id": "44",
  "buyer_name": "Anonymous", 
  "buyer_username": "guest",
  "creator_id": "45",
  "creator_name": "Prem Jangid",
  "creator_username": "premfuture",
  
  // Content delivery status - NEW!
  "content_delivery_status": "delivered",
  
  // Content summary
  "has_content": "true",
  "content_items_count": "2",
  
  // Individual content items (flattened)
  "item_1_wish_id": "47",
  "item_1_wish_name": "Content wish 2",
  "item_1_content_url": "https://ucarecdn.com/2b9df342-0f0b-4036-becb-96b2f296a359/",
  "item_1_content_type": "file",
  "item_1_content_source": "content_file",
  
  "item_2_wish_id": "46", 
  "item_2_wish_name": "Test Wishlist",
  "item_2_content_url": "https://ucarecdn.com/ef8cec02-b286-4801-ab90-9d9ceb54c8a6/",
  "item_2_content_type": "file",
  "item_2_content_source": "content_file",
  
  // Payment details
  "certificate": "true",
  "deliverable_type": "media_bundle",
  "items_count": "2",
  "payment_type": "Destination Charges with transfers",
  "product_type": "wish_one_off",
  "quantity": "2",
  
  // Clean wish items summary (no duplication)
  "wish_items_summary": "{\"total_items\":2,\"total_amount\":499.98,\"wish_ids\":[47,46],\"wish_names\":[\"Content wish 2\",\"Test Wishlist\"]}",
  
  // Backward compatibility (clean JSON)
  "content_urls": "[{\"wish_id\":47,\"wish_name\":\"Content wish 2\",\"content_url\":\"https://ucarecdn.com/2b9df342-0f0b-4036-becb-96b2f296a359/\",\"content_type\":\"file\",\"source\":\"content_file\"},{\"wish_id\":46,\"wish_name\":\"Test Wishlist\",\"content_url\":\"https://ucarecdn.com/ef8cec02-b286-4801-ab90-9d9ceb54c8a6/\",\"content_type\":\"file\",\"source\":\"content_file\"}]"
}
```

## 🎯 **Key Improvements**

### **1. ✅ Flattened Content URLs**
- **Before**: `content_urls` as JSON string  
- **After**: Individual keys like `item_1_content_url`, `item_2_content_url`

### **2. ✅ Added Content Delivery Status** 
- **NEW**: `content_delivery_status: "delivered"` key added

### **3. ✅ Removed Duplicates**
- Cleaned up redundant metadata fields
- Replaced verbose `wish_items` with concise `wish_items_summary`

### **4. ✅ Direct Access**
```php
// OLD way (parsing JSON)
$contentUrls = json_decode($metadata['content_urls'], true);
$firstUrl = $contentUrls[0]['content_url'];

// NEW way (direct access)
$firstUrl = $metadata['item_1_content_url'];
$deliveryStatus = $metadata['content_delivery_status'];
```

## 🔍 **Example: 2 Wishes with Content**

### **Cart Items:**
1. **Content wish 2** (ID: 47) - File content
2. **Test Wishlist** (ID: 46) - File content

### **Generated Metadata:**
```json
{
  "content_delivery_status": "delivered",
  "has_content": "true", 
  "content_items_count": "2",
  
  "item_1_wish_id": "47",
  "item_1_wish_name": "Content wish 2", 
  "item_1_content_url": "https://ucarecdn.com/2b9df342-0f0b-4036-becb-96b2f296a359/",
  "item_1_content_type": "file",
  "item_1_content_source": "content_file",
  
  "item_2_wish_id": "46",
  "item_2_wish_name": "Test Wishlist",
  "item_2_content_url": "https://ucarecdn.com/ef8cec02-b286-4801-ab90-9d9ceb54c8a6/", 
  "item_2_content_type": "file",
  "item_2_content_source": "content_file"
}
```

## 🚀 **Benefits**

### **For Developers:**
- ✅ **Direct access** to content URLs without JSON parsing
- ✅ **Clear structure** with predictable key names
- ✅ **No duplicates** - cleaner metadata
- ✅ **Delivery status** clearly indicated

### **For System Processing:**
- ✅ **Faster access** - no JSON decode needed
- ✅ **Better logging** - individual fields easily accessible
- ✅ **Easier debugging** - flat structure more readable
- ✅ **Backward compatible** - still includes JSON for legacy code

### **For Analytics:**
- ✅ **Easy counting** - `content_items_count` directly available
- ✅ **Direct filtering** - filter by `content_delivery_status`
- ✅ **Simple queries** - access specific content URLs by item number

## 📝 **Usage Examples**

### **Access Content URLs:**
```php
// Get first content URL
$url1 = $metadata['item_1_content_url'];

// Check delivery status  
$isDelivered = $metadata['content_delivery_status'] === 'delivered';

// Count content items
$count = intval($metadata['content_items_count']);

// Loop through all content items
for ($i = 1; $i <= $count; $i++) {
    $wishId = $metadata["item_{$i}_wish_id"];
    $contentUrl = $metadata["item_{$i}_content_url"];
    $wishName = $metadata["item_{$i}_wish_name"];
}
```

### **Email Processing:**
```php
// Easy access for email templates
$contentItems = [];
for ($i = 1; $i <= intval($metadata['content_items_count']); $i++) {
    $contentItems[] = [
        'name' => $metadata["item_{$i}_wish_name"],
        'url' => $metadata["item_{$i}_content_url"],
        'type' => $metadata["item_{$i}_content_type"]
    ];
}
```

This new format makes Stripe metadata much cleaner and easier to work with! 🎉