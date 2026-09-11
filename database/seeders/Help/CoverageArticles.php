<?php

namespace Database\Seeders\Help;

/**
 * The fourth content batch — COVERAGE.
 *
 * 🚨 WHY THIS FILE EXISTS (client direction, 7 Sep 2026): *"website me kuchh
 * aesa terms and programm or feature nahi hona chahiye jo isko na pata ho."*
 * The AI answers ONLY from help articles — `HELP_AI_RETRIEVER=keyword` means
 * `HelpSearch::rankArticles()` picks the articles and the model writes from
 * those and nothing else. So a page, a programme or a legal document with no
 * article is a question the assistant structurally cannot answer, however well
 * the retrieval works. Coverage IS the feature.
 *
 * Audited 7 Sep 2026 against `resources/js/Pages/Legal/*` (13 documents), the
 * public route table and the shipped feature list. This batch closes the
 * thirteen legal documents plus the features that had shipped with no article:
 * the link-in-bio page, Piggy Pot, Piggy Bank, birthday discovery, installing
 * the app, signup codes, automatic sharing, cover images, creator security,
 * review holds, earnings statements, following, the basket, help tickets, the
 * post-approval steps and profile rejection.
 *
 * ⚠️ Merged by HelpCentreSeeder alongside ExtraArticles and FeatureArticles, so
 * the rules are the ones stated once in HelpCentreSeeder's docblock:
 *
 * 🚨 Stripe-facing public copy. No gift / tip / donation / fundraise / expense
 *    framing, and no brand names. ("Bills" as a product name is fine.)
 *    ⚠️ The LEGAL pages may name banned words — a prohibited-activity list has
 *    to say what is prohibited. A help article summarising one may NOT copy
 *    that vocabulary across; describe what the document covers instead.
 * 🚨 Never type a price, rate, threshold, window or seat count — use a
 *    {{token}} from App\Support\HelpTokens, which reads the same config the
 *    engine enforces.
 * ⚠️ No token in a TITLE — titles print into meta, breadcrumbs and JSON-LD,
 *    none of which render tokens.
 * ⚠️ No supporter-fee PERCENTAGE anywhere: rates differ per payment method and
 *    per creator, so a single figure is wrong for someone.
 * ⚠️ Every `related` slug must exist, here or in the other three files.
 *
 * 🚨 A LEGAL SUMMARY IS A SIGNPOST, NEVER A RESTATEMENT. These articles say
 *    what a document covers and what it means in practice, then link to it. The
 *    document is what the reader agreed to; an article that paraphrases a
 *    clause becomes a second, unversioned copy of legal text the moment the
 *    real one is edited. Same rule the Growth Bonus terms page follows in the
 *    other direction (transcribed, never summarised).
 */
class CoverageArticles
{
    /** @return array<int, array<string, mixed>> */
    public static function forCategory(string $slug): array
    {
        return match ($slug) {
            'getting-started-creators' => self::creatorStart(),
            'getting-started-supporters' => self::supporterStart(),
            'selling' => self::selling(),
            'money-and-payouts' => self::money(),
            'payments-and-checkout' => self::checkout(),
            'account-and-security' => self::account(),
            'my-purchases' => self::purchases(),
            'trust-and-safety' => self::trust(),
            default => [],
        };
    }

