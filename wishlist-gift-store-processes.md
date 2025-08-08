# Step 6: Wishlist & Gift Store Processes

This document describes the comprehensive wishlist and gift store processes in SpennyPiggy, including wish item creation, categorization, cart management, and checkout flows for both authenticated and anonymous users.

## 1. Wish Item Creation Process

### 1.1 Creating Wish Items
**Controller**: `WishitemController@addWishItem` and `WishitemController@saveWishItem`

**Process Flow**:
1. **Validation**: Validates wish item data including:
   - Wishname (4-255 characters)
   - Price (numeric, minimum 0)
   - Item URL (optional)
   - Thumbnail image
   - Subscription type (0=one-time, 1=subscription, 2=crowdfund)
   - Subscription period (for type 1)
   - Categories (optional)

2. **Content Filtering**: Uses `Helpers::checkBlockData()` to filter inappropriate content and emojis

3. **Price Calculation**:
   - Applies tax based on subscription type:
     - Single purchase: `config('app.single_tax')` (typically 20%)
     - Subscription: `config('app.subs_tax')` 
     - Crowdfunding: `config('app.crowd_tax')` (typically 10%)
   - Adds administration fee: `config('app.administration_fee')`
   - Creates final price including taxes

4. **Database Storage**:
   - Creates `WishItem` record with calculated pricing
   - Links to user's default currency
   - Stores subscription settings if applicable

5. **Stripe Integration**:
   - Creates Stripe product in creator's connected account
   - Sets up pricing with tax calculations
   - Stores `stripe_product_id` and `price_id` for later use

6. **Auto-Tweet**: If user has auto-tweet enabled, dispatches `AutoTweetWishAdd` job

### 1.2 Updating Wish Items
**Controller**: `WishitemController@updateWishItem`

- Allows modification of existing wish items
- Recalculates pricing if price or subscription type changes  
- Updates Stripe product information
- Creates new price objects in Stripe when needed
- Marks item as unapproved for admin review after edits

### 1.3 Wish Item Types

**One-time Purchase (subscription = 0)**:
- Standard gift purchase
- Single payment to creator
- Immediate fulfillment

**Subscription (subscription = 1)**:
- Recurring payments (daily/weekly/monthly)
- Provides access to exclusive content
- Can be purchased as one-time or recurring
- Creates subscription records for ongoing access

**Crowdfunding (subscription = 2)**:
- Flexible amount contributions
- Has funding goal (`fullfill_amount`)
- Multiple contributors can fund single item
- Progress tracking with percentage completed

## 2. Category Management

### 2.1 Creating Categories
**Controller**: `WishitemController@saveUserCategory`

**Process**:
1. Validates category name (3-30 characters, alphanumeric with dashes)
2. Checks for content filtering
3. Prevents duplicate categories per user
4. Creates `UserCategory` record

### 2.2 Assigning Categories to Wishes
- During wish creation, users can select multiple categories
- Creates `WishCategory` records linking wishes to categories
- Allows filtering and organization of wish items

### 2.3 Category Management Interface
**Frontend**: `EditCategories.jsx`
- View all user categories
- Rename categories
- Delete categories (removes category assignments from wishes)

## 3. Pinning Items

### 3.1 Pin/Unpin Functionality
**Endpoint**: `/pin-item/{id}` (handled in routes)
**Frontend**: `PinWish.jsx`

**Process**:
- Toggles `is_pin` field in `wish_items` table
- Pinned items appear at the top of user's wishlist
- Provides priority display for most important wishes

## 4. Twitter Sharing Integration

### 4.1 Twitter Authentication
**Controller**: `TwitterController`

**OAuth Flow**:
1. **Initialization**: `authInit()` creates OAuth state and challenge
2. **Authentication**: Redirects to Twitter OAuth with required scopes
3. **Callback Handling**: `handleAuth()` processes Twitter response
4. **Token Storage**: Stores access tokens in `twitter_tokens` table

