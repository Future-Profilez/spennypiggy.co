/**
 * Discovery — the marketing copy, transcribed from the client brief.
 *
 * 🚨 THIS COPY IS FINAL AND IS BUILT WORD FOR WORD. Source: "Spenny Piggy ·
 * Developer Master Plan", issued by Jack 19 Aug 2026, section A1 (page 3) —
 * `docs/client/19 Aug/`. The brief's own instruction is "The copy below is
 * final — build it word for word." Do not rewrite a line to make it fit a
 * layout; the layout adapts to the copy. Do not retype any of these strings
 * into a component — the same lists are reused by the /creators/discovery ad
 * page (A2), and two surfaces that disagree is the failure this file prevents.
 *
 * ⚠️ EVERY ITEM CARRIES A `key`, NOT ITS OWN LIVE/COMING-SOON LABEL. The label
 * state lives in `config/discovery.php` and arrives as a prop, because the plan
 * (Section F) requires a label flip to be a config change with no deploy. Four
 * flips are already scheduled — analytics, more-creators (Mon 31 Aug), birthday
 * and tips — and a label hardcoded here would need a release for each.
 *
 * ⚠️ Standing prohibition from the plan: nothing may be marked LIVE NOW in
 * marketing that is not live in the product. The evidence backing each 'live'
 * key is recorded in `config/discovery.php`.
 */

/** Section headline — sits directly beneath the hero. */
export const DISCOVERY_HEADLINE = 'More than somewhere to earn.';

/**
 * The tail of the headline that carries the gradient accent, per house style.
 *
 * ⚠️ It is stored as a SUBSTRING of the headline rather than as a second copy of
 * those words, and the component splits on it at render. Two independent strings
 * would drift the moment either was edited, and the earlier draft solved the
 * same problem with a visually-split heading plus an `sr-only` copy of the full
 * line — which made a screen reader announce the headline twice.
 */
export const DISCOVERY_HEADLINE_ACCENT = 'to earn.';

export const DISCOVERY_LEAD =
    "Spenny Piggy doesn't just give you more ways to monetise your audience. We help people discover you, promote you at the moments that matter and give supporters reasons to come back.";

/**
 * The three blocks, in the brief's order.
 *
 * `items` are keyed to `config/discovery.php`'s label map; the component reads
 * the state from there and sorts each block into its LIVE NOW and COMING SOON
 * columns. A key with no entry in the map is treated as coming soon — the safe
 * direction to fail, since the expensive mistake is claiming something is live.
 */
export const DISCOVERY_BLOCKS = [
    {
        id: 'get-discovered',
        title: 'Get Discovered',
        body: 'Your public Spenny Piggy profile can be surfaced across Discover and other promotional areas, giving people opportunities to find you beyond the audience you bring yourself.',
        footer: "Bring your audience. We'll help you reach more people.",
        items: [
            { key: 'public_discovery', label: 'Public creator Discovery' },
            { key: 'creator_search', label: 'Searchable creator profiles' },
            { key: 'public_wishes', label: 'Public wishes and creator opportunities' },
            { key: 'promo_placements', label: 'Existing promotional placements' },
            { key: 'similar_creators', label: 'Similar Creator recommendations' },
            { key: 'more_creators', label: 'More Creators to Support on creator profiles' },
            { key: 'new_creator_collections', label: 'New Creator collections' },
            { key: 'hidden_gems', label: 'Hidden Gems' },
            { key: 'trending', label: 'Trending creators' },
            { key: 'almost_funded', label: 'Almost Funded' },
            { key: 'new_wishes', label: 'New Wishes' },
            { key: 'personalised', label: 'Personalised recommendations' },
        ],
    },
    {
        id: 'well-promote-you',
        title: "We'll Promote You",
        body: 'Spenny Piggy creates additional moments for supporters to find and support creators.',
        footer: 'Your birthday becomes another opportunity to get discovered.',
        items: [
            {
                key: 'sitewide_promotion',
                label: 'Existing site-wide creator promotion and Discovery placements',
            },
            { key: 'birthday', label: 'Supporter birthday reminder 7 days before' },
            { key: 'birthday', label: 'Supporter birthday reminder 1 day before' },
            { key: 'birthday', label: 'Reminder on your birthday' },
            { key: 'birthday', label: 'Weekly Birthdays This Week email' },
            { key: 'birthday', label: 'Sent to both creators and supporters' },
            { key: 'birthday', label: 'Up to 10 creators featured each week' },
            { key: 'birthday', label: 'Full Birthdays This Week Discover collection' },
            {
                key: 'campaigns',
                label: 'Creator Spotlights, New Creator promotions and seasonal campaigns',
            },
        ],
    },
    {
        id: 'bring-supporters-back',
        title: 'Bring Supporters Back',
        body: 'Getting discovered is only the beginning. Spenny Piggy gives creators tools designed to keep supporters engaged and give them reasons to return.',
        footer: 'Discover. Support. Return.',
        items: [
            { key: 'supporter_emails', label: 'Automated supporter emails and reminders' },
            { key: 'supporter_reminders', label: 'Supporter reminder functionality' },
            { key: 'creator_push', label: 'Creator push notifications where enabled' },
            { key: 'deeper_reminders', label: 'Deeper personalised supporter reminders' },
            { key: 'reengagement', label: 'Discovery-linked re-engagement' },
            { key: 'content_recommendations', label: 'New content recommendations' },
            { key: 'new_wish_reminders', label: 'New wish reminders' },
            { key: 'activity_notifications', label: 'More personalised creator activity notifications' },
        ],
    },
];