    private static function creatorStart(): array
    {
        return [
            [
                'slug' => 'what-happens-after-approval',
                'title' => 'My profile is approved — what now?',
                'audience' => 'creator',
                'keywords' => 'approved, accepted, profile approved, what next, next step, after approval, setup finished, done, now what, first listing, three listings',
                'summary' => 'Your page is live once your photo, bio and handle pass the automatic checks. Next you connect your payouts and add a card — then list something. The ID check comes later, when there is money to pay out.',
                'related' => ['what-do-i-do-next', 'connect-your-payouts', 'verify-your-identity', 'what-can-i-sell'],
                'body' => <<<'MD'
Your photo, bio and social handle have passed the automatic checks, so your profile is public. Nobody had to approve it.

## What is left

In this order:

1. **Connect your payouts** so money can reach your bank.
2. **Add a payment card.** This is your own platform subscription — see [what the subscription costs](/help/getting-started-creators/what-does-the-subscription-cost).

**The ID check is not on that list.** You can list and sell before it is done; it is what releases your money to your bank, so you only need it once you have earnings waiting.

## Then list something

You can sell with a single listing. We suggest publishing at least {{setup.listings_target}} because a page with one thing on it gives a visitor one decision and no reason to look around — but nothing refuses a sale below that number, and there is no threshold to reach.

If you are not sure what to put up first, read [what you can sell](/help/selling/what-can-i-sell).
MD,
            ],
            [
                'slug' => 'my-profile-was-rejected',
                'title' => 'My profile was rejected — what do I do?',
                'audience' => 'creator',
                'keywords' => 'rejected, declined, turned down, refused, not approved, resubmit, submit again, fix, reason, why rejected, appeal',
                'summary' => 'A rejection names what needs changing and puts your profile back in your hands. Change the thing it names and save — it is checked again straight away, and there is no limit on how many times.',
                'related' => ['why-is-my-profile-still-in-review', 'why-was-my-photo-rejected', 'what-content-is-allowed', 'getting-help-from-us'],
                'body' => <<<'MD'
Change what the reason names and **save**. There is nothing to submit — the moment you save, that item is checked again and your page goes live on its own once everything is clean. There is no limit on how many times.

## The reason is on your own dashboard

It names which part was the problem — your photo, your bio, your cover image or your social handle — and who pulled it: an automated check, or one of our team if a person looked. If it does not say enough for you to act on, [ask us](/help/trust-and-safety/getting-help-from-us) and we will explain.

## It is one decision about the whole profile

Your profile is reviewed as a whole and rejected once, not asset by asset. So you get one reason covering everything that needs work, rather than three separate messages over three days.

## Nothing else is lost

Your listings, your settings and anything you have already sold are untouched. The profile is simply not public while it is back with you.

## We keep the history

Each decision a person takes is recorded, so if one of our team looks again they can see what was asked for last time. That is there to stop you being told two different things by two different people.
MD,
            ],
            [
                'slug' => 'choose-a-cover-image',
                'title' => 'How do I set my cover image?',
                'audience' => 'creator',
                'keywords' => 'cover, banner, header, cover photo, cover image, background, top image, change cover, cover banners, presets',
                'summary' => 'Pick one of our ready-made covers or upload your own. Both appear straight away; an uploaded one is checked automatically against the content rules.',
                'related' => ['why-was-my-photo-rejected', 'what-happens-after-approval', 'what-content-is-allowed'],
                'body' => <<<'MD'
Open your profile editor and choose a cover. You have two options.

## Ready-made covers

We keep a set of covers you can use as they are. They are already approved, so one appears on your profile immediately.

## Your own image

Upload one and it appears straight away. It is checked automatically against the content rules, and pulled back with a reason if it fails.

A cover is the first thing a visitor sees, so it is held to the same content rules as the rest of your page — see [what content is allowed](/help/content-rules/what-content-is-allowed).

## If it is refused

You will be told which part was the problem and you can upload a different one. A refused cover never leaves your page blank — the previous one stays until a new one clears.
MD,
            ],
            [
                'slug' => 'get-found-on-your-birthday',
                'title' => 'Can supporters find me on my birthday?',
                'audience' => 'creator',
                'keywords' => 'birthday, birthdays, birthday discovery, be found on my birthday, get found, discovered, featured, discovery, opt in, date of birth, dob, my birthday, promote',
                'summary' => 'If you switch it on, you appear on the birthday page during the week your birthday falls in, and people who support you can be reminded. It is off unless you turn it on.',
                'related' => ['how-do-i-find-creators', 'tell-your-supporters', 'how-do-i-start-selling'],
                'body' => <<<'MD'
Turn on **birthday discovery** in your account settings. It is off unless you switch it on — having a date of birth on file is not the same as agreeing to be listed.

## What it does

- You appear on the birthday page for the week your birthday falls in. The page shows one week at a time, Monday to Sunday.
- People who have bought from you can be reminded in the days before.

## Your birth year is never shown

Not on the page, not in an email, not to anyone. Only the day and the month are ever used.

## If you cannot see yourself

Two ordinary reasons, and neither is a fault:

- **Your birthday is in a different week.** The page only ever shows the current one, so a birthday a few days away can still be in next week's list.
- **Not enough creators that week.** The page waits until there are enough birthdays to be worth showing, rather than featuring one person on their own.

You also need a date of birth saved on your account, and your profile has to be approved.
MD,
            ],
        ];
    }