### 4.2 Auto-Tweet System
**Jobs**: 
- `AutoTweetWishAdd`: Tweets when new wish added
- `CheckoutTweet`: Tweets when wish purchased
- `CrowdfundTweet`: Tweets crowdfunding updates
- `SubscribeAutoTweet`: Tweets subscription purchases

**Tweet Content Examples**:
- New wish: "New wishlist added: [wishname]! Check it out at [profile_url]"
- Purchase: "[user] just bought me [wishname]! Thank you!"

### 4.3 Manual Sharing
**Frontend**: `ShareProfile.jsx`
- Uses Web Share API when available
- Fallback to clipboard copy
- Shareable URLs include creator username and wish details

## 5. Gifter Cart System

### 5.1 Device-Based Cart Management
**Anonymous Users**:
- Uses device fingerprinting via `DeviceID.jsx`
- Generates unique identifier from:
  - User agent string
  - Platform information  
  - Screen resolution
- Base64 encoded for consistency
- Stored in `user_carts` table with `device_id`

### 5.2 Authenticated Cart Management
**Logged Users**:
- Cart items linked via `user_id`
- Persistent across sessions and devices
- Can merge with anonymous cart on login

### 5.3 Adding Items to Cart
**Controller**: `WishitemController@addToCart`
**Frontend**: `ToCart.jsx`

**Process Flow**:
1. **Authentication Check**: 
   - For amounts >£50, requires login
   - Checks gifter card verification status
   - Prevents self-gifting

2. **Item Validation**:
   - Checks if creator has payments enabled
   - Validates subscription/crowdfunding rules
   - Prevents duplicate purchases for non-repeatable items

3. **Price Calculation**:
   - Converts between currencies using `Helpers::priceFormat()`
   - Applies appropriate tax rates
   - Adds administration fees

4. **Cart Storage**:
   ```php
   UserCart::create([
       'user_id' => Auth::id() ?? null,
       'device_id' => !Auth::check() ? $device_id : null,
       'owner_id' => $wishitem->user_id,
       'wish_item_id' => $wishitem->id,
       'quantity' => 1,
       'amount' => $amount,
       'tax' => $tax,
       'is_subscribed' => $subscription_type,
       'priceid' => $stripe_price_id
   ]);
   ```

### 5.4 Cart Quantity Management
- Standard items: Single quantity
- Repeatable items: Can increase quantity
- Crowdfunding: Custom amounts allowed
- Subscription: One-time vs recurring options

### 5.5 Anonymous Cart Logic & Cookies

**Cookie Management**:
- `locale` cookie stores geo/currency information (1 year expiration)
- Device ID generated client-side for cart persistence
- Currency preference stored in cookies
- Anonymous carts preserved via `device_id` matching

**Anonymous to Authenticated Transition**:
- When anonymous user logs in, existing cart preserved via device_id
- Can merge anonymous cart with authenticated user's existing cart
- Maintains cart state across login process

## 6. Checkout Process via Stripe

### 6.1 Checkout Session Creation
**Controller**: `CheckoutController@createCheckout`

**Process**:
1. **Pre-checkout Validation**:
   - Verify creator has payments enabled
   - Check gifter card verification status
   - Validate cart contents and quantities

2. **Line Items Calculation**:
   ```php
   $lineItems = [
       // Main product
       [
           'quantity' => $quantity,
           'price_data' => [
               'currency' => $currency,
               'product' => $stripe_product_id,
               'unit_amount_decimal' => $item_amount * 100
           ]
       ],
       // Platform fee as separate line item
       [
           'quantity' => 1,
           'price_data' => [
               'currency' => $currency,
               'product_data' => ['name' => 'Platform Fee'],
               'unit_amount' => $platform_fee * 100
           ]
       ]
   ];
   ```

3. **Connected Account Customer Management**:
   - Check for existing customer in creator's Stripe account
   - Create new customer if needed
   - Store customer mapping in `connected_account_customers`

