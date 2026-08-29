<?php

/*
|--------------------------------------------------------------------------
| Spenny Piggy vs Linktree
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5.
|
| 🚨 `published` STAYS FALSE UNTIL JACK HAS CLEARED EVERY ROW AGAINST LINKTREE'S
| LIVE PAGES. The spec flags Linktree as one of the two Wave 1 sheets with
| "verify" rows that must be confirmed on the competitor's own site first —
| their plan names, prices and what each tier includes change without notice.
|
| ⚠️ EVERY FEE ROW HERE IS MARKED `verify`. Nothing on this sheet was read from
| a third-party review; the URLs point at Linktree's own pricing and help pages,
| and the values are what those pages said on 24 Aug 2026. Jack confirms or
| replaces each one — a stale price on a page whose whole claim is accuracy is
| the worst thing this build can ship.
*/

return [
    'published' => false,

    'name' => 'Linktree',

    'what' => 'A link-in-bio page. One URL holding a list of buttons that send people somewhere else. Free tier plus paid plans; some commerce features on the higher tiers.',

    'heroSubline' => 'Linktree lists where to find you. Spenny Piggy lets them buy from you on the page they land on.',

    'metaTitle' => 'Spenny Piggy vs Linktree — sell from your link, keep 100%',

    'metaDescription' => 'Every Linktree plan fee line by line, from their own pages, next to ours. What you keep, what the supporter pays, and what happens if a payment is ever questioned.',

    'example' => [
        /*
         * 🚨 NO FIGURES, AND THAT IS THE HONEST ANSWER FOR THIS COMPETITOR.
         * A link page does not process the sale, so there is no "what a £20
         * payment costs on Linktree" — the money is taken wherever the button
         * points, on that platform's fees, which we cannot know. Inventing a
         * number to fill the table would be exactly the thing these pages
         * promise not to do. The snapshot renders our side and states plainly
         * that theirs depends on the destination.
         */
        'currency' => null,
        'listed' => 20,
        'theirs' => [
            'supporter_pays' => 'Depends on where the button sends them',
            'creator_receives' => 'Whatever that platform pays out, less its fees',
            'conditions' => 'Plus your Linktree subscription, whether or not you sell anything that month.',
        ],

        'note' => 'A link page charges you a subscription and takes nothing per sale, because it does not process the sale — the money is taken wherever the button points, on that platform’s fees. So the honest comparison is not fee against fee: it is one subscription plus somebody else’s fees, against one place where the supporter pays the fee and you keep the price you listed.',
    ],

    'fees' => [
        [
            'label' => 'Monthly subscription',
            'value' => 'Free tier, plus paid plans. Verify the current tier names and prices on their pricing page before publishing.',
            'sourceUrl' => 'https://linktr.ee/s/pricing/',
            'checkedOn' => '2026-08-24',
            'verify' => true,
        ],
        [
            'label' => 'Commission on sales',
            'value' => 'Linktree charges a fee on payments taken through its own commerce features on some plans. Verify the current rate and which plans it applies to.',
            'sourceUrl' => 'https://linktr.ee/s/pricing/',
            'checkedOn' => '2026-08-24',
            'verify' => true,
        ],
        [
            'label' => 'Payment processing',
            'value' => 'Charged by the payment processor behind the feature, on top. Verify whose rates apply and what they are.',
            'sourceUrl' => 'https://linktr.ee/s/pricing/',
            'checkedOn' => '2026-08-24',
            'verify' => true,
        ],
        [
            'label' => 'Who pays at checkout',
            'value' => 'Verify. On a link page the buyer usually pays whatever the destination charges, and the creator pays the subscription.',
            'sourceUrl' => 'https://linktr.ee/s/pricing/',
            'checkedOn' => '2026-08-24',
            'verify' => true,
        ],
        [
            'label' => 'What happens on a chargeback',
            'value' => 'Not stated on their pricing page. A chargeback is handled by whichever platform processed the payment, which on a link page is not the link page.',
            'sourceUrl' => 'https://linktr.ee/s/pricing/',
            'checkedOn' => '2026-08-24',
            'notOnPricingPage' => true,
            'verify' => true,
        ],
    ],

    /*
     * ⚠️ Almost every row here is "Not stated" or ✗ and that is not a slight —
     * a link page is not trying to be a storefront. The 18+ row is left at
     * "Not stated" rather than guessed: it may NEVER read yes without a link to
     * the policy that says so.
     */
    'matrix' => [
        'exclusive_content' => ['value' => 'not_stated'],
        'content_goals' => ['value' => 'no'],
        'piggy_bank' => ['value' => 'no'],
        'paid_requests' => ['value' => 'no'],
        'shop' => ['value' => 'not_stated'],
        'recurring_content' => ['value' => 'no'],
        'memberships' => ['value' => 'no'],
        'bio_link' => ['value' => 'yes', 'sourceUrl' => 'https://linktr.ee/'],
        'public_discovery' => ['value' => 'no'],
        'keep_listed_price' => ['value' => 'not_stated'],
        'supporter_pays_fees' => ['value' => 'not_stated'],
        'free_until_first_sale' => ['value' => 'not_stated'],
        'weekly_payouts' => ['value' => 'not_stated'],
        'delivery_record' => ['value' => 'no'],
        'dispute_evidence' => ['value' => 'no'],
        'live_chat' => ['value' => 'not_stated'],
        'permits_adult' => ['value' => 'not_stated'],
        'pay_by_bank' => ['value' => 'not_stated'],
        'stablecoin_tips' => ['value' => 'no'],
        'custom_pricing' => ['value' => 'not_stated'],
        'creator_bonuses' => ['value' => 'no'],
    ],

    /*
     * 🚨 Mandatory and genuine. Linktree is very good at the thing it is for,
     * and a comparison page that pretends otherwise is not believable.
     */
    'betterAt' => [
        'It links to anything, anywhere. A link page can point at a shop, a video, a mailing list and a booking form on four different platforms at once.',
        'A free tier that takes minutes and asks for no payment details at all.',
        'A very large, very familiar product — most people have used one before and know exactly what they are looking at.',
    ],

    'switchSteps' => [
        'Create your Spenny Piggy profile — free, and nothing to pay until your first sale.',
        'Add what you sell. Each item becomes a card a supporter can buy from without leaving your page.',
        'Put your Spenny Piggy link in your bio, and keep the link page for anything you are not selling.',
    ],
];