    private static function supporterStart(): array
    {
        return [
            [
                'slug' => 'following-a-creator',
                'title' => 'What does following a creator do?',
                'audience' => 'supporter',
                'keywords' => 'follow, following, unfollow, follower, subscribe free, notify me, keep up with, updates, feed',
                'summary' => 'Following tells a creator you want to hear when they post something new. It costs nothing, it is not a membership, and it does not unlock anything.',
                'related' => ['what-am-i-actually-buying', 'how-do-i-find-creators', 'why-am-i-not-getting-notifications', 'how-do-i-cancel-a-membership'],
                'body' => <<<'MD'
Following is free and unlocks nothing. It tells the creator you want to hear from them, and it is how you get told when they publish something new.

## Following is not buying

If you want the content behind a membership or a listing, you have to buy it. Following a creator gives you no access to anything paid — see [what am I actually buying](/help/getting-started-supporters/what-am-i-actually-buying).

## Unfollowing

Open their page and press Following again. Nothing you have already bought is affected — a purchase is yours whether you follow the creator or not.

## If you hear nothing

Check your [notification settings](/help/account-and-security/why-am-i-not-getting-notifications). Following works, but the message still has to have somewhere to arrive.
MD,
            ],
        ];
    }

    private static function selling(): array
    {
        return [
            [
                'slug' => 'your-link-in-bio-page',
                'title' => 'What is my link in bio page?',
                'audience' => 'creator',
                'keywords' => 'bio, link in bio, biolink, bio page, one link, linktree, social link, my link, share link, themes, appearance',
                'summary' => 'A single short page you can put in every social profile. It carries your links and the listings you choose, and taps through to the same checkouts as your profile.',
                'related' => ['what-can-i-sell', 'how-do-i-start-selling', 'share-your-listings-automatically', 'tell-your-supporters'],
                'body' => <<<'MD'
Your link in bio page lives at **/your-username/bio**. It is one short page built for the single link a social profile gives you.

## What goes on it

- Your links.
- Up to a dozen of your own listings, chosen by you.
- One featured Piggy Pot, if you have one.

Tapping a listing takes the visitor to the same checkout as your profile does. Nothing is priced differently there and nothing is bought on the page itself.

## It is always current

The page reads your live listings, so an edited price or a sold-out item is right the moment you change it. There is nothing to update twice.

## Appearance

Pick from a small set of ready-made looks and choose whether your listings show as a list or a grid. There is a live preview at both phone and desktop width while you choose.

The set is deliberately small: every combination has been checked for legibility, which is not something a free colour picker can promise.

## What it counts

Taps on your items are counted so you can see which link is doing the work. Traffic arriving through your own bio page is recorded as yours, not ours.
MD,
            ],
            [
                'slug' => 'what-is-a-piggy-pot',
                'title' => 'What is a Piggy Pot?',
                'audience' => 'creator',
                'keywords' => 'piggy pot, pot, group, together, progress, target, goal, shared, many buyers, pot content',
                'summary' => 'A Piggy Pot is one piece of content that any number of people can buy into, with an optional progress figure shown on the card. Everyone who buys gets the same content.',
                'related' => ['what-can-i-sell', 'my-piggy-pot-disappeared', 'what-is-the-piggy-bank', 'price-limits'],
                'body' => <<<'MD'
A Piggy Pot is a piece of content several people buy into rather than one person buying outright. Everyone who buys gets the same thing.

## What you have to provide

The content itself and a description of it. That is the product, and it is required — a pot cannot be published without it.

## The progress figure is optional

You can show a target so people can see how it is going. It is context on the card and nothing more: it does not gate the content, and buyers get what they paid for whether the figure is reached or not.

## The supporter list ranks by purchases

The board on a pot counts **how many times each person has bought**, never how much they spent. Nobody's spending is published.

## Buying without an account

Someone can buy into a pot without signing up. That is deliberate — it is one of the two things on the platform that allow it.

Prices run from {{price.min}} to {{price.max.pot}}.

## If yours has gone

See [my Piggy Pot disappeared](/help/selling/my-piggy-pot-disappeared).
MD,
            ],
            [
                'slug' => 'what-is-the-piggy-bank',
                'title' => 'What is the Piggy Bank on my profile?',
                'audience' => 'creator',
                'keywords' => 'piggy bank, bank, one off, one-time, single purchase, support me, exclusive content, quick buy, jar',
                'summary' => 'A one-off content purchase on your profile. Someone chooses an amount, pays once, and receives the exclusive content you attached. It never renews.',
                'related' => ['what-is-a-piggy-pot', 'what-can-i-sell', 'price-limits', 'what-am-i-actually-buying'],
                'body' => <<<'MD'
The Piggy Bank is a one-off purchase of exclusive content on your profile. Someone picks an amount, pays once, and gets what you attached.

## It never renews

There is no subscription behind it and nothing recurs. The buyer is charged once and that is the end of it — which is also why the posting rules that apply to memberships and Bills do not apply here.

## What the buyer gets

Exclusive content, plus a confirmation of the purchase. It is a purchase like any other on the platform, not a payment with nothing behind it.

## Amounts

From {{price.min}} upwards, within the same limits as the rest of your listings — see [price limits](/help/selling/price-limits).

## Piggy Bank or Piggy Pot?

- **Piggy Bank** — one buyer, one payment, your profile.
- **[Piggy Pot](/help/selling/what-is-a-piggy-pot)** — many buyers into one piece of content, with an optional progress figure.
MD,
            ],
            [
                'slug' => 'share-your-listings-automatically',
                'title' => 'Can new listings post to my socials automatically?',
                'audience' => 'creator',
                'keywords' => 'auto tweet, autotweet, automatic, share, post automatically, x, twitter, social, connect account, cross post',
                'summary' => 'Connect your X account and switch automatic sharing on, and a new wish is posted for you when you publish it. It is off unless you turn it on.',
                'related' => ['your-link-in-bio-page', 'can-i-link-to-my-other-platforms', 'tell-your-supporters'],
                'body' => <<<'MD'
Open **Auto tweet settings** from your account, connect your X account and switch it on. From then on, publishing a new wish posts it for you.

## It is off by default

Nothing is ever posted to an account you have not connected, and nothing is posted while the setting is off.

## What is posted

The listing you just published, with a link to it. It is not a feed of everything you do on the platform.

## Turning it off

The same switch. Turning it off stops future posts; anything already posted stays where it is, because it is on your own account and ours to remove is not.

## If a post does not appear

The commonest cause is the connection having expired at their end. Disconnect and connect again from the same screen.

If you would rather tell people yourself, [tell your supporters](/help/getting-started-creators/tell-your-supporters) sends a message to the people who have already bought from you.
MD,
            ],
            [
                'slug' => 'selling-to-buyers-in-the-us',
                'title' => 'Does anything change if my buyers are in the US?',
                'audience' => 'creator',
                'keywords' => 'us, usa, america, american, united states, us addendum, irs, tax form, 1099, arbitration, state, delaware',
                'summary' => 'There is a US Addendum that applies to US users. It names the US contracting entity and covers arbitration, class actions, IRS reporting and state disclosures.',
                'related' => ['the-agreements-you-accept', 'do-i-charge-vat', 'vat-and-your-earnings', 'shipping-physical-products'],
                'body' => <<<'MD'
Selling works the same way wherever your buyers are. What changes for **US users** is which entity you are contracting with and the terms that come with it.

## The US Addendum

Read it at [/us-addendum](/us-addendum). It covers:

- **The US contracting entity** — which company you are dealing with.
- **Arbitration**, for US users only.
- **A class action waiver.**
- **Tax compliance and IRS reporting.**
- **State-specific disclosures.**

## What it does not change

Your pricing, your payouts, your reserve and your fees work exactly as they do elsewhere. So does the ID check.

## Tax is yours

You are responsible for reporting and paying tax in your own jurisdiction — see [who is the seller](/help/payments-and-checkout/who-is-the-seller), which is the fact everything else here follows from.

If you are unsure how it applies to you, take your own advice. We can explain how the platform works, but we cannot advise on your tax position.
MD,
            ],
        ];
    }