4. **Stripe Session Creation**:
   - Uses creator's connected account
   - Sets application fee for platform revenue
   - Configures success/cancel URLs
   - Includes metadata for tracking

### 6.2 Payment Processing
**Controllers**: `CheckoutController@successCheckout` / `CheckoutController@cancelCheckout`

**Success Flow**:
1. **Payment Confirmation**:
   - Updates `stripe_payment_details` with 'paid' status
   - Creates `stripe_payment_items` for each cart item
   - Records user payment in `user_payments` table

2. **Subscription Handling**:
   - For subscription items, creates `subscriptions` record
   - Sets start/end dates based on subscription period
   - Activates recurring billing if configured

3. **Crowdfunding Updates**:
   - Adds payment amount to `fullfill_amount`
   - Updates progress percentage
   - Triggers completion if goal reached

4. **Notification System**:
   - PWA notifications to both gifter and creator
   - Email notifications via queued jobs
   - Auto-tweets if creator has Twitter configured

5. **Cart Cleanup**:
   - Marks cart items as processed (`status = 0`)
   - Clears quantities
   - Preserves for order history

### 6.3 Anonymous Checkout Process
**Controllers**: `StripeController@createAnonymousCheckout`

**Differences from Authenticated Checkout**:
- Uses device_id instead of user_id for identification
- Simplified line items (no complex fee calculations)
- Limited to smaller amounts (<£50)
- Guest name/email captured during checkout
- Creates anonymous payment records

### 6.4 Subscription Checkout
**Controller**: `StripeController@wishItemSubscribe`

**Special Handling**:
- Creates `wish_item_subscriptions` record
- Supports one-time vs recurring subscription modes  
- Complex pricing with VAT calculations for EU users
- Currency conversion handling
- Connected account customer management with currency-specific pricing

## 7. Cart State Management

### 7.1 Redux Integration
**Frontend**: `UserSlice.jsx`
- Maintains cart count in application state
- Updates across components when items added/removed
- Persists basic cart state

### 7.2 Cart Persistence
**Database**: `user_carts` table
```sql
- user_id (nullable for anonymous)
- device_id (nullable for authenticated) 
- owner_id (creator receiving gift)
- wish_item_id
- quantity
- amount
- tax
- status (1=active, 0=processed)
- is_subscribed
- country
- priceid (Stripe price reference)
```

### 7.3 Multi-Creator Cart Support
- Single checkout session per creator
- Separate carts maintained per creator
- Individual checkout processes required
- Connected account isolation maintained

## 8. Currency and Internationalization

### 8.1 Multi-Currency Support
**Price Conversion**: `Helpers::priceFormat()`
- Real-time currency conversion
- Creator's default currency vs user's preferred currency
- Stripe handles final currency processing
- Geo-location based currency detection

### 8.2 Tax Calculations
**Regional Tax Handling**:
- UK users: VAT calculations
- EU users: VAT percentage based on creator settings
- Other regions: Standard platform fees
- Tax inclusive/exclusive pricing options

### 8.3 Geographic Restrictions
- IP-based location detection via `IpTracker` middleware
- UK users have different flow (`is_uk` flag)
- Regional compliance handling
- Currency auto-detection based on location

## 9. Error Handling and Edge Cases

### 9.1 Payment Failures
- Automatic retry mechanisms
- Failed payment notifications
- Cart state preservation
- Error logging and admin notifications

### 9.2 Cart Abandonment
- Expired cart cleanup processes
- Session timeout handling  
- Device ID collision resolution
- Anonymous to authenticated merging

### 9.3 Creator Account Issues
- Missing Stripe account handling
- Disabled payment detection
- Account suspension checks
- Payment pause functionality

This comprehensive process ensures secure, scalable handling of wishlist creation, cart management, and checkout flows while supporting both anonymous and authenticated users across multiple currencies and regions.
