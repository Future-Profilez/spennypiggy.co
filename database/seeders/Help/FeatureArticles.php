<?php

namespace Database\Seeders\Help;

/**
 * The third content batch — one article per SHIPPED feature that had none.
 *
 * 🚨 THE REASON THIS FILE EXISTS. A feature can ship complete, with tests and
 * an admin screen, and still be invisible: the help centre never gains an
 * article, nobody searches for a word we never wrote, and support answers the
 * same question by hand for a year. Audited 4 Sep 2026 against the shipped
 * feature list — Creator Growth Bonus (live 28 Aug 2026), Fast Start, referrals,
 * shipping profiles, creator push, saved items, the wishlist, the leaderboard
 * and account suspension all had ZERO articles between them.
 *
 * ⚠️ Merged by HelpCentreSeeder alongside ExtraArticles, so the rules are the
 * ones stated once in HelpCentreSeeder's docblock and repeated in ExtraArticles:
 *
 * 🚨 Stripe-facing public copy. No gift / tip / donation / fundraise / expense
 *    framing, and no brand names. ("Bills" as a product name is fine.)
 * 🚨 Never type a price, rate, threshold, window or seat count — use a
 *    {{token}} from App\Support\HelpTokens, which reads the same config the
 *    engine enforces.
 * ⚠️ No token in a TITLE — titles are printed into meta, breadcrumbs and
 *    JSON-LD, none of which render tokens.
 * ⚠️ No supporter-fee PERCENTAGE anywhere: rates differ per payment method and
 *    per creator, so a single figure is wrong for someone.
 * ⚠️ Every `related` slug must exist, here or in the other two files — a
 *    related link to a slug nothing defines renders nothing and loses the
 *    reader silently.
 */
class FeatureArticles
{
    /** @return array<int, array<string, mixed>> */
    public static function forCategory(string $slug): array
    {
        return match ($slug) {
            'getting-started-creators' => self::creatorStart(),
            'getting-started-supporters' => self::supporterStart(),
            'selling' => self::selling(),
            'money-and-payouts' => self::money(),
            'my-purchases' => self::purchases(),
            default => [],
        };
    }

    private static function creatorStart(): array
    {
        return [
            [
                'slug' => 'the-creator-leaderboard',
                'title' => 'How does the leaderboard work?',
                'audience' => 'creator',
                'keywords' => 'leaderboard, ranking, rank, top creators, chart, position, board, climbing, top 1%, opt out',
                'summary' => 'The public board ranks creators by how many different people have bought from them — never by how much money they have made. You can opt out at any time.',
                'related' => ['how-do-i-start-selling', 'tell-your-supporters'],
                'body' => <<<'MD'
The board ranks by **how many different people have bought from you**. Not by revenue, and not by followers.

## Why not money

Your earnings are yours. A public board ordered by revenue publishes what every creator on it earns, to anyone who opens the page — so no amount appears on it anywhere, and none ever will.

## Why not followers

A follow costs nothing. The board is meant to show who is actually being supported, so one person buying once counts, and a thousand follows count for nothing. Followers are only used to break a tie between two creators on the same number of buyers.

## The periods

Weekly, monthly and all time. Every period except all time closes on a fixed date, and the countdown on the page is that date — so the board is a race with an end rather than a table that never resets.

## Movement

Your position is captured once a day, which is what the up and down arrows compare against. Climbing several places can trigger a notification; slipping never does — losing a place is not something you did wrong, and being told about it by the platform you sell on helps nobody.

## Opting out

There is a switch on your account settings. Opting out removes you from the board and from the past-winners list immediately, not when a cache expires. Nothing else about your account changes.
MD,
            ],
            [
                'slug' => 'tell-your-supporters',
                'title' => 'Sending a notification to your supporters',
                'audience' => 'creator',
                'keywords' => 'push, notification, tell supporters, announce, message my fans, broadcast, alert, notify, lock screen',
                'summary' => 'You can send one short notification a day, {{push.per_month}} in any {{push.window_days}} days, to the people who have bought from you. No links or contact details are allowed in it.',
                'related' => ['the-creator-leaderboard', 'how-do-scheduled-posts-work'],
                'body' => <<<'MD'
"Tell your supporters" is on your dashboard. It sends a short notification to the people who have **bought from you** — not to everyone who follows you.

## The limits

{{push.per_day}} a day, and {{push.per_month}} in any rolling {{push.window_days}} days. Up to {{push.max_length}} characters, so it fits on a lock screen.

They are deliberately tight. A notification from you lands with your name on it and gets read; one that arrives every day gets the notifications switched off, and somebody who does that is gone for every creator they support, not just you. The limit protects the channel you are using.

## What cannot go in one

No links, no @handles, no email addresses and no phone numbers.

A supporter tapping a notification with your name on it is trusting you, and a link is how that trust gets used to move somebody to a site with no refunds and nobody to complain to. Anyone who taps yours always lands on your own page here.

If a message is refused, you are told why and it does **not** count against your daily allowance — so a rejected draft costs you nothing but the retype.

## When it does not arrive

A supporter who has turned notifications off, or never granted permission in their browser, does not receive it. Your allowance is spent on sending, not on delivery, so it is worth writing something worth reading rather than sending one to test it.
MD,
            ],
        ];
    }

