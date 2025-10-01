<?php

// Simple test to verify Uploadcare text overlay syntax
$backgroundUuid = '44b15634-1da0-43b0-b64e-23d98acdfd7e';

// Test different text overlay formats to find the correct one
$tests = [
    'Simple text' => [
        'url' => "https://ucarecdn.com/{$backgroundUuid}/-/resize/600x400/-/overlay/text/" . urlencode('Hello World') . "/48/ffffff/center/300,200/",
        'description' => 'Basic text overlay'
    ],
    'With color only' => [
        'url' => "https://ucarecdn.com/{$backgroundUuid}/-/resize/600x400/-/overlay/text/" . urlencode('THANK YOU') . "/72/ff0000/300,150/",
        'description' => 'Red text, positioned'
    ],
    'Multiple overlays' => [
        'url' => "https://ucarecdn.com/{$backgroundUuid}/-/resize/600x400/-/overlay/text/" . urlencode('THANK YOU') . "/72/ffffff/300,100/-/overlay/text/" . urlencode('USD 25.00') . "/48/ffd700/300,200/",
        'description' => 'Multiple text overlays'
    ]
];

echo "🧪 Testing Uploadcare Text Overlay Syntax\n\n";

foreach ($tests as $name => $test) {
    echo "📸 {$name}:\n";
    echo "   {$test['description']}\n";
    echo "   {$test['url']}\n\n";
}

echo "💡 Instructions:\n";
echo "1. Copy any URL above\n";
echo "2. Paste in browser to test if it works\n";
echo "3. Look for the text overlay on the image\n";
echo "4. If successful, we can use this syntax pattern\n\n";

// Check Uploadcare text overlay documentation format
echo "📖 Expected Uploadcare Text Overlay Format:\n";
echo "/-/overlay/text/{text}/{font_size}/{color}/{position}/\n";
echo "Where:\n";
echo "  {text} = URL encoded text\n";  
echo "  {font_size} = Size in pixels (e.g., 48)\n";
echo "  {color} = Hex color without # (e.g., ffffff)\n";
echo "  {position} = x,y coordinates (e.g., 300,200)\n\n";