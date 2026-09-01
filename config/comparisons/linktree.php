<?php

/*
|--------------------------------------------------------------------------
| Spenny Piggy vs Linktree
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5.
|
| ✅ PUBLISHED 31 Aug 2026. All five fee rows were cleared against Linktree's own
| pages, read in a browser — their help centre is JavaScript-rendered, so a plain
| fetch returns nothing and the earlier "verify" placeholders were a symptom of
| that, not of the data being unavailable.
|
| Sources, both Linktree's own: linktr.ee/s/pricing for the tiers, and their
| fees article (dated by them 22 October 2025) for every rate.
|
| ⚠️ NO PRICE IS QUOTED, DELIBERATELY. Their pricing page renders in the reader's
| local currency and states that pricing varies by region — browsing from India
| it showed Rs.220/Rs.440/Rs.1,250. Any single figure we printed would be wrong
| for most readers, so the sheet names the tiers and says exactly that.
|
| 🚨 THE FEES CHANGE. Every row carries `checkedOn`; re-read the fees article and
| move the dates, or set `published` back to false. A stale rate on a page whose
| whole claim is accuracy is the worst thing this build can ship.
*/

return [
    'published' => true,

    'name' => 'Linktree',

    'what' => 'A link-in-bio page. One URL holding a list of buttons that send people somewhere else. Free tier plus paid plans; some commerce features on the higher tiers.',

    'heroSubline' => 'Linktree lists where to find you. Spenny Piggy lets them buy from you on the page they land on.',

    'metaTitle' => 'Spenny Piggy vs Linktree — sell from your link, keep 100%',

    'metaDescription' => 'Every Linktree plan fee line by line, from their own pages, next to ours. What you keep, what the supporter pays, and what happens if a payment is ever questioned.',

    /*
     * The $20 example, computed from Linktree's OWN published rates and shown
     * against their own worked sum ($34.99 course: Linktree $3.15, Stripe $1.31,
     * creator receives $30.53 on Starter or Pro).
     *
     * 🚨 THE STARTER/PRO RATE IS THE ONE QUOTED, AND THE SHEET SAYS SO. Their
     * fee is 12% on Free, 9% on Starter and Pro, 0% on Premium — quoting only
     * the 9% would be unfair to a Premium creator and quoting only the 0% would
     * hide the subscription that buys it. The mid tier is the honest single
     * figure and `conditions` carries both ends.
     *
     * 🚨 THE BUYER PAYS THE LISTED PRICE HERE AND THE CREATOR ABSORBS THE FEES —
     * the inverse of this platform. That is why the "You receive" row is the one
     * that matters on this page: we pay the creator the price they set, and this
     * comparison shows what they are actually left with instead.
     */
    'example' => [
        'currency' => 'USD',
        'listed' => 20,
        'theirs' => [
            'supporter_pays' => '$20.00',
            'creator_receives' => '$17.32',
            'conditions' => 'On Starter or Pro. Free is 12% and leaves $16.92; Premium is 0% and leaves $19.12, on top of the Premium subscription. Stripe’s 2.9% + $0.30 applies on every plan.',

            // Their rates applied to a $20 sale: 9% = $1.80, Stripe 2.9% + $0.30
            // = $0.88, so the creator is left with $17.32 of a $20 sale.
            'supporter_pays_amount' => 20.00,
            'creator_receives_amount' => 17.32,
        ],

        'note' => 'A $20 digital product on Starter or Pro. The buyer pays the $20 you listed. Linktree takes 9% ($1.80) and Stripe takes 2.9% + $0.30 ($0.88), both deducted before your payout — so $17.32 reaches you. Their own worked example says the same: a $34.99 course pays out $30.53. Premium removes Linktree’s 9% but costs a monthly subscription, and Stripe’s fee applies on every plan.',
    ],

    'fees' => [
        [
            /*
             * ✅ CLEARED 31 Aug 2026 — read from linktr.ee/s/pricing itself.
             *
             * 🚨 THE ABSENCE OF A PRICE IS THE SOURCED FACT HERE, NOT A GAP.
             * Their pricing page names four tiers and shows no figure: it states
             * that pricing varies by region and renders in local currency. So
             * "there is no single figure to quote" is what their own page says,
             * and quoting one — even a real one seen from the UK — would put a
             * number on our page that is wrong for most of its readers.
             */
            'label' => 'Monthly subscription',
            'value' => 'A free tier plus three paid plans — Starter, Pro and Premium. Linktree shows prices in local currency and says they vary by region, so there is no single figure to quote.',
            'sourceUrl' => 'https://linktr.ee/s/pricing/',
            'checkedOn' => '2026-08-31',
        ],
        [
            // ✅ CLEARED 31 Aug 2026 — Linktree's own fees article, dated by them
            // 22 October 2025. Their table, verbatim.
            'label' => 'Commission on sales',
            'value' => 'Digital Products and Courses: Free 12% · Starter 9% · Pro 9% · Premium 0%. Shops and Sponsored Links (US only): a percentage of the commission earned on Free, Starter and Pro; no Linktree commission on Premium.',
            'sourceUrl' => 'https://linktr.ee/help/en/articles/11410206-understanding-transaction-and-processing-fees-on-linktree',
            'checkedOn' => '2026-08-31',
        ],
        [
            'label' => 'Payment processing',
            'value' => 'Stripe, on every plan including Premium: 2.9% + $0.30 per purchase on Digital Products and Courses, and $0.25 per payout on Shops. Linktree: “Processing fees are charged regardless of your Linktree plan.”',
            'sourceUrl' => 'https://linktr.ee/help/en/articles/11410206-understanding-transaction-and-processing-fees-on-linktree',
            'checkedOn' => '2026-08-31',
        ],
        [
            /*
             * 🚨 THE LOAD-BEARING ROW ON THIS SHEET, AND IT IS THEIR OWN
             * SENTENCE. Both fees come out of the creator's money, so the
             * creator does NOT receive the price they set — which is the exact
             * inverse of this platform and of Throne, where the supporter covers
             * the fee. Quoted, not characterised.
             */
            'label' => 'Who pays at checkout',
            'value' => 'The creator. Linktree: “These fees are automatically calculated and deducted before any payouts are sent to you” and “Both fees are automatically deducted before your payout is sent.” The buyer pays the listed price; the creator receives it less both fees.',
            'sourceUrl' => 'https://linktr.ee/help/en/articles/11410206-understanding-transaction-and-processing-fees-on-linktree',
            'checkedOn' => '2026-08-31',
        ],
        [
            'label' => 'What happens on a chargeback',
            /*
             * ⚠️ "Not stated" is the SOURCED answer, not a gap. Their fees
             * article covers transaction and processing fees in full and says
             * nothing about chargebacks; `notOnPricingPage` is the strongest
             * wording the spec permits and it is a fact about where something is
             * published, never an accusation.
             */
            'value' => 'Not stated in their fees documentation, which otherwise sets out transaction and processing fees in full.',
            'sourceUrl' => 'https://linktr.ee/help/en/articles/11410206-understanding-transaction-and-processing-fees-on-linktree',
            'checkedOn' => '2026-08-31',
            'notOnPricingPage' => true,
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
        /*
         * ⚠️ THESE TWO WERE "NOT STATED" AND ARE NOW ANSWERED — from Linktree's
         * own sentence, "Both fees are automatically deducted before your payout
         * is sent." That settles both rows at once: the creator does not receive
         * the price they listed, and the fee does not sit with the buyer.
         * Sourced, as any cell that is not "Not stated" must be.
         */
        'keep_listed_price' => ['value' => 'no', 'sourceUrl' => 'https://linktr.ee/help/en/articles/11410206-understanding-transaction-and-processing-fees-on-linktree'],
        'supporter_pays_fees' => ['value' => 'no', 'sourceUrl' => 'https://linktr.ee/help/en/articles/11410206-understanding-transaction-and-processing-fees-on-linktree'],
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