    private static function supporterStart(): array
    {
        return [
            [
                'slug' => 'what-is-a-wishlist',
                'title' => 'What is a wishlist?',
                'audience' => 'supporter',
                'keywords' => 'wishlist, wish, wish list, unlock, buy content, one off, single purchase, what is a wish',
                'summary' => 'A wishlist is a creator\'s list of content you can buy one at a time. You pay once and get that item — there is nothing recurring about it.',
                'related' => ['what-am-i-actually-buying', 'do-i-need-an-account-to-buy', 'saving-items-for-later'],
                'body' => <<<'MD'
A wishlist is a list of things a creator has made and put up for sale individually. You buy one, you get that one, and nothing repeats.

## What you get

Every item names what it is before you pay, and that is what is delivered — a file, a link, or a message from the creator. It arrives on your purchases page and in your email receipt, both of which stay available afterwards.

## Paying

You do not need an account to buy from a wishlist. Signing in is still worth it: your purchases page is what keeps every item you have bought in one place, and without an account there is nothing for a purchase to attach to except the receipt email.

## Prices

A wishlist item can be priced anywhere from {{price.min}} to {{price.max.wish}}. The total you are shown at checkout is the total you pay.

## It is not a subscription

Nothing recurs and there is nothing to cancel. If you want something regular from a creator, that is a [membership or recurring content](/help/my-purchases/how-do-i-cancel-a-membership) instead.
MD,
            ],
        ];
    }

    private static function selling(): array
    {
        return [
            [
                'slug' => 'reusable-shipping-rates',
                'title' => 'Setting shipping rates once and reusing them',
                'audience' => 'creator',
                'keywords' => 'shipping profile, postage, shipping rates, reuse, zones, delivery cost, worldwide, domestic, courier price',
                'summary' => 'A shipping profile is a set of postage rates you can attach to any physical product, instead of typing the same rates into every listing.',
                'related' => ['shipping-physical-products', 'what-can-i-sell', 'edit-or-delete-a-listing'],
                'body' => <<<'MD'
If you sell more than one physical thing, you almost certainly post them the same way. A **shipping profile** is those rates saved once and attached to as many products as you like.

## How it works

Create a profile on the shop form, give it your rates by country, and select it on any physical listing. Change the profile later and every product using it changes with it — which is the point.

## Two ways to price postage, never both

- **A profile**, when the rates are the same across products.
- **Per-item rates**, typed on that one listing.

Selecting a profile on a listing removes any rates you had typed on it. Only one applies, so there is never a question of which won.

## Zones

Each rate is a country, plus a worldwide rate. A buyer's own country is matched first; anyone not matched pays the worldwide rate.

**Set your own country deliberately.** It is the one buyers nearest you will match on, and it is the rate most of your orders are likely to use.

## Deleting a profile

Deleting a profile that products are still using leaves those products with no postage rates at all — which means they ship free and you pay for the parcel. The form deselects a profile from your listings before deleting it, but if you have set rates up by hand, check the listings afterwards.

## Delivery notes stay per item

Delivery time and any restrictions belong to the individual product, not to the profile, so they are always shown and always yours to write. A profile carries prices only.
MD,
            ],
        ];
    }

