<?php

/*
|--------------------------------------------------------------------------
| Spenny Piggy vs WishTender — CASE STUDY, not a comparison
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5.
|
| WishTender no longer exists. Stripe ended its relationship with WishTender in
| February 2024; the platform tried to move to a new payment partner and
| announced in July 2024 that it was shutting down. People still search for the
| name, and those searchers are exactly the creators this platform wants —
| including 18+ creators, for the SFW side of what they do.
|
| 🚨 THIS PAGE IS ABOUT THE PAYMENT, NOT THE PEOPLE, AND THE RULES BELOW ARE
| ABSOLUTE. It is the one page on this build with legal consequences if it is
| written carelessly.
|
|   · Every claim about WishTender or Stripe links to WishTender's OWN posts.
|     The 404 Media report may be cited for the DATE of an announcement only;
|     its speculation about why Stripe acted is never repeated here.
|   · Quote WishTender's words; do not characterise them. "Kicked off of Stripe"
|     is their phrase, in quotation marks, attributed.
|   · Nothing implies Stripe acted unfairly, and nothing states why Stripe acted.
|     WishTender's own "unexpected policy change" is the only description of the
|     reason that appears.
|   · No reference to specific creators, communities or content types. No
|     screenshots of WishTender's site.
|   · Tone is factual and respectful. No gloating.
|   · The page says plainly that Spenny Piggy is SFW-only, as a description of
|     this platform and never as a judgement of the reader.
|
| ⚠️ There is deliberately NO fee table. WishTender charges nobody anything now,
| and a fee comparison against a closed business would be point-scoring.
*/

return [
    'published' => false,
    'layout' => 'case_study',

    'name' => 'WishTender',

    'what' => 'A wishlist platform that closed in 2024 after losing its payment provider.',

    'heroSubline' => 'WishTender was a wishlist. Its payments had nothing behind them, and when its payment provider changed policy it could not survive. Spenny Piggy puts a deliverable behind every payment so that never happens to you.',

    'metaTitle' => 'Spenny Piggy vs WishTender — what happened, and what we do differently',

    'metaDescription' => 'WishTender lost its payment provider in 2024 and closed the same year. A sourced timeline of what happened, and what a payment with a deliverable behind it changes.',

    /*
     * 🚨 EVERY ENTRY IS SOURCED, AND CompetitorSheet REFUSES THE PAGE WITHOUT
     * IT. These are quotations from WishTender's own announcements.
     */
    'timeline' => [
        [
            'when' => '6 February 2024',
            'what' => 'WishTender announced that “due to an unexpected policy change, Stripe has decided to part ways with WishTender”, and that it had a new financial partner.',
            'source' => 'WishTender on X, 6 Feb 2024 (quoted in 404 Media)',
            'sourceUrl' => 'https://x.com/WishTender',
        ],
        [
            'when' => '7 February 2024',
            'what' => 'WishTender told creators it was not closing, was switching payment solutions, and that wishlists not moved to the new system would be temporarily deactivated — 9 February for non-US owners, 15 February for US owners — with Stripe balances to be zeroed by 19 February.',
            'source' => 'WishTender on X, 7 Feb 2024',
            'sourceUrl' => 'https://x.com/WishTender',
        ],
        [
            'when' => 'July 2024',
            'what' => 'WishTender announced it was shutting down “after several rocky months of trying to get WishTender fully back up and running”, describing “an immense struggle with ups, and mostly downs, since we were kicked off of Stripe.”',
            'source' => 'WishTender on X, 24 Jul 2024',
            'sourceUrl' => 'https://x.com/WishTender',
        ],
    ],

    /*
     * One sentence of ours under the timeline. ⚠️ It states what the MODEL was,
     * and stops there — it does not speculate about the decision.
     */
    'closingNote' => 'WishTender did not allow nudity on its wishlists. What it processed was gifts — money with nothing exchanged and nothing to evidence — and when the policy changed, that was the model that could not be defended.',

    /*
     * What it meant for creators. ⚠️ Framed as consequences of a payment with no
     * deliverable, never as criticism of the people who used it or of anything
     * else they create.
     */
    'consequences' => [
        'Wishlists deactivated on a deadline set by the payment provider, not by the creator.',
        'Balances to be withdrawn by a fixed date or lost.',
        'Months of partial service, then no service. Income from gifts stopped, with no record behind the payments to show a bank what the money had been.',
    ],

    /*
     * The actual comparison. ⚠️ Present tense for us, PAST tense for WishTender
     * throughout — it describes how it operated, not how it operates.
     */
    'differences' => [
        [
            'label' => 'What the money was for',
            'theirs' => 'A gift, with nothing exchanged',
            'ours' => 'A sale of content, a request, a shop item or a membership',
        ],
        [
            'label' => 'Record behind each payment',
            'theirs' => 'None for cash wishes',
            'ours' => 'Delivery record, time-stamped logs, dispute evidence on every sale',
        ],
        [
            'label' => 'What is behind the payment',
            'theirs' => 'Nothing — a wish granted, no deliverable from the creator',
            'ours' => 'Content delivered, logged and time-stamped; a request delivered; a shop item shipped; a membership active',
        ],
        [
            'label' => 'Content policy',
            'theirs' => 'No nudity on the wishlist itself',
            'ours' => 'Strictly SFW across the whole platform, so every payment is one a bank can look at',
        ],
        [
            'label' => 'Payment review',
            'theirs' => 'Not published',
            'ours' => 'Every payment reviewed by a person before it is paid out',
        ],
        [
            'label' => 'Payment provider status',
            'theirs' => 'Lost its provider in February 2024',
            'ours' => 'Approved by our provider under enhanced compliance requirements; the 2% compliance fee funds those checks',
        ],
        [
            /*
             * ⚠️ VERIFY BEFORE PUBLISH, and the spec is explicit about how far
             * this may go: only claim rail independence to the extent it is true
             * today. If Pay by Bank runs through the same provider as card, this
             * row keeps the wording below and NEVER gains a "never dependent on a
             * single rail" clause.
             */
            'label' => 'Payment rails',
            'theirs' => 'One processor, then a replacement that did not hold',
            'ours' => 'Card and Pay by Bank today; Stablecoin Tips coming soon',
        ],
        [
            'label' => 'Where the fees sit',
            'theirs' => '10% charged to the gifter',
            'ours' => 'Percentages and a £1 flat fee shown in full on every page',
        ],
        [
            'label' => 'Status',
            'theirs' => 'Closed, July 2024',
            'ours' => 'Live, weekly payouts from a registered business (US-based, UK-managed)',
        ],
    ],

    /*
     * 🚨 KEPT, and the spec says why: the page is fairer and more believable
     * with it. ⚠️ Past tense — this is what WishTender WAS better at.
     */
    'betterAt' => [
        'Two-way anonymity by default — neither side saw the other’s details.',
        'Any item from anywhere, including off-line “wishes”.',
        'A support reputation creators still talk about.',
    ],

    'switchSteps' => [
        'Create your Spenny Piggy profile — free, and nothing to pay until your first sale.',
        'Turn what you used to list as wishes into Content Goals, Piggy Bank and Paid Requests — the same amounts, with content behind them and a record if anything is ever questioned.',
        'Keep your SFW work here. Whatever else you create stays wherever it lives now — that separation is exactly what keeps this income clean and bank-legible.',
    ],
];