/**
 * The three-number proof point.
 *
 * ⚠️ The labels are the CREATOR-FACING second person, because this is the real
 * dashboard component standing in front of a visitor — that is the whole point
 * of the panel. The brief's landing-page wording and its ad-page wording differ
 * slightly on the third line ("of your earnings came from supporters we
 * introduced to you" vs "earned from supporters who discovered you through
 * Spenny Piggy"); the landing-page wording is used here and the ad page passes
 * its own via the `lines` prop.
 */
export const DISCOVERY_PROOF_LINES = [
    'people discovered your profile through Spenny Piggy this month',
    'became new supporters',
    'of your earnings came from supporters we introduced to you',
];

/** Shown while `discovery.analytics_live` is false. Never render the figures without it. */
/**
 * Discovery Phase 2 — the creator dashboard panel's three lines.
 *
 * 🚨 THE BRIEF WRITES THESE OUT VERBATIM and they are NOT the landing page's
 * wording. `DISCOVERY_PROOF_LINES[2]` is "of your earnings came from supporters
 * we introduced to you", which is a marketing framing; the dashboard's third
 * line is the money the creator actually earned, phrased as the plan phrases
 * it. The first two lines are the same on both surfaces, so they are reused
 * rather than retyped — retyping is how the two come to disagree.
 */
export const DISCOVERY_DASHBOARD_LINES = [
    DISCOVERY_PROOF_LINES[0],
    DISCOVERY_PROOF_LINES[1],
    'earned from supporters who discovered you through Spenny Piggy',
];

export const DISCOVERY_DASHBOARD_TITLE = 'Discovery this month';

export const DISCOVERY_ANALYTICS_PENDING_LABEL = 'Discovery analytics — coming soon';

/**
 * Zero state. A creator with no Discovery data yet sees the panel at 0 rather
 * than not seeing the panel — the plan is explicit that this is the pitch, so
 * the module never hides itself.
 */
export const DISCOVERY_ZERO_STATE_LINE =
    'Discovery is live and growing. These numbers start counting as supporters find you.';

export const DISCOVERY_CTA = {
    primary: { label: 'Start your profile', href: '/register' },
    secondary: { label: 'Explore Discovery', href: '/discover' },
};

/** The two column headings. Capitalised exactly as the brief prints them. */
export const DISCOVERY_LABEL_TEXT = {
    live: 'LIVE NOW',
    coming_soon: 'COMING SOON',
};

