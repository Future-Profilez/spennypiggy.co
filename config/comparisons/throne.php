<?php

/*
|--------------------------------------------------------------------------
| Spenny Piggy vs Throne
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5.
| Values were read from the sources named below on 24 Aug 2026.
|
| ✅ PUBLISHED 30 Aug 2026, on the client's instruction. Every fee row below
| carries a value read from Throne's own help centre with the date it was read,
| and none is flagged `verify` — which is now enforced rather than trusted:
| `CompetitorSheet::assertValid()` refuses to build a published sheet that still
| has one.
|
| 🚨 COMPETITOR PRICING CHANGES WITHOUT TELLING US, and this page's whole claim
| is that each figure came from their own site on a stated date. `checkedOn` is
| what that claim rests on — re-read the sources and move the dates, or set
| `published` back to false. A stale figure here is worse than no page.
|
| ⚠️ Nothing here may be softened or sharpened. Throne's chargeback wording is
| quoted, not characterised — the spec's rule is "quote their words; add no
| adjective". The strongest phrasing allowed anywhere on the page is
| "Not on their pricing page".
*/

return [
    'published' => true,

    'name' => 'Throne',

    'what' => 'A privacy-first wishlist. Fans buy physical gifts (or send cash gifts) without seeing the creator’s address. Free for creators; gifters pay the fees.',

    'heroSubline' => 'Throne is a wishlist for gifts. Spenny Piggy is a way to get paid for content — with a record behind every payment.',

    'metaTitle' => 'Spenny Piggy vs Throne — keep 100% of your listed price',

    'metaDescription' => 'Every Throne fee line by line, from their own pages, next to ours. What you keep, what the supporter pays, and what happens if a payment is ever questioned.',

    /*
     * The £20 example, computed from Throne's own published rates. OUR side of
     * the same table is never written here — it is read live from
     * config/payments.php at render, so a rate change moves both columns.
     */
    'example' => [
        /*
         * The side-by-side snapshot at the top of the page (client direction,
         * 29 Aug 2026). OUR figures are never written here — they are priced by
         * the live checkout engine at render. Only the competitor's are, and
         * each one is the arithmetic of the sourced fee rows above.
         *
         * 🚨 THE CURRENCY IS THEIRS AND IS LABELLED AS SUCH. Throne prices in
         * USD; we price in the creator's own currency. Setting $23.11 beside
         * £27.45 as if one were larger than the other would be a false
         * comparison — the snapshot compares the SHAPE of each deal (does the
         * creator receive the price they set?), not two currency amounts.
         *
         * ⚠️ `conditions` is not a footnote to be dropped. The creator IS
         * credited $20.00; the $18.00 is what lands after the under-$30
         * withdrawal fee. Showing the lower figure without the condition that
         * produces it would be the kind of selective quoting these pages exist
         * to argue against.
         */
        'currency' => 'USD',
        'listed' => 20,
        'theirs' => [
            'supporter_pays' => '$23.11',
            'creator_receives' => '$20.00',
            'conditions' => 'Credited to Throne Balance. Withdraw that on its own and the under-$30 fee applies, leaving $18.00.',

            /*
             * 🚨 THE SAME TWO FIGURES AS NUMBERS, AND THEY EXIST FOR ONE REASON:
             * a cost DIFFERENCE that needs no exchange rate.
             *
             * Client direction, 29 Aug 2026: "show the difference in cost, and
             * how small it is for the extra benefits we provide." Throne prices
             * in USD and we price in the creator's own currency, so subtracting
             * one total from the other is meaningless — and converting at a live
             * rate puts a figure on the page that moves daily and depends on a
             * third party, on the one page whose whole claim is that every
             * number is sourced and stable.
             *
             * The way out is that BOTH examples pay the creator exactly 20 of
             * their own unit. So the honest comparison is the RATIO — what a
             * supporter pays per 1 the creator keeps — which is currency-free,
             * exact, and directly comparable. `FeeSnapshot` derives it; nothing
             * about the difference is typed here.
             *
             * ⚠️ Their ratio is not perfectly flat across amounts: their
             * processing fee carries a fixed $0.30, which is diluted at a larger
             * sale, so at a £20-equivalent their real ratio would be slightly
             * LOWER than this. The stated difference therefore UNDERSTATES it —
             * erring in THEIR favour, which is the only safe direction for this
             * page.
             */
            'supporter_pays_amount' => 23.11,
            'creator_receives_amount' => 20.00,
        ],

        'note' => 'A $20 Cash Gift. Subtotal shown to the fan $21.95 (9.75% service fee included). Processing at checkout 3.9% + $0.30 = $1.16. Gifter pays $23.11 (+1% if not in USD). Creator’s Balance is credited $20.00. Withdraw that on its own and the under-$30 fee applies: $18.00 lands.',
    ],

    'fees' => [
        [
            'label' => 'Service fee (their name for the platform fee)',
            'value' => 'Depends on item type, included in the subtotal the fan sees: Partner Store products 0% · physical gifts shipped by Throne 7% · Cash Gifts, Direct Credit and Payout items 9.75% · crowdfunded payout items 9.75% once on the full goal.',
            'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout',
            'checkedOn' => '2026-08-24',
        ],
        [
            'label' => 'Payment processing',
            'value' => 'Added at checkout on top: physical / non-payout items 2.9% + $0.30 · payout and Direct Credit items 3.9% + $0.30 · payments not in USD add 1% currency conversion.',
            'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout',
            'checkedOn' => '2026-08-24',
        ],
        [
            'label' => 'Who pays at checkout',
            'value' => 'The gifter. Throne: “All checkout fees are paid by the gifter, never the creator.”',
            'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout',
            'checkedOn' => '2026-08-24',
        ],
        [
            /*
             * ⚠️ Tagged notOnPricingPage because it is documented in the help
             * centre and not on the marketing site — which is a fact about
             * where it is published, not an accusation.
             */
            'label' => 'Creator-side fees',
            'value' => '$2 on withdrawals under $30 · Instant Payout $1.99 under $100 or 1.9% at $100+ (if not fan-funded) · cancelling a crowdfund before it is funded: the 9.75% is deducted from the raised funds.',
            'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout',
            'checkedOn' => '2026-08-24',
            'notOnPricingPage' => true,
        ],
        [
            'label' => 'Currency conversion',
            'value' => '+1% at checkout for non-USD payments (gifter side). Creator-side conversion on withdrawal not stated.',
            'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout',
            'checkedOn' => '2026-08-24',
        ],
        [
            'label' => 'Monthly subscription',
            'value' => 'None. “No premium tiers.”',
            'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout',
            'checkedOn' => '2026-08-24',
        ],
        [
            'label' => 'Payout schedule',
            'value' => 'Withdraw from Throne Balance on demand; timing to bank not stated. Instant Payout at a fee.',
            'sourceUrl' => 'https://help.throne.com/en/articles/throne-balance',
            'checkedOn' => '2026-08-24',
        ],
        [
            /*
             * 🚨 QUOTED, NOT CHARACTERISED. The last sentence is the argument
             * this whole page makes, and it is a fact about the product rather
             * than a claim about the company: Throne submits evidence of the
             * purchased product, and a cash gift has no product.
             */
            'label' => 'What happens on a chargeback',
            'value' => 'Throne: a chargeback “can freeze the creator’s funds”; a temporary adjustment may be made to the creator’s account; if the chargeback is fraud, the funds are removed from the creator’s Throne Balance. Throne submits “evidence of the purchased product” — for a cash gift there is no product.',
            'sourceUrl' => 'https://help.throne.com/en/articles/what-happens-with-chargebacks',
            'checkedOn' => '2026-08-24',
        ],
    ],

    /*
     * Their cell for each of the 21 fixed rows. A row left out here renders
     * "Not stated" — never blank, never guessed.
     */
    'matrix' => [
        'exclusive_content' => ['value' => 'no'],
        'content_goals' => ['value' => 'no'],
        'piggy_bank' => ['value' => 'no'],
        'paid_requests' => ['value' => 'no'],
        'shop' => ['value' => 'no'],
        'recurring_content' => ['value' => 'no'],
        'memberships' => ['value' => 'no'],
        'bio_link' => ['value' => 'no'],
        'public_discovery' => ['value' => 'yes', 'sourceUrl' => 'https://throne.com/discover'],
        'keep_listed_price' => ['value' => 'yes', 'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout'],
        'supporter_pays_fees' => ['value' => 'yes', 'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout'],
        'free_until_first_sale' => ['value' => 'yes', 'sourceUrl' => 'https://help.throne.com/en/articles/what-fees-are-paid-at-checkout'],
        'weekly_payouts' => ['value' => 'not_stated'],
        'delivery_record' => ['value' => 'not_stated'],
        'dispute_evidence' => ['value' => 'not_stated'],
        'live_chat' => ['value' => 'not_stated'],
        'permits_adult' => ['value' => 'not_stated'],
        'pay_by_bank' => ['value' => 'not_stated'],
        'stablecoin_tips' => ['value' => 'no'],
        'custom_pricing' => ['value' => 'not_stated'],
        'creator_bonuses' => ['value' => 'no'],
    ],

    /*
     * 🚨 MANDATORY, MINIMUM TWO, AND GENUINE. `CompetitorSheet` refuses to
     * build the page without them. The spec's intro to this block is "We would
     * rather you chose with the whole picture."
     */
    'betterAt' => [
        'Two-way anonymity by default — a gifter never sees your address, and you never see theirs.',
        'Physical gifts shipped for you. Spenny Piggy does not ship parcels, so if that is what you want, keep a wishlist for it.',
        'Free to list with no monthly cost at any volume.',
    ],

    'switchSteps' => [
        'Create your Spenny Piggy profile — free, and nothing to pay until your first sale.',
        'Turn what you listed as wishes into Content Goals, Piggy Bank and Paid Requests — the same amounts, with content behind them.',
        'Put your Spenny Piggy link where your wishlist link was. Keep the wishlist for parcels if you still want one.',
    ],
];
