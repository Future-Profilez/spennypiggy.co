# Test: Deliverables Creation with Correct product_id

## Test Scenario: User Purchases 3 Wishes with Content

### Setup Data:
```php
// Mock payment with 3 wish items
$payment = (object) [
    'id' => 1,
    'user_id' => 2, // Gifter ID
    'owner_id' => 1, // Creator ID  
    'session_id' => 'cs_test_123456',
    'amount_subtotal' => 75.00
];

// Mock cart/payment items for 3 wishes
$paymentItems = [
    (object) [
        'id' => 1,
        'amount' => 25.00,
        'quantity' => 1,
        'user_cart_id' => 101,
        'wish' => (object) [
            'id' => 123, // Database wish_id
            'wishname' => 'Digital Art Bundle',
            'price_id' => 'price_123',
            'user_id' => 1, // Creator ID
            'stripe_product_id' => 'prod_abc123',
            'content_file' => 'abc-123-uuid',
            'content_file_type' => 'application/pdf'
        ]
    ],
    (object) [
        'id' => 2,
        'amount' => 30.00,
        'quantity' => 1,
        'user_cart_id' => 102,
        'wish' => (object) [
            'id' => 124, // Database wish_id
            'wishname' => 'Exclusive Video',
            'price_id' => 'price_124',
            'user_id' => 1, // Creator ID
            'stripe_product_id' => 'prod_def456',
            'reward' => 'def-456-uuid'
        ]
    ],
    (object) [
        'id' => 3,
        'amount' => 20.00,
        'quantity' => 1,
        'user_cart_id' => 103,
        'wish' => (object) [
            'id' => 125, // Database wish_id
            'wishname' => 'Music Track',
            'price_id' => 'price_125',
            'user_id' => 1, // Creator ID
            'stripe_product_id' => 'prod_ghi789',
            'content_file' => 'ghi-789-uuid',
            'content_file_type' => 'audio/mp3'
        ]
    ]
];
```

### Expected Result:

When `CheckoutMailToUser::processIndividualDeliverables()` is called, it should create **exactly 3 deliverable records**:

#### Deliverable 1: Digital Art Bundle
```php
[
    'uuid' => 'generated-uuid-1',
    'product_id' => '123',  // ✅ Database wish_id, NOT Stripe product_id
    'item_id' => 123,       // ✅ NEW: Database wish_id for easy querying
    'price_id' => 'price_123',
    'creator_id' => 1,
    'gifter_id' => 2,
    'deliverable_type' => 'digital_file',
    'product_type' => 'wish',
    'transaction_amount' => 25.00,
    'deliverable_url' => 'https://ucarecdn.com/abc-123-uuid/',
    'status' => 'delivered',
    'metadata' => json_encode([
        'wish_id' => 123,
        'stripe_product_id' => 'prod_abc123',
        'wish_name' => 'Digital Art Bundle',
        'content_file_type' => 'application/pdf',
        'individual_delivery' => true,
        'cart_item_id' => 101
    ])
]
```

#### Deliverable 2: Exclusive Video  
```php
[
    'uuid' => 'generated-uuid-2',
    'product_id' => '124',  // ✅ Database wish_id
    'item_id' => 124,       // ✅ NEW: Database wish_id for easy querying
    'price_id' => 'price_124',
    'creator_id' => 1,
    'gifter_id' => 2,
    'deliverable_type' => 'digital_file',
    'product_type' => 'wish',
    'transaction_amount' => 30.00,
    'deliverable_url' => 'https://ucarecdn.com/def-456-uuid/',
    'status' => 'delivered',
    'metadata' => json_encode([
        'wish_id' => 124,
        'stripe_product_id' => 'prod_def456',
        'wish_name' => 'Exclusive Video',
        'content_file_type' => 'image',
        'individual_delivery' => true,
        'cart_item_id' => 102
    ])
]
```

#### Deliverable 3: Music Track
```php
[
    'uuid' => 'generated-uuid-3',
    'product_id' => '125',  // ✅ Database wish_id
    'item_id' => 125,       // ✅ NEW: Database wish_id for easy querying
    'price_id' => 'price_125',
    'creator_id' => 1,
    'gifter_id' => 2,
    'deliverable_type' => 'digital_file',
    'product_type' => 'wish',
    'transaction_amount' => 20.00,
    'deliverable_url' => 'https://ucarecdn.com/ghi-789-uuid/',
    'status' => 'delivered',
    'metadata' => json_encode([
        'wish_id' => 125,
        'stripe_product_id' => 'prod_ghi789',
        'wish_name' => 'Music Track',
        'content_file_type' => 'audio/mp3',
        'individual_delivery' => true,
        'cart_item_id' => 103
    ])
]
```

### Key Verification Points:

1. **✅ Correct product_id**: Each deliverable uses the database `wish_id` (123, 124, 125) as `product_id`
2. **✅ Individual Records**: Exactly 3 separate deliverable records are created
3. **✅ Complete Traceability**: Each record includes both `wish_id` and `stripe_product_id` in metadata
4. **✅ Content URLs**: Each deliverable has proper `deliverable_url` based on content type
5. **✅ Individual Emails**: Each deliverable triggers separate email notification
6. **✅ Notification Tracking**: Each deliverable creates entry in `deliverable_notifications` table

### Database Queries to Verify:

```sql
-- Check total deliverables created for the payment
SELECT COUNT(*) FROM deliverables WHERE session_id = 'cs_test_123456';
-- Expected: 3

-- ✅ NEW: Check item_id column contains wish_id
SELECT item_id, product_id, JSON_EXTRACT(metadata, '$.wish_id') as wish_id 
FROM deliverables WHERE session_id = 'cs_test_123456';
-- Expected:
-- item_id=123, product_id='123', wish_id=123
-- item_id=124, product_id='124', wish_id=124  
-- item_id=125, product_id='125', wish_id=125

-- ✅ Find all deliverables for a specific wish item (using new item_id)
SELECT * FROM deliverables WHERE item_id = 123;
-- Returns all deliverables for wish item ID 123

-- ✅ Join with wish_items table using the foreign key
SELECT d.*, w.wishname, w.price 
FROM deliverables d
JOIN wish_items w ON w.id = d.item_id
WHERE d.session_id = 'cs_test_123456';
-- Returns deliverables with wish item details

-- Check that each has individual_delivery flag
SELECT JSON_EXTRACT(metadata, '$.individual_delivery') as individual_flag
FROM deliverables WHERE session_id = 'cs_test_123456';
-- Expected: All should be 'true'

-- Check deliverable notifications created
SELECT COUNT(*) FROM deliverable_notifications dn
JOIN deliverables d ON d.id = dn.deliverable_id
WHERE d.session_id = 'cs_test_123456';
-- Expected: 3
```

This test confirms that the system now correctly:
- Uses database `wish_id` as `product_id` in deliverables table
- Creates exactly one deliverable record per purchased wish item  
- Maintains full traceability with both database and Stripe identifiers
- Provides individual email notifications and tracking per item