/* ==========================================================================
   A2 — /creators/discovery ad landing page
   ==========================================================================

   🚨 TEN SECTIONS, IN THIS ORDER. The brief numbers them and says "every
   section below, in this order"; the order is the argument, so do not reorder
   them to balance the page.

   🚨 FOUR PHRASES MUST SURVIVE ON THIS PAGE VERBATIM — the brief lists them
   under "Keep intact on this page". Two of them appear in no section's copy
   (`KEEP_INTACT[0]` and `[3]`), so they are placed deliberately: the first as
   the bridge into section 2, the fourth as the lead of section 6, which is the
   section it describes. `[1]` is nearly — but not exactly — section 10's own
   headline ("Bring your audience. Let Spenny Piggy help you grow it."), so the
   exact phrase is carried as section 10's closing line rather than assumed to
   be covered. `DiscoveryMarketingTest` asserts all four render.

   ⚠️ Prohibitions on this page: no competitor names, no payment-provider names,
   no creator's earnings.
*/

/** Asserted by the test suite. Every one of these must appear on /creators/discovery. */
export const DISCOVERY_AD_KEEP_INTACT = [
    'More than somewhere to earn.',
    "Bring your audience. We'll help you grow it.",
    'Get discovered. Stay visible. Bring supporters back.',
    "We don't just offer exposure. We show you what that exposure is worth.",
];

export const DISCOVERY_AD_HERO = {
    eyebrow: 'Discovery',
    heading: "Don't just bring your audience. Grow it.",
    body: 'Spenny Piggy gives you somewhere to monetise your supporters while creating more opportunities for new people to discover you.',
    strapline: 'Get discovered. Stay visible. Bring supporters back.',
    cta: 'Create your profile',
};

/** Section 2 — the competitive argument. */
export const DISCOVERY_AD_STOP_AT_LINK = {
    heading: 'Most platforms stop at the link',
    body: "On most platforms you build a page, share a link and bring your own audience. That's where it ends. Spenny Piggy is built differently: you benefit from the audience you bring and from the wider Spenny Piggy community — supporters already on the platform looking for someone new to support.",
};

/** Section 3 — reuses Block 1's capability list from the landing page. */
export const DISCOVERY_AD_PUBLIC = {
    heading: 'Public Discovery',
    body: 'Your profile and your opportunities can be explored publicly on Discover — not hidden behind your own link.',
};

/**
 * Section 4 — the four recommendation slots.
 *
 * ⚠️ Labelled COMING SOON and flips to LIVE NOW on Mon 31 Aug when Discovery
 * Phase 3 ships. The flip is the `more_creators` key in `config/discovery.php`;
 * this page reads it rather than carrying its own label.
 */
export const DISCOVERY_AD_EVERYWHERE = {
    heading: 'Discovery everywhere',
    body: "When a supporter visits one creator, Spenny Piggy can recommend others — a similar creator, an emerging creator, a popular creator and a rotating Discovery pick — at the bottom of every profile. Support doesn't have to stop with one profile.",
    slots: [
        { slot: 'Similar', line: 'Creators who make what they already support.' },
        { slot: 'Emerging', line: 'Someone newer, who has not had their turn yet.' },
        { slot: 'Popular', line: 'A creator other supporters are backing right now.' },
        { slot: 'Discovery Pick', line: 'A rotating choice, so the row is never the same twice.' },
    ],
};

/** Section 5 — birthday promotion. The brief asks for this one to be highly visual. */
export const DISCOVERY_AD_BIRTHDAY = {
    heading: 'Birthday promotion',
    body: 'Add your birthday and opt in. Your supporters are reminded 7 days before, 1 day before and on the day.',
    timeline: [
        { when: '7 days before', what: 'Your supporters get the first reminder.' },
        { when: '1 day before', what: 'A second reminder, while there is still time.' },
        { when: 'On the day', what: 'The reminder lands on the day itself.' },
    ],
    weekly: 'Every Monday, Spenny Piggy sends a Birthdays This Week email to supporters and creators, featuring up to 10 creators, with the full birthday collection on Discover.',
    privacy: 'Your birth year is never shown.',
    close: 'Another reason to be seen. Another reason to be supported.',
};