    private static function money(): array
    {
        return [
            [
                'slug' => 'why-is-a-payment-held-for-review',
                'title' => 'Why is one of my payments being reviewed?',
                'audience' => 'creator',
                'keywords' => 'review hold, held for review, on hold, under review, payment review, delayed, checking, pending review, not paid out, review holds',
                'summary' => 'Some payments are checked before they are paid out. A payment on review hold is not lost or refused — it is waiting, and it joins the next payout run once it clears.',
                'related' => ['why-is-some-of-my-money-held', 'when-do-i-get-paid', 'my-payout-was-smaller-than-expected', 'where-can-i-see-my-earnings'],
                'body' => <<<'MD'
A small number of payments are checked before they are paid out. You can see any of yours under **Review holds** in your finance screens.

## It is not the same as the reserve

Two different things, and it is worth keeping them apart:

- **A [reserve](/help/money-and-payouts/why-is-some-of-my-money-held)** is a routine slice of a normal payment, held for a set window and released on its own.
- **A review hold** is one whole payment being looked at before it moves.

## What happens next

It clears and joins the next payout run, or we come back to you if we need something. Either way it is not gone.

## What to do

Usually nothing. If it has been sitting longer than you would expect, [ask us](/help/trust-and-safety/getting-help-from-us) and we will tell you where it is.

## Why it happens at all

The platform and its payment partner both have checks that money passes through. Most payments never touch them.
MD,
            ],
            [
                'slug' => 'download-an-earnings-statement',
                'title' => 'How do I get a statement of my earnings?',
                'audience' => 'creator',
                'keywords' => 'statement, earnings statement, download, pdf, csv, accountant, records, tax return, proof of income, invoice, export',
                'summary' => 'There is an earnings statement in your finance screens that you can view and download — the figures your accountant needs, in one file.',
                'related' => ['where-can-i-see-my-earnings', 'vat-and-your-earnings', 'do-i-charge-vat', 'what-fees-are-deducted'],
                'body' => <<<'MD'
Open **Statement** in your finance screens. You can read it there and download a copy.

## What it covers

What you sold, what was deducted and what was paid to you, so it can be handed to an accountant without anyone going through a screen line by line.

## It is not a tax return

It is a record of what happened on this platform. What you owe, and where, depends on your own circumstances — you are the seller, so tax is yours to report. See [who is the seller](/help/payments-and-checkout/who-is-the-seller).

## VAT

If VAT applies to you, read [VAT and your earnings](/help/money-and-payouts/vat-and-your-earnings) before reading the statement — it explains which figure is which.

## Live figures

Your [earnings screens](/help/money-and-payouts/where-can-i-see-my-earnings) are the day-to-day view. The statement is the one to keep.
MD,
            ],
        ];
    }

