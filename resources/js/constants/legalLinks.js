/**
 * Where the externally-hosted legal policies actually live.
 *
 * 🚨 THE PRIVACY AND COOKIES POLICIES ARE NOT PAGES ON THIS SITE. They are
 * hosted on Termly (which also serves the cookie-consent banner — see the
 * `app.termly.io/embed.min.js` tag in `app.blade.php`), so there is no Ziggy
 * route for them and `route('privacy-policy')` does not and will not exist.
 *
 * That is exactly how five links came to be wrong: with no route to reach for,
 * each call site substituted whatever route was nearest. They were LABELLED
 * "Privacy Policy" and "Cookies Policy" and pointed at the Terms page — and, in
 * Account Settings, at the Promotions page. The worst was `CheckoutLegalTerms`,
 * where a supporter ticks "I agree to the Terms of Service and Privacy Policy"
 * before paying and both links went to the same page, so the policy they were
 * agreeing to was unreachable from the screen asking them to agree to it.
 *
 * ⚠️ Import from here. Never hardcode a Termly URL at a call site again, and
 * never point a policy link at a route just because one is to hand — if the
 * policy moves, this file is the only edit.
 */

/** The Privacy Policy. Also the account behind the "Request your data" form. */
export const PRIVACY_POLICY_URL =
    "https://app.termly.io/policy-viewer/policy.html?policyUUID=88583b44-9385-430c-aa79-3c41dc8a167e";

export const COOKIES_POLICY_URL =
    "https://app.termly.io/policy-viewer/policy.html?policyUUID=f11eb44f-4ddd-4d59-86d1-34c11e3fa80e";

export const DISCLAIMER_URL =
    "https://app.termly.io/policy-viewer/policy.html?policyUUID=364c168c-44ab-467e-a98a-a22629fc31f8";

/** Termly's own data-subject request form, linked from the footer. */
export const DATA_REQUEST_URL =
    "https://app.termly.io/notify/88583b44-9385-430c-aa79-3c41dc8a167e";

/**
 * Props every external policy link needs, so a new tab cannot reach back into
 * this one via `window.opener`.
 */
export const EXTERNAL_LINK_PROPS = {
    target: "_blank",
    rel: "noopener noreferrer",
};
