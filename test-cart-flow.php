<?php
// Test script to verify cart functionality
// Run with: php test-cart-flow.php

require_once 'bootstrap/app.php';

use App\Models\UserCart;
use App\Models\User;
use App\Models\WishItem;
use Illuminate\Support\Facades\Auth;

echo "=== CART FUNCTIONALITY TEST ===\n\n";

// Step 1: Check current cart state
echo "1. Checking current cart state...\n";
$cartCount = UserCart::count();
echo "   Total cart items in database: $cartCount\n\n";

// Step 2: Create test user and wish item if needed
echo "2. Setting up test data...\n";
$user = User::where('id', 55)->first();
if (!$user) {
    echo "   User 55 not found - please use an existing user\n";
    exit(1);
}
echo "   Using user: {$user->name} (ID: {$user->id})\n";

$wishOwner = User::where('id', 11)->first(); 
if (!$wishOwner) {
    echo "   Wish owner (ID: 11) not found - please use an existing user\n";
    exit(1);
}
echo "   Wish owner: {$wishOwner->name} (ID: {$wishOwner->id})\n";

$wish = WishItem::where('user_id', 11)->first();
if (!$wish) {
    echo "   No wish items found for owner - please create a wish item first\n";
    exit(1);
}
echo "   Using wish item: {$wish->wishname} (ID: {$wish->id})\n\n";

// Step 3: Test adding item to cart
echo "3. Adding item to cart...\n";
$cartItem = UserCart::create([
    'user_id' => $user->id,
    'owner_id' => $wishOwner->id,
    'wish_item_id' => $wish->id,
    'amount' => 100,
    'tax' => 20,
    'quantity' => 1,
    'status' => 1,
    'country' => 'global',
]);
echo "   ✓ Cart item created with ID: {$cartItem->id}\n\n";

// Step 4: Test authenticated cart API
echo "4. Testing authenticated cart API...\n";
Auth::loginUsingId($user->id);
$controller = new App\Http\Controllers\Auth\WishitemController();
$response = $controller->authenticatedCartItems();
$responseData = json_decode($response->getContent(), true);

echo "   API Response Success: " . ($responseData['success'] ? 'YES' : 'NO') . "\n";
echo "   Cart Items Count: " . count($responseData['carts'] ?? []) . "\n";
if (!empty($responseData['carts'])) {
    echo "   First item name: " . ($responseData['carts'][0]['items'][0]['wishname'] ?? 'N/A') . "\n";
}
echo "\n";

// Step 5: Test removal
echo "5. Testing cart item removal...\n";
$cartItem->delete();
echo "   ✓ Cart item deleted from database\n";

// Test API after deletion
$response2 = $controller->authenticatedCartItems();
$responseData2 = json_decode($response2->getContent(), true);
echo "   API Response after deletion - Cart Items Count: " . count($responseData2['carts'] ?? []) . "\n\n";

echo "=== TEST COMPLETED ===\n";
echo "✓ Cart addition works: " . (count($responseData['carts'] ?? []) > 0 ? 'YES' : 'NO') . "\n";
echo "✓ Cart removal works: " . (count($responseData2['carts'] ?? []) === 0 ? 'YES' : 'NO') . "\n";
echo "✓ API consistency: " . ($responseData['success'] && $responseData2['success'] ? 'YES' : 'NO') . "\n";

echo "\nNow test the frontend:\n";
echo "1. Go to the cart page (/cart)\n";
echo "2. Add an item to cart from a wish page\n";
echo "3. Check that it appears immediately on cart page\n";
echo "4. Remove it from database and click 'Refresh Cart' button\n";
echo "5. Verify it disappears immediately\n";