/**
 * Section 6 — the most prominent section on the page.
 *
 * ⚠️ The three lines differ from the landing page's wording; the brief prints
 * both, so each surface passes its own into `DiscoveryStatsPanel`.
 */
export const DISCOVERY_AD_WORTH = {
    heading: 'We show you what Discovery is worth',
    lead: DISCOVERY_AD_KEEP_INTACT[3],
    lines: [
        'people introduced to your profile',
        'became new supporters',
        'earned from supporters who discovered you through Spenny Piggy',
    ],
    note: 'Exposure is useful. Knowing exactly what it generated is better.',
};

/** Section 7 — the returning-supporter loop. Lists are the brief's, not Block 3's. */
export const DISCOVERY_AD_BRING_BACK = {
    heading: 'Bring them back',
    body: 'Getting a supporter once matters; giving them reasons to come back is what makes the relationship valuable.',
    loop: ['Discover', 'Visit', 'Support', 'Return'],
    items: [
        { key: 'supporter_emails', label: 'Automated supporter emails' },
        { key: 'supporter_reminders', label: 'Supporter reminders' },
        { key: 'creator_push', label: 'Creator push notifications where enabled' },
        { key: 'deeper_reminders', label: 'Personalised reminders' },
        { key: 'content_recommendations', label: 'New-content and new-wish notifications' },
        { key: 'reengagement', label: 'Discovery-linked re-engagement' },
        { key: 'activity_notifications', label: 'Creator-controlled push with your own notification settings' },
    ],
};

/** Section 8 — rotation, not repetition. Every collection here is coming soon. */
export const DISCOVERY_AD_NOT_JUST_BIGGEST = {
    heading: "Discovery isn't just for the biggest creators",
    body: 'Discovery is designed to rotate different kinds of creators into view — newer, emerging and established — not to repeat the same biggest profiles everywhere. Collections like New to Spenny Piggy, Hidden Gems, Trending and Almost Funded exist to give more creators a turn.',
    collections: ['New to Spenny Piggy', 'Hidden Gems', 'Trending', 'Almost Funded'],
};

/** Section 9 — creators discover creators. */
export const DISCOVERY_AD_COMMUNITY = {
    heading: 'Creator community',
    body: 'Creators discover creators too. The weekly birthday email and wider promotional campaigns go to creators as well as supporters, so creators find and support each other.',
    close: "You're not just creating a page. You're joining an ecosystem.",
};

/** Section 10 — final conversion. */
export const DISCOVERY_AD_CLOSE = {
    heading: 'Bring your audience. Let Spenny Piggy help you grow it.',
    body: 'Monetise in more ways. Get discovered across the platform. Promote the moments that matter. Bring supporters back. And see how much Spenny Piggy Discovery is contributing to your growth.',
    cta: 'Create your Spenny Piggy profile',
};

/* ==========================================================================
   A3 — /creators/link-in-bio ad landing page
   ==========================================================================

   🚨 EIGHT SECTIONS, IN THIS ORDER.

   🚨 SECTIONS 3 AND 6 ARE LABELLED "LIVE NOW" IN THE BRIEF AND RENDER AS
   COMING SOON HERE, deliberately — see the long note on `bio_direct_sales` in
   `config/discovery.php`. `/{username}/bio` is live but sells nothing: no
   checkout, no price, no payment method. Selling from it is the B stream, due
   Fri 28 Aug, three days after this page goes live. The plan lists "Mark
   anything LIVE NOW in marketing that is not live in the product" under Never,
   and that beats a section label. One config flip corrects both sections the
   day B lands.

   ⚠️ Prohibitions on this page, from the brief: never "instant" / "immediate" /
   "seconds" about Tips, no competitor names, no payment-provider names, no
   creator's earnings. Note the last one bans naming Bridge/Stripe here even
   though the plan names them internally.
*/

export const BIO_AD_HERO = {
    eyebrow: 'Link in Bio',
    heading: 'One link. Sell straight from your bio.',
    body: 'Put your Spenny Piggy link in your Instagram, TikTok or X bio and your supporters can buy from it on the spot — no second page, no hunting for the item, no drop-off.',
    strapline: "Your link shouldn't just list. It should sell.",
    cta: 'Create your link',
};

