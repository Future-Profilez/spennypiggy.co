<?php

echo "Testing device ID generation...\n\n";

// Test device ID based on the JavaScript function
function generateDeviceID($userAgent, $platform, $screenWidth, $screenHeight) {
    $uniqueString = "{$userAgent}_{$platform}_{$screenWidth}_{$screenHeight}";
    $hashedIdentifier = base64_encode($uniqueString);
    return $hashedIdentifier;
}

// The device ID that exists in the database
$dbDeviceId = "TW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzOS4wLjAuMCBTYWZhcmkvNTM3LjM2IEVkZy8xMzkuMC4wLjBfTWFjSW50ZWxfMTQ3MF85NTY=";

echo "Device ID from database:\n$dbDeviceId\n\n";

// Decode to see what it contains
$decoded = base64_decode($dbDeviceId);
echo "Decoded device ID:\n$decoded\n\n";

// Parse the components
$parts = explode('_', $decoded);
if (count($parts) >= 4) {
    $userAgent = $parts[0];
    $platform = $parts[1]; 
    $screenWidth = $parts[2];
    $screenHeight = $parts[3];
    
    echo "Parsed components:\n";
    echo "User Agent: $userAgent\n";
    echo "Platform: $platform\n";
    echo "Screen Width: $screenWidth\n";
    echo "Screen Height: $screenHeight\n\n";
    
    // Test regenerating
    $regenerated = generateDeviceID($userAgent, $platform, $screenWidth, $screenHeight);
    echo "Regenerated device ID:\n$regenerated\n\n";
    echo "Match: " . ($regenerated === $dbDeviceId ? "YES" : "NO") . "\n";
} else {
    echo "Could not parse device ID components properly\n";
}

echo "\nNow testing the anonymousCartItems method with this device ID...\n";

// Connect to database and test
require_once 'bootstrap/app.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$deviceId = $dbDeviceId;

echo "Testing with device ID: " . substr($deviceId, 0, 50) . "...\n";

$carts = \App\Models\UserCart::whereHas("wish")
    ->where("device_id", $deviceId)
    ->where("country", "global")
    ->where("status", 1)
    ->with(['wish', 'user', 'owner'])
    ->get();

echo "Raw cart query result:\n";
echo "Found carts: " . $carts->count() . "\n\n";

if ($carts->count() > 0) {
    foreach($carts as $cart) {
        echo "Cart {$cart->id}: {$cart->wish->wishname} by {$cart->owner->name}\n";
        echo "  Status: {$cart->status}\n";
        echo "  Country: {$cart->country}\n";
        echo "  Device ID: " . substr($cart->device_id, 0, 30) . "...\n";
        echo "  Owner ID: {$cart->owner_id}\n\n";
    }
    
    // Test the controller method
    echo "Testing controller method anonymousCartItems...\n";
    $controller = new \App\Http\Controllers\Auth\WishitemController();
    
    // Create a mock request
    $request = \Illuminate\Http\Request::create("/anonymous-cart/{$deviceId}", 'GET');
    $request->route()->setParameter('deviceId', $deviceId);
    
    try {
        $response = $controller->anonymousCartItems($request, $deviceId);
        $responseData = $response->getData(true);
        
        echo "Controller response success: " . ($responseData['success'] ? 'true' : 'false') . "\n";
        echo "Controller response carts count: " . (isset($responseData['carts']) ? count($responseData['carts']) : 0) . "\n";
        
        if (isset($responseData['carts']) && count($responseData['carts']) > 0) {
            echo "Cart structure:\n";
            foreach($responseData['carts'] as $index => $cartGroup) {
                echo "  Group {$index}: User {$cartGroup['user']['name']} with " . count($cartGroup['items'] ?? []) . " items\n";
            }
        }
        
    } catch (\Exception $e) {
        echo "Error testing controller: " . $e->getMessage() . "\n";
    }
    
} else {
    echo "No active cart items found for this device ID\n";
}

echo "\nDone.\n";