    private static function checkout(): array
    {
        return [
            [
                'slug' => 'who-is-the-seller',
                'title' => 'Who am I actually buying from?',
                'audience' => 'both',
                'keywords' => 'seller, merchant of record, mor, who sells, who is responsible, contract, statement, bank statement, refund who, spenny piggy or creator, supplier',
                'summary' => 'You buy from the creator. They are the seller and the merchant of record for their own sales. Spenny Piggy runs the payments, the moderation and the safety controls around them.',
                'related' => ['what-am-i-actually-buying', 'refunds-and-cancellations', 'the-agreements-you-accept', 'disputes-and-chargebacks'],
                'body' => <<<'MD'
**You buy from the creator, not from Spenny Piggy.** The creator is the seller and the merchant of record for their own sales.

## What that means in practice

- The **creator** is responsible for the content or service, for delivering it, and for its quality.
- The **creator** handles refunds, disputes and complaints about their own sales — within the rules of the platform and its payment partner.
- The **creator** is responsible for their own tax.
- **Spenny Piggy** provides the payment routing and processing, the moderation systems and the risk controls. We are not the seller or the supplier.

## We can still step in

Where compliance, fraud prevention, dispute resolution or risk require it, we can delay a payout, hold funds, reverse a transaction or issue a refund. That is not us becoming the seller; it is the safety net around the sale.

## If something is wrong with a purchase

Start with the creator — see [refunds and cancellations](/help/my-purchases/refunds-and-cancellations). If that does not resolve it, [come to us](/help/trust-and-safety/getting-help-from-us).

## The document

Creators confirm this when they connect their payouts. It is the [Merchant of Record Agreement](/mor-agreement), and the wider picture is in the [Creator Agreement](/creator-agreement) and the [Creator Supporter Contract](/creator-supporter-contract).
MD,
            ],
            [
                'slug' => 'using-the-basket',
                'title' => 'Can I buy more than one thing at once?',
                'audience' => 'supporter',
                'keywords' => 'basket, cart, add to cart, wishes, several wishes, buy several, multiple, more than one, at once, checkout together, one payment, quantity, remove from basket',
                'summary' => 'Wishes can be added to a basket and paid for in one go. Memberships, Bills, paid requests and shop orders are bought one at a time, because each sets up its own arrangement.',
                'related' => ['what-am-i-actually-buying', 'why-do-i-need-an-account-for-this-purchase', 'why-is-the-total-more-than-the-price', 'do-i-need-an-account-to-buy'],
                'body' => <<<'MD'
Wishes go into a basket, and you pay for them together in one checkout.

## What cannot go in a basket

Memberships, Bills, paid requests and shop orders are bought one at a time. Each of those sets up something specific — a recurring arrangement, an agreement with the creator, or an order to be posted — so each has its own checkout.

## Buying from more than one creator

You can. Each creator is paid for their own items — see [who is the seller](/help/payments-and-checkout/who-is-the-seller).

## Without an account

A basket of wishes can be paid for without signing up. Some purchases do need an account, and [there is a reason for each](/help/payments-and-checkout/why-do-i-need-an-account-for-this-purchase).

## The total

The number at checkout is the number you are charged. Why it differs from the listed price is explained in [why is the total more than the price](/help/payments-and-checkout/why-is-the-total-more-than-the-price).
MD,
            ],
        ];
    }

