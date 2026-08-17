// First-launch onboarding content.
//
// 🚨 Copy is content-compliant — every slide describes buying creator CONTENT or
// a creator SERVICE. No gift / tip / donation / fundraise / bill wording, and no
// brand names. This is a Stripe-facing surface like any other.
//
// ⚠️ `field` is the percentage of the screen the violet field has climbed to on
// that slide, and it IS the progress indicator — there are no dots. It starts
// where the launch screen leaves it (~70%) and ends covering the screen, so the
// last slide is the colour the app opens on. Keep the values descending.

export const ONBOARDING_SLIDES = [
    {
        key: 'welcome',
        mark: 'piece',
        step: 'Welcome',
        title: ['Buy what', 'creators make'],
        body: 'Content, memberships and custom work — bought from the creator, delivered here.',
        field: 74,
    },
    {
        key: 'pot-wishlist',
        mark: 'pot',
        step: 'Piggy Pot & Wishlist',
        title: ['Unlock a piece', 'or a pot'],
        body: 'Take a single item off a wishlist, or buy into a Piggy Pot and watch its goal fill.',
        field: 54,
    },
    {
        key: 'shop-tasks',
        mark: 'order',
        step: 'Shop & Paid Requests',
        title: ['Order something', 'made for you'],
        body: 'Digital files, physical products, or custom work — with delivery tracked end to end.',
        field: 32,
    },
    {
        key: 'purchases',
        mark: 'purchases',
        step: 'Your purchases',
        title: ["It's all in", 'one place'],
        body: 'Every unlock, receipt and delivery sits in My Purchases, and your supporter level climbs as you go.',
        field: 4,
    },
];
