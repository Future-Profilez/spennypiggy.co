<?php

$files = glob('app/Http/Controllers/Auth/*.php');

foreach ($files as $file) {
    $original = file_get_contents($file);
    $content = $original;

    // 1. Remove is_subscribed checks returning "paused gift payments"
    $isSubRegex = '/if\s*\([^)]*?is_subscribed[^)]*\)\s*\{\s*(?:if\s*\(!empty\(\$debugId\)\)\s*\{\s*Log::info\([^;]*;\s*\}\s*)?return\s+(?:redirect\(\)->back\(\)->with|response\(\)->json)\([^;]*paused gift payments[^;]*;\s*\}/s';
    $content = preg_replace($isSubRegex, '', $content);

    // 2. Replace hardcoded Stripe errors for redirect()->back()
    $stripeRedirectRegex = '/if\s*\(!StripeControl::hasCardPaymentsCapability\(([^)]+)\)\)\s*\{\s*return\s+(redirect\(\)->back\(\)->with)\([^,]+,\s*(["\'])This creator cannot accept payments at the moment.*?(\2)\s*\);\s*\}/s';
    $replacement2 = "if (!StripeControl::hasCardPaymentsCapability($1)) {
            \$stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
            return $2('error', app(\\App\\Services\\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, \$stripeCheck));
        }";
    $content = preg_replace($stripeRedirectRegex, $replacement2, $content);

    // 3. Replace hardcoded Stripe errors for response()->json()
    $stripeJsonRegex = '/if\s*\(!StripeControl::hasCardPaymentsCapability\(([^)]+)\)\)\s*\{\s*return\s+response\(\)->json\(\[\s*\'status\'\s*=>\s*false,\s*\'msg\'\s*=>\s*(["\'])This creator cannot accept payments at the moment.*?(\2)\s*\]\);\s*\}/s';
    $replacement3 = "if (!StripeControl::hasCardPaymentsCapability($1)) {
            \$stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
            return response()->json([
                'status' => false,
                'msg' => app(\\App\\Services\\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, \$stripeCheck)
            ]);
        }";
    $content = preg_replace($stripeJsonRegex, $replacement3, $content);

    if ($content !== $original) {
        file_put_contents($file, $content);
        echo "Cleaned $file\n";
    }
}