    private static function account(): array
    {
        return [
            [
                'slug' => 'the-agreements-you-accept',
                'title' => 'Which terms apply to me?',
                'audience' => 'both',
                'keywords' => 'terms, terms and conditions, t&c, agreement, contract, legal, policy, policies, rules, what did i agree to, small print',
                'summary' => 'A map of every agreement on the platform and what each one covers, so you can find the right document instead of reading all of them.',
                'related' => ['who-is-the-seller', 'what-content-is-allowed', 'your-right-to-cancel-or-return', 'copyright-and-takedowns'],
                'body' => <<<'MD'
Everyone accepts the **[Terms of Service](/terms-and-conditions)**. Which of the rest apply depends on whether you sell, buy, or both.

## If you sell

- **[Creator Agreement](/creator-agreement)** — onboarding and eligibility, your responsibilities as the seller, content standards, fees and earnings, payouts and reserves, refunds and disputes, tax, and what happens if the rules are broken.
- **[Merchant of Record Agreement](/mor-agreement)** — the short declaration you confirm when you connect your payouts. See [who is the seller](/help/payments-and-checkout/who-is-the-seller).
- **[Payments Policy](/reserves-and-payments-policy)** — payout schedule, payment reviews, the reserve and its release, chargebacks and offsets, risk monitoring.
- **[Paid Tasks Terms](/paid-tasks-terms)** — only if you take paid requests.
- **Bonus terms** — [Growth Bonus](/growth-bonus-terms) and [Fast Start](/fast-start-bonus-terms), if you are in either programme.

## If you buy

- **[Supporter Terms](/supporter-terms)** — how payment authorisation works, pricing and recurring billing, refunds and complaints, and what to expect from creators.
- **[Creator Supporter Contract](/creator-supporter-contract)** — the agreement between you and the creator for each purchase: what you are licensed to do with the content, how long for, and who owns it.
- **[Return, Refund and Cancellation Policy](/return-policy)** — see [your right to cancel or return](/help/my-purchases/your-right-to-cancel-or-return).

## Everyone

- **[Content and Payment Framework](/content-payment-policy)** — what may be sold here.
- **[Copyright Policy](/copyright-policy)** — see [copyright and takedowns](/help/trust-and-safety/copyright-and-takedowns).
- **[US Addendum](/us-addendum)** — US users only.

## Privacy

The privacy and cookies policies are published separately and are linked in the footer of every page.
MD,
            ],
            [
                'slug' => 'install-the-app',
                'title' => 'Can I install this as an app?',
                'audience' => 'both',
                'keywords' => 'app, install, download, home screen, add to home screen, ios, android, iphone, pwa, app store, play store, icon',
                'summary' => 'Yes. There is nothing to download from an app store — you add the site to your home screen and it opens like an app, full screen, with notifications.',
                'related' => ['why-am-i-not-getting-notifications', 'two-factor-and-passkeys', 'i-cannot-sign-in'],
                'body' => <<<'MD'
There is no app store download. You add the site to your home screen and it opens full screen, with its own icon.

## On Android or Chrome

You will usually be offered an **Install** option. Take it, and the icon appears with your other apps.

## On iPhone or iPad

Open the site in Safari, tap the **Share** button, then **Add to Home Screen**.

## What you get

- Its own icon and a full-screen window with no address bar.
- Notifications, once you allow them — see [why am I not getting notifications](/help/account-and-security/why-am-i-not-getting-notifications).
- Everything the site does. It is the same account and the same pages.

## Installing does not switch notifications on

They are a separate permission your phone asks for. Installing the app makes them possible; it does not turn them on.

## Removing it

Delete the icon the way you would any app. Your account is untouched.
MD,
            ],
            [
                'slug' => 'codes-at-signup',
                'title' => 'What is the code box when I sign up?',
                'audience' => 'both',
                'keywords' => 'code, promo code, coupon, referral code, invite code, discount, voucher, signup code, applied, who referred me',
                'summary' => 'It is where a referral or invite code goes. A creator referral code records who introduced you. It is optional and nothing is refused without it.',
                'related' => ['refer-a-creator', 'the-agreements-you-accept', 'what-does-the-subscription-cost'],
                'body' => <<<'MD'
The box is optional. Leave it empty and signing up works exactly the same.

## A creator referral code

If a creator gave you a code, entering it records that they introduced you. That is what the [refer a creator](/help/money-and-payouts/refer-a-creator) programme counts.

The code has to be entered **when you sign up**. It cannot be added afterwards, because what it records is where the account came from.

## Nothing is priced differently

A code does not change what you pay or what you can do. What the creator subscription costs is [the same either way](/help/getting-started-creators/what-does-the-subscription-cost).

## If a code is refused

Codes can be limited in number or set to expire. If yours is not accepted, go back to whoever gave it to you — we cannot tell from your side which of those it was.
MD,
            ],
            [
                'slug' => 'block-someone-or-end-a-session',
                'title' => 'How do I block someone or sign out other devices?',
                'audience' => 'creator',
                'keywords' => 'block, blocked users, ban, stop someone, harassment, sessions, devices, sign out, log out everywhere, security, revoke, unblock',
                'summary' => 'Your security screens list everyone you have blocked and every device signed in to your account. You can block a user, unblock them, and end any session you do not recognise.',
                'related' => ['two-factor-and-passkeys', 'i-cannot-sign-in', 'report-a-problem', 'someone-is-impersonating-me'],
                'body' => <<<'MD'
Both are in your **security** screens.

## Blocking someone

Search for the account and block it. Blocked users are listed on the same screen and you can unblock any of them.

Blocking is about who can reach you. If someone is breaking the rules rather than simply bothering you, [report them](/help/trust-and-safety/report-a-problem) as well — blocking stops them reaching you and tells us nothing.

## Devices signed in

The sessions list shows where your account is signed in. Anything you do not recognise can be ended from there.

## If you think somebody else has been in your account

Do all three, in this order:

1. **Change your password.** That signs every other device out on its own.
2. **Turn on two-factor** — see [two-factor and passkeys](/help/account-and-security/two-factor-and-passkeys).
3. **[Tell us](/help/trust-and-safety/getting-help-from-us)**, so we can check whether anything was changed.
MD,
            ],
        ];
    }