    private static function money(): array
    {
        return [
            [
                'slug' => 'growth-bonus',
                'title' => 'The Creator Growth Bonus',
                'audience' => 'creator',
                'keywords' => 'growth bonus, milestone, ladder, rungs, qualifying earnings, 150 creators, seat, activate, 1000 bonus',
                'feature_flag' => 'growth_bonus.enabled',
                'summary' => 'A milestone bonus for the first {{growth.seats}} creators to activate — up to {{growth.max_reward}} as your sales grow. It is paid with the payout that carries the sale which qualified you.',
                'related' => ['bonuses-explained', 'fast-start-bonus', 'when-do-i-get-paid', 'do-i-charge-vat'],
                'body' => <<<'MD'
A ladder of {{growth.rungs}} milestones. Cross one and a bonus is added to a payout — up to {{growth.max_reward}} in total, for the first {{growth.seats}} creators to activate.

## Getting on it

Reach {{growth.activation_gmv}} in qualifying earnings within {{growth.window_days}} days of connecting your payouts. That claims one of the {{growth.seats}} places and unlocks the first rung, worth {{growth.first_reward}}.

Miss the window, or arrive after every place is taken, and no place is used up — the scheme simply does not start for you.

## What counts as qualifying earnings

The **listed price of what you sold**, including VAT where it applies. Not what the supporter was charged after fees, and not what lands in your bank.

Two things follow from that, and both matter:

- **It is not what you keep.** Where VAT applies, part of it goes to HMRC and is not yours. This figure is a measure of your sales, not of your take-home.
- **It is not the same number as your Founder progress**, which is measured after VAT. The two can legitimately differ, and for a VAT-registered creator they will.

Only completed sales count. Anything refunded is removed in proportion to the refund, and buying from yourself does not count.

## What you are paid, and when

A bonus rides the payout that carries the sale which took you over the rung. That sale waits for its own {{payout.period}} earning week to close and be held like every other, so the bonus lands with it — {{payout.wait}} after you cross, depending on the day of the week it happened.

There is nothing to claim and nothing to approve.

## Refunds afterwards

If a refund pulls you back below a rung you have crossed, an unpaid bonus for it is cancelled — and restored if genuine later sales take you back over. A bonus already paid is never taken back, and each rung is only ever paid once.

## How long you have

{{growth.expiry_months}} months from the day you activate to work up the ladder. The last rung needs {{growth.top_gmv}} in qualifying earnings.

## Where to see it

Your dashboard shows your position on the ladder and what the next rung is worth. The full ladder and the terms are on the Growth Bonus page.
MD,
            ],
            [
                'slug' => 'fast-start-bonus',
                'title' => 'The Fast Start bonus',
                'audience' => 'creator',
                'keywords' => 'fast start, fast start bonus, early bonus, first 30 days, new creator bonus, 5 percent, fast payout',
                'summary' => 'An extra {{faststart.rate}} on what you earn in your first {{faststart.window_days}} days, paid automatically once those sales have settled.',
                'related' => ['bonuses-explained', 'growth-bonus', 'founder-bonus', 'when-do-i-get-paid'],
                'body' => <<<'MD'
Fast Start pays **{{faststart.rate}} of your net earnings** in your first {{faststart.window_days}} days, on top of what you were already going to be paid.

## Net, not the listed price

It is calculated on what you actually earn after fees — deliberately different from the [Growth Bonus](/help/money-and-payouts/growth-bonus), which measures your listed sale value. The two schemes measure different things and they stack: qualifying for one does not affect the other.

## When it arrives

After your {{faststart.window_days}} days are up, and after those sales have settled — around {{faststart.settlement_days}} days beyond the window. It is paid automatically with a normal payout.

## What counts

Completed sales only. A refunded payment, or one still being processed when the window closes, is not in the figure.

## Nothing to apply for

There is no form and no approval step. If you believe you qualified and were not paid, contact support with the dates — the qualifying figure is worked out from completed sales, so it is usually a refund or an unsettled payment that explains a smaller number than you expected.

⚠️ Fast Start is not about how **fast** you are paid. Your payout schedule is unchanged by it — see [when do I get paid](/help/money-and-payouts/when-do-i-get-paid).
MD,
            ],
            [
                'slug' => 'refer-a-creator',
                'title' => 'Referring another creator',
                'audience' => 'creator',
                'keywords' => 'referral, refer a friend, referral link, refer and earn, invite, code, 50, affiliate',
                'summary' => 'Share your referral link and earn {{referral.reward}} once a creator you referred passes {{referral.threshold}} in lifetime sales.',
                'related' => ['bonuses-explained', 'growth-bonus', 'where-can-i-see-my-earnings'],
                'body' => <<<'MD'
Your referral link is on your dashboard. Anyone signing up as a creator through it is recorded as your referral.

## What you earn, and when

**{{referral.reward}} per creator — once that creator passes {{referral.threshold}} in lifetime sales.**

Both halves matter. A signup on its own earns nothing: the reward is for bringing somebody who goes on to actually sell, so there is a real threshold between the two and it is worth telling people you refer what they need to reach.

## How it is paid

With a normal payout, once the referred creator crosses the threshold. There is nothing to claim.

## Tracking it

Your dashboard shows who signed up through your link and how far each of them is towards the threshold — so you can see a referral that is close rather than wondering whether it registered at all.

## What does not count

- Your own second account.
- A creator who already had an account before using your link.
- Sales that were refunded, which come back off the running total.
MD,
            ],
        ];
    }

    private static function purchases(): array
    {
        return [
            [
                'slug' => 'saving-items-for-later',
                'title' => 'Saving an item for later',
                'audience' => 'supporter',
                'keywords' => 'save, saved, heart, favourite, wishlist saved, bookmark, save for later, shortlist',
                'summary' => 'The heart on any listing saves it to the Saved tab of your purchases page. Saving is not buying and never charges you.',
                'related' => ['what-am-i-actually-buying', 'what-is-a-wishlist', 'i-cannot-find-my-purchase'],
                'body' => <<<'MD'
Every listing carries a heart. Tapping it saves the item to the **Saved** tab on your purchases page.

## It is not a purchase

Saving costs nothing, charges nothing and tells the creator nothing. It is a shortlist for you.

## Where they go

Your purchases page, under Saved. Everything you have saved is there whatever creator it came from, so it works as one list across the whole site.

## You need an account

Saving is tied to your account rather than to your browser, which is what lets a saved item still be there on your phone tomorrow. Signed out, the heart is not shown.

## If a saved item disappears

A creator can edit, unpublish, sell out of or remove a listing at any point after you saved it, and a saved item is a bookmark rather than a hold. Saving does not reserve stock and does not fix the price — if something is time-limited, saving it will not keep it.
MD,
            ],
        ];
    }
}
