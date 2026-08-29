<?php

/*
|--------------------------------------------------------------------------
| Spenny Piggy vs just a link in bio  (generic — no brand named)
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5b.
|
| 🚨 NO BRAND IS NAMED ANYWHERE. The competitor column is the CATEGORY — a page
| of buttons that links out — so its values need no sources.
|
| ⚠️ This is NOT `/creators/link-in-bio`, which is the paid-ads landing page for
| our own bio product. This page argues against the generic category.
*/

return [
    'published' => true,
    'layout' => 'generic',

    'name' => 'just a link in bio',

    'what' => 'A page of buttons that sends people somewhere else.',

    'heroSubline' => 'Your link shouldn’t just list. It should sell.',

    'metaTitle' => 'Spenny Piggy vs a link in bio — sell from the first page they land on',

    'metaDescription' => 'A link page lists. A Spenny Piggy page sells: every item is a card that goes straight to checkout, with a delivery record on every payment and 100% of your listed price.',

    'rows' => [
        [
            'label' => 'Taps from bio to checkout',
            'ours' => '1',
            'theirs' => '4 — page of buttons, profile, item, checkout',
        ],
        [
            'label' => 'Can supporters pay on the page?',
            'ours' => 'Yes, every item is a card that goes straight to checkout',
            'theirs' => 'No — it links out',
        ],
        [
            'label' => 'What you keep',
            'ours' => '100% of your listed price',
            'theirs' => 'Depends on wherever the link goes',
        ],
        [
            'label' => 'Delivery record',
            'ours' => 'On every payment',
            'theirs' => 'None — the link page does not handle payment',
        ],
        [
            'label' => 'Discovery',
            'ours' => 'Public Discover page',
            'theirs' => 'None — only people who already have your link',
        ],
        [
            'label' => 'Support when money is on the line',
            'ours' => 'Real people on live chat',
            'theirs' => 'Help centre',
        ],
        [
            'label' => 'Monthly cost',
            'ours' => '£0 until your first sale, then £8.99 + VAT',
            'theirs' => 'Varies',
        ],
    ],

    'betterAt' => [
        'It links anywhere. A link page can point at a shop, a video, a mailing list and a booking form on four different sites.',
        'Nothing to publish and nothing to price — it is a list of destinations, so there is no product to set up.',
    ],

    'switchSteps' => [
        'Create your Spenny Piggy profile — free, and nothing to pay until your first sale.',
        'Add what you sell. Every item becomes a card a supporter can buy from without leaving the page.',
        'Put your Spenny Piggy link where the link page was, and keep the link page for anything you are not selling.',
    ],
];
