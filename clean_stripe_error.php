<?php

$files = [
    'app/Http/Controllers/Auth/CheckoutController.php',
    'app/Http/Controllers/Auth/BillsController.php',
    'app/Http/Controllers/Auth/MembershipController.php',
    'app/Http/Controllers/Auth/StripeController.php',
    'app/Http/Controllers/Auth/WishitemController.php',
    'app/Http/Controllers/Auth/ShopsController.php',
    'app/Http/Controllers/TaskController.php'
];

foreach ($files as $file) {
    $original = file_get_contents($file);
    $content = $original;

    // Replace redirect()->back()->with('error', "This creator cannot accept payments at the moment...");
    $content = preg_replace(
        '/return\s+(redirect\(\)->back\(\)->with|back\(\)->with)\([^,]+,\s*(["\'])This creator cannot accept payments at the moment.*?(\2)\s*\);/s',
        "\$stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];\n            return $1('error', app(\\App\\Services\\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, \$stripeCheck));",
        $content
    );

    // Replace response()->json(['status' => false, 'msg' => "This creator cannot accept payments at the moment..."]);
    $content = preg_replace(
        '/return\s+response\(\)->json\(\[\s*\'status\'\s*=>\s*false,\s*\'msg\'\s*=>\s*(["\'])This creator cannot accept payments at the moment.*?(\2)\s*\]\);/s',
        "\$stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];\n            return response()->json([\n                'status' => false,\n                'msg' => app(\\App\\Services\\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, \$stripeCheck)\n            ]);",
        $content
    );

    // Replace response()->json(['status' => false, 'message' => "This creator cannot accept payments at the moment..."]);
    $content = preg_replace(
        '/return\s+response\(\)->json\(\[\s*\'status\'\s*=>\s*false,\s*\'message\'\s*=>\s*(["\'])This creator cannot accept payments at the moment.*?(\2)\s*\]\);/s',
        "\$stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];\n            return response()->json([\n                'status' => false,\n                'message' => app(\\App\\Services\\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, \$stripeCheck)\n            ]);",
        $content
    );

    if ($content !== $original) {
        file_put_contents($file, $content);
        echo "Cleaned Stripe capabilities error in $file\n";
    }
}
