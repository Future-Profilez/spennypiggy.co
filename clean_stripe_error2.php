<?php

$files = [
    'app/Http/Controllers/Auth/WishitemController.php',
    'app/Http/Controllers/Auth/ShopsController.php',
];

foreach ($files as $file) {
    $original = file_get_contents($file);
    $content = $original;

    $content = preg_replace(
        '/return\s+response\(\)->json\(\[\s*\'status\'\s*=>\s*false,\s*\'message\'\s*=>\s*(["\'])This creator cannot accept payments at the moment.*?(\2)\s*\],\s*422\);/s',
        "\$stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];\n                return response()->json([\n                    'status' => false,\n                    'message' => app(\\App\\Services\\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, \$stripeCheck)\n                ], 422);",
        $content
    );

    if ($content !== $original) {
        file_put_contents($file, $content);
        echo "Cleaned Stripe capabilities error in $file\n";
    }
}
