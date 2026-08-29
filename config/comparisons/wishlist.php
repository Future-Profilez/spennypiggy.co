<?php

/*
|--------------------------------------------------------------------------
| Spenny Piggy vs a wishlist  (generic — no brand named)
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5b.
|
| 🚨 NO BRAND IS NAMED ANYWHERE ON THIS PAGE. The competitor column is a
| CATEGORY, so its values need no sources — there is no company to cite and
| nothing to check against a live page. That is also why it publishes without
| Jack clearing "verify" rows: there are none.
|
| This is the page for the "creator wishlist" and "wishlist for creators"
| keywords. It makes the bank / tax / chargeback point plainly, without naming
| anyone — and where a wishlist is genuinely better it says so.
*/

return [
    'published' => true,
    'layout' => 'generic',

    'name' => 'a wishlist',

    'what' => 'A list of things fans can buy for you, or send you the cash for.',

    'heroSubline' => 'A wishlist gets you gifts. Spenny Piggy gets you paid — with a record behind every payment.',

    'metaTitle' => 'Spenny Piggy vs a wishlist — get paid, with a record behind it',

    'metaDescription' => 'A wishlist gets you gifts. Spenny Piggy gets you paid for content, with a delivery record on every payment, weekly payouts and 100% of your listed price.',

    /*
     * The comparison table. Rows are the spec's, in the spec's order.
     * ⚠️ Every "theirs" value describes the CATEGORY and is deliberately
     * hedged where the category varies ("usually", "typically") — a flat claim
     * about every wishlist on the internet is one we cannot stand behind.
     */
    'rows' => [
        [
            'label' => 'What the supporter buys',
            'ours' => 'Content, a delivered request, a shop item or a membership',
            'theirs' => 'A gift, or cash with nothing exchanged',
        ],
        [
            'label' => 'Who pays the fees',
            'ours' => 'The supporter, on top, at checkout',
            'theirs' => 'Usually the gifter — typically 9–10% on top (see the named pages)',
        ],
        [
            'label' => 'What you receive',
            'ours' => '100% of your listed price',
            'theirs' => 'The gift, or the cash value less any withdrawal or conversion fees',
        ],
        [
            'label' => 'Delivery record',
            'ours' => 'On every payment',
            'theirs' => 'A shipping record for physical gifts; nothing for cash gifts',
        ],
        [
            'label' => 'What a bank sees',
            'ours' => 'A sale from a registered business',
            'theirs' => 'Unexplained money from a stranger',
        ],
        [
            'label' => 'What a card issuer sees in a dispute',
            'ours' => 'Delivery evidence',
            'theirs' => 'Nothing to defend on a cash gift',
        ],
        [
            'label' => 'Public discovery',
            'ours' => 'Discover page',
            'theirs' => 'Only people who already have your link',
        ],
        [
            'label' => 'Support when money is on the line',
            'ours' => 'Real people on live chat',
            'theirs' => 'Email or a form',
        ],
        [
            'label' => 'Monthly cost',
            'ours' => '£0 until your first sale, then £8.99 + VAT',
            'theirs' => 'Usually £0',
        ],
    ],

    /*
     * 🚨 Mandatory, and on this page it is the honest heart of it: a wishlist
     * does something Spenny Piggy does not do at all.
     */
    'betterAt' => [
        'Physical gifts shipped without sharing your address. Spenny Piggy does not ship parcels — if that is what you want, keep a wishlist for it.',
        'Nothing to set up and nothing to publish. A list of links is quicker than a product.',
    ],

    'switchSteps' => [
        'Create your Spenny Piggy profile — free, and nothing to pay until your first sale.',
        'Turn what you listed as wishes into Content Goals, Piggy Bank and Paid Requests — the same amounts, with content behind them.',
        'Keep the wishlist for parcels if you want one, and use Spenny Piggy for the money that has to be bank-legible.',
    ],
];
