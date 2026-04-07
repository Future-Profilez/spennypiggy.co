const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/Http/Controllers/Auth/*.php');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Remove is_subscribed checks returning "paused gift payments"
    const isSubRegex = /if\s*\([^)]*?is_subscribed[^)]*\)\s*\{\s*(?:if\s*\(!empty\(\$debugId\)\)\s*\{\s*Log::info\([^;]*;\s*\}\s*)?return\s+(?:redirect\(\)->back\(\)->with|response\(\)->json)\([^;]*paused gift payments[^;]*;\s*\}/gs;
    content = content.replace(isSubRegex, '');

    // 2. Replace hardcoded Stripe errors for redirect()->back()
    const stripeRedirectRegex = /if\s*\(!StripeControl::hasCardPaymentsCapability\(([^)]+)\)\)\s*\{\s*return\s+(redirect\(\)->back\(\)->with)\([^,]+,\s*(["'])This creator cannot accept payments at the moment.*?(\2)\s*\);\s*\}/gs;
    content = content.replace(stripeRedirectRegex, `if (!StripeControl::hasCardPaymentsCapability($1)) {
            $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
            return $2('error', app(\\App\\Services\\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck));
        }`);

    // 3. Replace hardcoded Stripe errors for response()->json()
    const stripeJsonRegex = /if\s*\(!StripeControl::hasCardPaymentsCapability\(([^)]+)\)\)\s*\{\s*return\s+response\(\)->json\(\[\s*'status'\s*=>\s*false,\s*'msg'\s*=>\s*(["'])This creator cannot accept payments at the moment.*?(\2)\s*\]\);\s*\}/gs;
    content = content.replace(stripeJsonRegex, `if (!StripeControl::hasCardPaymentsCapability($1)) {
            $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
            return response()->json([
                'status' => false,
                'msg' => app(\\App\\Services\\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck)
            ]);
        }`);

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Cleaned', file);
    }
}