/**
 * Section 2 — the before/after the brief asks for: 4 taps vs 1 tap.
 *
 * ⚠️ "A normal link-in-bio" — the brief bans competitor names, so the comparison
 * is drawn against a described pattern, never a named product.
 */
export const BIO_AD_PROBLEM = {
    heading: 'The problem with most bio links',
    body: 'A normal link-in-bio sends people to a page of buttons. Then to a profile. Then to an item. Then to a checkout. Every tap loses supporters. Spenny Piggy puts the thing they want to buy on the first page they land on.',
    before: {
        label: 'A normal bio link',
        taps: ['Page of buttons', 'Profile', 'Item', 'Checkout'],
        count: '4 taps',
    },
    after: {
        label: 'Your Spenny Piggy link',
        taps: ['Checkout'],
        count: '1 tap',
    },
};

/** Section 3 — the phone mock-up. `key` gates its label; see the file note. */
export const BIO_AD_EVERYTHING = {
    key: 'bio_direct_sales',
    heading: 'Everything you sell, on one page',
    body: 'Your exclusive content, paid tasks, memberships, content goals and shop items — the ones you choose — shown as cards on your link page. Tap a card, go straight to checkout. Same secure checkout, same weekly payouts, same 100% of your listed price as everywhere else on Spenny Piggy.',
    /** The card labels inside the phone mock. Current feature names, per the plan. */
    cards: [
        'Sell Exclusive Content',
        'Paid Tasks',
        'Memberships',
        'Content Goals',
        'Shop',
    ],
};

/** Section 4 — genuinely live: the page renders no layout and opens in one scroll. */
export const BIO_AD_PHONE = {
    key: 'bio_phone',
    heading: 'Built for the phone',
    body: "Your supporters arrive from Instagram, TikTok and X — in the app, on a phone. The page loads fast, reads in one scroll and pays in one flow. That's the whole point of it.",
};

/**
 * Section 5 — Tips.
 *
 * ⚠️ NO AMOUNT, NO DATE, NO SETTLEMENT SPEED. The brief bans "instant",
 * "immediate" and "seconds" outright, and bans naming the provider. The Tip
 * block is rendered exactly as `Pages/Bio/Show.jsx` draws it today — dashed
 * edge, greyed, outside the solid frames — because the brief asks for the
 * button "greyed out exactly as it appears in the product".
 */
export const BIO_AD_TIPS = {
    key: 'tips',
    heading: 'Tips, coming soon',
    body: 'Soon your supporters will be able to leave a simple tip from your link — nothing to unlock, nothing exchanged, paid in USDC stablecoin straight to you.',
};

/** Section 6 — control. Gated with section 3: today's editor orders links, not items. */
export const BIO_AD_CONTROL = {
    key: 'bio_direct_sales',
    heading: 'You control the page',
    body: 'Choose which items appear, in what order, and what it looks like. Change it any time from your dashboard — no code, no designer.',
};

/** Section 7 — cross-link to the Discovery page, reusing the three-number panel. */
export const BIO_AD_TRAFFIC = {
    heading: 'Your bio link, your traffic — and we count it',
    body: "Sales from your link are yours and always recorded as your own traffic. Alongside that, Spenny Piggy Discovery is working to bring you new supporters you didn't bring yourself — and to show you exactly what that's worth.",
    linkLabel: 'How Discovery works',
};

/** Section 8 — final conversion. */
export const BIO_AD_CLOSE = {
    heading: 'Swap your bio link. Keep 100% of your listed price.',
    body: 'Free to start. Nothing to pay until your first sale. Weekly payouts. One link that sells.',
    cta: 'Create your Spenny Piggy link',
};

/**
 * Words this page may never contain. Asserted by `DiscoveryMarketingTest`.
 *
 * ⚠️ Matched case-insensitively as whole words against the page's own copy —
 * "instantly" and "in seconds" are the phrasings that creep back in when someone
 * rewrites a line to sound more exciting.
 */
export const BIO_AD_BANNED_WORDS = ['instant', 'instantly', 'immediate', 'immediately', 'seconds'];