    private static function purchases(): array
    {
        return [
            [
                'slug' => 'your-right-to-cancel-or-return',
                'title' => 'What are my rights to cancel or return?',
                'audience' => 'supporter',
                'keywords' => 'cancel, return, returns, statutory rights, consumer rights, cooling off, 14 days, change my mind, send back, right to refund, policy',
                'summary' => 'The Return, Refund and Cancellation Policy sets out what can be returned and what cannot. Digital content, subscriptions and physical goods are each treated differently.',
                'related' => ['refunds-and-cancellations', 'how-do-i-cancel-a-membership', 'my-content-has-not-arrived', 'who-is-the-seller'],
                'body' => <<<'MD'
The full document is the **[Return, Refund and Cancellation Policy](/return-policy)**. It is the one to read, because what applies depends on what you bought.

## The three cases it separates

- **Digital content** — content you can open and keep is not the same as something that can be sent back.
- **Subscriptions and recurring billing** — cancelling stops the next charge; see [how do I cancel a membership](/help/my-purchases/how-do-i-cancel-a-membership).
- **Physical goods** — an item that has to be posted is treated as an item, with the rights that come with that.

It also covers chargebacks and disputes, when the platform can step in, and how to ask for a refund.

## Your statutory rights

The policy has a section on them, and nothing in it takes them away. Where the law of your country gives you a right, you keep it.

## How to ask

Start with the creator — they are the seller ([why](/help/payments-and-checkout/who-is-the-seller)). [Refunds and cancellations](/help/my-purchases/refunds-and-cancellations) walks through it, and if you get nowhere, [come to us](/help/trust-and-safety/getting-help-from-us).

## Please do not start with your bank

A chargeback is slower for you than asking us, and it has consequences for the creator that a refund does not — see [disputes and chargebacks](/help/trust-and-safety/disputes-and-chargebacks).
MD,
            ],
        ];
    }

    private static function trust(): array
    {
        return [
            [
                'slug' => 'copyright-and-takedowns',
                'title' => 'Someone is using my copyrighted work — what do I do?',
                'audience' => 'both',
                'keywords' => 'copyright, dmca, takedown, infringement, stolen, stole, artwork, art, photo, music, my work, trademark, brand, logo, counter notice, report copyright, ip, intellectual property',
                'summary' => 'Send us a report and we will act on it. There is a counter-notice route if content is removed in error, and repeat infringement costs an account its access.',
                'related' => ['my-content-is-being-sold-by-someone-else', 'someone-is-impersonating-me', 'report-a-problem', 'what-content-is-allowed'],
                'body' => <<<'MD'
Send us a report. The full document is the **[Copyright Policy](/copyright-policy)**, and it names the address to send it to.

## What to include

- What the work is and that you own it or act for the owner.
- Where it is on the platform — a link.
- How to reach you.

## What we do

We can remove content we reasonably believe infringes, and we can act without notice first where that is the right thing to do. We do not check ownership of everything uploaded in advance — no platform of this kind does — which is why a report matters.

## If your content was removed in error

You can submit a counter-notice explaining why you have the right to use it. Content is restored where the review supports that.

## Repeat infringement

An account that repeatedly uploads work it has no right to loses access. We decide what counts as repeated.

## Trademarks and brands

Using someone else's brand, logo or identity, or implying a partnership that does not exist, is covered by the same policy — see also [what content is allowed](/help/content-rules/what-content-is-allowed).

## If it is your own listing being copied

[My content is being sold by someone else](/help/trust-and-safety/my-content-is-being-sold-by-someone-else) is the quicker route.
MD,
            ],
            [
                'slug' => 'getting-help-from-us',
                'title' => 'How do I contact support?',
                'audience' => 'both',
                'keywords' => 'contact, support, help, ticket, message, email, live chat, talk to someone, get help, customer service, reply, response',
                'summary' => 'Use the Get help button wherever you hit a problem. It opens a conversation attached to whatever you were looking at, and replies arrive in the same place.',
                'related' => ['report-a-problem', 'refunds-and-cancellations', 'my-account-was-suspended', 'is-this-message-really-from-you'],
                'body' => <<<'MD'
Press **Get help** on the screen where the problem is. It opens a conversation with us and carries the context of what you were looking at, so you do not have to explain which listing or which payment you mean.

## Where replies arrive

In the same conversation, and you are notified when we answer. You do not need to watch an inbox for it.

## Some conversations open themselves

If something happens that needs explaining — an ID check that could not be completed, an account restriction — a conversation is opened for you with the reason already in it. You can reply straight to that rather than starting again.

## About a specific purchase

Open it from the purchase itself. A conversation attached to an order gets to the right place faster than one that starts from nothing.

## Live chat

Where live chat is available it is in the corner of the page. If it does not open, the email address on the help pages reaches the same team.

## What we cannot do

We cannot give tax or legal advice, and we cannot make a decision on a creator's behalf about their own content. Everything else, ask.
MD,
            ],
            [
                'slug' => 'paid-request-disputes',
                'title' => 'A paid request went wrong — what happens?',
                'audience' => 'both',
                'keywords' => 'paid task, paid request, custom, commission, not delivered, late, refund task, escrow, accept, reject, proof, dispute request',
                'summary' => 'Money for a paid request is held until the work is delivered and accepted. If it is not delivered, or what arrives is not what was agreed, the payment can be returned.',
                'related' => ['how-do-paid-requests-work', 'my-content-has-not-arrived', 'the-content-was-not-what-was-described', 'refunds-and-cancellations'],
                'body' => <<<'MD'
The money is held while the work is being done. It does not reach the creator until the work has been delivered and accepted.

## The order of events

1. You pay. The money is held.
2. The creator does the work and uploads it.
3. You look at it and accept or reject it.
4. Accepting releases the payment to the creator.

## If nothing is delivered

The payment is returned. It does not sit in limbo — a request that passes its window without delivery is dealt with rather than left.

## If what arrives is not what was agreed

Reject it and say why. A creator can put it right; if it cannot be put right, [ask us](/help/trust-and-safety/getting-help-from-us).

## Creators: what you control

You choose whether to accept a request in the first place, and you set what you will and will not do. You are not obliged to take work.

## The document

The **[Paid Tasks Terms](/paid-tasks-terms)** are the full version: what a paid request is, payment and payouts, acceptance and creator control, delivery timeframes, refunds, and what is not allowed.

For how the feature works day to day, read [how do paid requests work](/help/selling/how-do-paid-requests-work).
MD,
            ],
        ];
    }
}
