<?php

namespace Database\Seeders\Help;

/**
 * The second content batch, merged into HelpCentreSeeder by category slug.
 *
 * Kept in its own file purely so the seeder stays readable as the corpus grows —
 * the rules are identical and are stated once, in HelpCentreSeeder's docblock:
 *
 * 🚨 Stripe-facing public copy. No gift / tip / donation / fundraise / expense
 *    framing. ("Bills" as a product name is fine.)
 * 🚨 Never type a price, rate, threshold or seat count — use a {{token}}.
 * ⚠️ No token in a TITLE (titles are printed into meta, breadcrumbs and JSON-LD,
 *    none of which render tokens). Tokens live in the summary and body only.
 * ⚠️ No supporter-fee PERCENTAGE anywhere: rates differ per payment method and
 *    per creator, so a single figure is wrong for someone.
 *
 * These topics are derived from what the platform actually does — its routes,
 * its notifications, its statuses and its refusal messages — rather than from
 * guesses about what someone might ask.
 */
class ExtraArticles
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
            'content-rules' => self::contentRules(),
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
                'slug' => 'what-do-i-do-next',
                'title' => 'What do I do next?',
                'audience' => 'creator',
                'keywords' => 'next step, stuck, journey, what now, progress, dashboard steps, onboarding stuck',
                'summary' => 'Your dashboard always shows the single next step. It is based on what you have actually done, not on how long ago you signed up.',
                'related' => ['how-do-i-start-selling', 'why-is-my-profile-still-in-review'],
                'body' => <<<'MD'
There is one card on your dashboard that names the step you are on, and it is the only thing you need to act on.

## It follows what you have done, not the calendar

Finish three steps in an hour and it moves three places in an hour. It will never tell you to do something you have already done.

## "Nothing to do" is a real state

Two steps are finished by you and completed by an admin — your profile, and your identity check. While either is being reviewed the card says so and gives you nothing to press, because there genuinely is nothing.

## Dismissing it

Closing the card hides it for a week, not forever. It is usually hiding the one thing standing between you and being able to sell.
MD,
            ],
            [
                'slug' => 'my-account-was-suspended',
                'title' => 'My account has been suspended',
                'audience' => 'creator',
                'keywords' => 'suspended, locked out, account disabled, cannot log in, blocked account, reinstate',
                'summary' => 'Suspension stops selling and payouts. Contact support — it is not something that clears on its own.',
                'related' => ['what-content-is-allowed', 'stripe-is-asking-for-something'],
                'body' => <<<'MD'
A suspended account cannot sell, cannot be paid out, and does not appear anywhere public.

## Why it happens

- A content rule was broken.
- A payment or identity problem the platform has to act on.
- An unresolved issue with your connected Stripe account.

## What to do

Contact support. Suspension is a decision a person took, so it is a person who reviews it — there is no self-service route and nothing to wait out.

## Your money

Earnings already recorded are not deleted by a suspension. What happens to them depends on why the account was suspended, and support will tell you.

## If you think it was a mistake

Say so, and say what you were doing when it happened. If an automated rule caught something it should not have, that is worth knowing about — it usually means the rule needs fixing, not just your account.
MD,
            ],
            [
                'slug' => 'change-my-username-or-display-name',
                'title' => 'Changing your username, display name or photo',
                'audience' => 'creator',
                'keywords' => 'username, change name, handle, display name, rename, profile photo, url',
                'summary' => 'Your display name, photo and bio can be changed any time. Changes to photos and bio go back through review; your public page keeps the approved version meanwhile.',
                'related' => ['why-is-my-profile-still-in-review', 'connect-your-payouts'],
                'body' => <<<'MD'
## Display name, photo, banner and bio

Change them from your profile settings at any time.

**Editing something already approved does not take it down.** The public keeps seeing the approved version while the new one is reviewed, and if the change is refused your existing one simply stays. You always see your own latest upload.

## Your username

Your username is your public address, so changing it changes every link you have shared. Contact support if you need it changed.

## Your legal name

The name on your Stripe account is checked against your identity document and is separate from your display name here. Changing one does not change the other, and it should not — a stage name is not what a bank verifies against.
MD,
            ],
        ];
    }

    private static function supporterStart(): array
    {
        return [
            [
                'slug' => 'how-do-i-find-creators',
                'title' => 'How do I find creators?',
                'audience' => 'supporter',
                'keywords' => 'discover, find creators, browse, search, leaderboard, new creators',
                'summary' => 'Discover, the leaderboard, or a creator\'s own link. Every creator has one page with everything they sell on it.',
                'related' => ['what-am-i-actually-buying', 'do-i-need-an-account-to-buy'],
                'body' => <<<'MD'
- **Discover** — browse by what people are selling.
- **The leaderboard** — creators ranked by how many people support them, not by how much money they take.
- **A creator's own link** — everything they sell sits on one page.

## The leaderboard ranks reach, not spend

It is ordered by the number of supporters, with a bonus for verified creators. Amounts are deliberately not part of it and are not shown — this is not a rich list.

## The badges

A grey tick means an admin reviewed and approved that creator's profile. A pink tick means that, plus a passport identity check and a completed payout setup — the platform can actually pay them. A crown marks a Founder.
MD,
            ],
            [
                'slug' => 'is-my-payment-information-safe',
                'title' => 'Is my payment information safe?',
                'audience' => 'supporter',
                'keywords' => 'security, card details, safe, stored card, pci, stripe, is it secure, data',
                'summary' => 'Card details go straight to Stripe and are never stored on this platform.',
                'related' => ['card-or-bank', 'do-i-need-an-account-to-buy'],
                'body' => <<<'MD'
Every payment is processed by **Stripe**. Your card number is entered on Stripe's own checkout and never reaches this platform's servers or database.

## What we hold

The fact that a payment happened, its amount, and what it was for. Enough to show you a receipt and to resolve a problem — not your card.

## What appears on your statement

The creator's name followed by CONTENT. That is deliberate: an unrecognisable line on a statement is the most common cause of a dispute, and the creator's name is the thing you will recognise.

## Saved cards

If you buy a Membership or a Bill, Stripe stores the card so it can take the renewal. You can remove it from your account settings; doing so cancels the renewal, so your access runs to the end of the period you have paid for.
MD,
            ],
            [
                'slug' => 'why-was-my-payment-declined',
                'title' => 'Why was my payment declined?',
                'audience' => 'supporter',
                'keywords' => 'declined, failed payment, card refused, cannot pay, payment error, blocked, rejected',
                'summary' => 'Usually your bank. Sometimes a limit on larger payments, in which case a bank payment is offered instead.',
                'related' => ['card-or-bank', 'my-payment-says-processing'],
                'body' => <<<'MD'
## Most declines are your bank

We are told a payment was refused, not why. Your bank knows the reason and can usually clear it in a moment — a new card, an unusual amount, or a first payment to a name they have not seen.

## Larger payments

Above a certain amount an extra 3-D Secure step from your bank is required. If that step is not completed the payment does not go through.

On a larger payment, card may not be offered and a bank payment will be instead. That is a threshold combined with a signal — not a judgement about you — and a bank payment always works where card does not.

## What not to do

Do not retry the same card several times. Each attempt is a fresh authorisation and repeated failures make your bank more cautious, not less. Try a bank payment or a different card.

## If nothing works

Contact us with roughly when you tried and for what. We can see whether the attempt reached us at all, which is usually the whole answer.
MD,
            ],
        ];
    }

    private static function selling(): array
    {
        return [
            [
                'slug' => 'why-is-my-listing-not-showing',
                'title' => 'My listing is live but nobody can see it',
                'audience' => 'creator',
                'keywords' => 'not showing, invisible, cannot find my listing, missing, not on profile, hidden, not in discover',
                'summary' => 'Six things hide a listing: review, a schedule, being paused, sold out, an expired deadline, or a suspended account.',
                'related' => ['why-is-my-listing-under-review', 'schedule-a-listing', 'my-piggy-pot-disappeared'],
                'body' => <<<'MD'
**My Listings** shows the real state of everything you sell, with the reason next to anything that is not on sale. It is the fastest way to answer this.

The six causes, in order of how often they turn out to be it:

1. **Still in review** — new listings are not on sale until they are checked.
2. **Scheduled** — it goes live at the time you set, not before.
3. **Paused** — you turned it off, or it was switched off for you.
4. **Sold out** — stock reached zero. Supporters can still join the waitlist.
5. **Deadline passed** — Piggy Pots close at their deadline.
6. **Account suspended** — nothing you sell is public.

## If none of those apply

Open your own public page while signed out. Your own screens show you your unpublished work by design, so a listing can look present to you and be genuinely absent to everyone else.
MD,
            ],
            [
                'slug' => 'edit-or-delete-a-listing',
                'title' => 'Editing or deleting a listing',
                'audience' => 'creator',
                'keywords' => 'edit listing, delete, remove, take down, change price, update, unpublish',
                'summary' => 'Edit any listing at any time. Changing an image or a file sends it back through review; a price change does not.',
                'related' => ['why-is-my-listing-under-review', 'duplicate-a-listing'],
                'body' => <<<'MD'
## Editing

Any listing can be edited from **My Listings** or from its own module screen.

- **Changing a price, a description or stock** takes effect immediately.
- **Changing an image or the paid file** sends it back through review, because it is new material nobody has checked.

Re-saving without changing the image does **not** re-trigger review. An image already approved is not re-checked, so an unrelated edit cannot un-approve a listing.

## Deleting

Deleting removes it from sale. It does **not** un-sell anything already bought: people who paid keep their content and their receipt permanently, which is why the record survives the listing.

## Recurring items

Editing a Membership or a Bill does not change what existing subscribers are already paying. A price change applies to new subscribers.
MD,
            ],
            [
                'slug' => 'duplicate-a-listing',
                'title' => 'Duplicating a listing',
                'audience' => 'creator',
                'keywords' => 'duplicate, copy, clone, reuse listing, same again, repeat',
                'summary' => 'Duplicate from My Listings. The copy is a fresh listing that goes through review like any other.',
                'related' => ['edit-or-delete-a-listing', 'why-is-my-listing-under-review'],
                'body' => <<<'MD'
**My Listings → Duplicate.** The copy carries your title, description, price and reward.

## It is a new listing, not a clone

A duplicate is re-submitted as if you had filled the form in again, so it is priced, checked and reviewed like anything else. That is deliberate — a copied listing that skipped those checks would sell at whatever the original was priced at, forever, however you edited it afterwards.

## What is deliberately not copied

- **A Piggy Pot's deadline.** The original's is usually in the past, and a pot created already closed is invisible from the moment it is made.
- **Whether it was pinned.**
- Sales, views and history, which belong to the original.

## The title gets "(copy)"

The listing title does. The **reward** headline does not — that is what a supporter reads at checkout and on their receipt, and "(copy)" there describes your workflow rather than what they are buying.
MD,
            ],
            [
                'slug' => 'my-piggy-pot-disappeared',
                'title' => 'My Piggy Pot has disappeared from my profile',
                'audience' => 'creator',
                'keywords' => 'piggy pot, disappeared, gone, expired, deadline, pinned, not showing, closed',
                'summary' => 'A pot closes at its deadline and leaves your profile. Set a new deadline and it reopens.',
                'related' => ['why-is-my-listing-not-showing', 'what-can-i-sell'],
                'body' => <<<'MD'
A Piggy Pot has a deadline, and it closes on it. A closed pot leaves your public page rather than sitting there taking nobody's money.

## Reopening it

Edit the pot and set a **future** deadline. That is all — it goes back on sale, keeping everything already contributed.

## The featured slot

Your profile shows one pot at a time. If your pinned pot has closed, it stops being shown and the newest live pot takes the slot. Your own screens say "Pinned · not showing" rather than just "Pinned", so a lapsed pot does not quietly look fine.

## Completed pots

A pot that reached its goal is complete rather than expired, and also leaves the page. Duplicate it to run it again.
MD,
            ],
            [
                'slug' => 'how-do-scheduled-posts-work',
                'title' => 'Scheduling a post',
                'audience' => 'creator',
                'keywords' => 'schedule post, publish later, queue, timed post, drop, post scheduling',
                'summary' => 'Set a time in the composer. It publishes at that minute, and still needs approval like any post.',
                'related' => ['schedule-a-listing', 'why-were-my-subscriptions-paused'],
                'body' => <<<'MD'
The composer has a schedule switch. Set a date and time and the post publishes then.

## Until it publishes

Only you can see it. It is not on your profile, not in anyone's feed, and it does not count towards the posting rule that keeps your subscriptions collecting — a post nobody can read has not been delivered to anyone.

## It still needs approval

A scheduled post is reviewed like any other. If it reaches its time still unapproved, it publishes when it is approved.

## Limits

Up to 90 days ahead, and up to 20 posts queued at once.

## Your own screens

A scheduled post carries its go-live time wherever you see it, so it never looks identical to one that is already out.
MD,
            ],
            [
                'slug' => 'how-do-paid-requests-work',
                'title' => 'How do Paid Requests work?',
                'audience' => 'creator',
                'keywords' => 'paid task, custom request, commission, escrow, deadline, sla, proof, delivery, accept',
                'summary' => 'Custom work you make to order. The money is held until you deliver and the buyer accepts.',
                'related' => ['what-can-i-sell', 'what-is-a-reward', 'when-do-i-get-paid'],
                'body' => <<<'MD'
A Paid Request is custom work someone orders from you. The money is taken at the point of order and **held** until it is delivered and accepted.

## The sequence

1. A supporter orders and pays.
2. You are notified, with the deadline.
3. You deliver — a file, a message or a link — as proof of the work.
4. The supporter accepts, or it is auto-confirmed after a set period.
5. It becomes eligible for your next payout.

## Deadlines are real

Miss one and the order is refunded automatically. Nobody has to ask and there is nothing to dispute.

## Instant versus timed

An **instant** request is fulfilled on payment — the reward can be a file, because there is nothing to make.

A **timed** request cannot offer a file. Its whole point is work you produce afterwards, and a pre-uploaded file would be downloadable the moment the buyer paid. Use a message or a link.

## Held is not lost

Escrow money shows on your dashboard as awaiting delivery, separately from what is due to be paid, so a lower payout always has a reason you can see.
MD,
            ],
            [
                'slug' => 'shipping-physical-products',
                'title' => 'Selling and shipping physical products',
                'audience' => 'creator',
                'keywords' => 'physical, shipping, postage, tracking, delivery, parcel, stock, shop, courier',
                'summary' => 'Physical Shop products need shipping details and a tracking number when you send them. Payment clears after delivery is confirmed.',
                'related' => ['what-can-i-sell', 'when-do-i-get-paid', 'edit-or-delete-a-listing'],
                'body' => <<<'MD'
## Setting one up

A physical product needs a shipping profile — where you ship to and what it costs. Shipping is added to the buyer's total and is not part of your listed price.

**No separate reward headline is asked for.** The parcel is the deliverable and the product name already describes it.

## When someone orders

You are notified with the delivery address. Mark it shipped and add the courier and tracking number — the buyer sees both, which is the single biggest reduction in "where is my order?" messages.

## Payment

A physical order becomes eligible for payout once delivery is confirmed, not at the moment of sale. It is shown on your dashboard as awaiting delivery until then.

## Stock

Stock is decremented on each sale. At zero the listing shows as sold out and supporters can join a waitlist — and the number waiting is shown to you, because that is what makes a restock worth doing.

## Large orders

An order above the high-value threshold is held for an extra check before it is released. That protects both sides on a large sale.
MD,
            ],
            [
                'slug' => 'memberships-vs-bills',
                'title' => 'Memberships or Bills — what is the difference?',
                'audience' => 'creator',
                'keywords' => 'membership vs bill, difference, tiers, recurring, subscription, which should i use, perks',
                'summary' => 'A Membership sells tiers with a perks bundle. A Bill sells one content stream, with no tiers and no perks list.',
                'related' => ['what-can-i-sell', 'why-were-my-subscriptions-paused', 'what-is-a-reward'],
                'body' => <<<'MD'
Both are recurring and both give subscribers access to member-only posts. The difference is structural.

## Membership

**Tiers** — bronze through to lifetime, each at its own price, each with its own **perks bundle**. Up to {{price.max.membership}} a month.

A Membership cannot be published without at least one on-platform benefit in its perks. Selling access to something that is not here is not a membership to this platform.

## Bill

**One content stream.** No tiers, no perks list. Weekly, monthly or yearly. Up to {{price.max.bill}} a month.

A Bill has no perks list on purpose. Given one, the two products become indistinguishable and there is no reason to have both.

## Which to use

Sell one thing at one price → a Bill. Want to offer several levels of access → a Membership.

## Both carry the posting rule

Sell either and you need {{cadence.min_posts}} member posts in a rolling {{cadence.window_days}} days, or collection pauses. See [why have my subscription payments stopped](/help/content-rules/why-were-my-subscriptions-paused).
MD,
            ],
        ];
    }

    private static function money(): array
    {
        return [
            [
                'slug' => 'my-payout-was-smaller-than-expected',
                'title' => 'My payout was smaller than I expected',
                'audience' => 'creator',
                'keywords' => 'payout smaller, less than expected, missing money, short, wrong amount, not all of it',
                'summary' => 'Five things hold money back, and your dashboard lists each one separately with the amount.',
                'related' => ['when-do-i-get-paid', 'why-is-some-of-my-money-held', 'my-payout-failed'],
                'body' => <<<'MD'
Every deduction is shown separately on your financial dashboard, with the amount and the reason. In order of how often it turns out to be the cause:

1. **The {{payout.hold_days}}-day hold.** A sale is not eligible until it is {{payout.hold_days}} days old.
2. **Reserve.** A percentage of each sale held for {{reserve.window_days}} days — see [why is some of my money held](/help/money-and-payouts/why-is-some-of-my-money-held).
3. **Awaiting delivery.** Paid Requests not yet accepted, and physical orders not yet confirmed delivered.
4. **Refunds and disputes.** A refunded sale is deducted, including its VAT — the money went back to the buyer, so it is not yours to keep.
5. **Negative balance recovery.** If a previous refund or dispute left a shortfall, it is recovered from the next run rather than chased.

## The minimum

A payout below the minimum is not sent; it rolls into the next run instead of arriving as a payment too small to be worth the transfer.

## If it still does not add up

Every transaction has a full breakdown attached to it. Take the run date, open the ledger for that week, and the difference will be one of the five above.
MD,
            ],
            [
                'slug' => 'my-payout-failed',
                'title' => 'My payout failed',
                'audience' => 'creator',
                'keywords' => 'payout failed, bounced, returned, bank rejected, did not arrive, payment failed',
                'summary' => 'The money returns to your balance and retries in the next run. Usually a bank detail that needs correcting.',
                'related' => ['when-do-i-get-paid', 'connect-your-payouts', 'stripe-is-asking-for-something'],
                'body' => <<<'MD'
**Nothing is lost.** A failed payout returns to your balance and is included in the next run automatically. You do not need to ask for it.

## Why it happens

Almost always the bank details: an account closed, a number entered wrongly, or a bank refusing a transfer type. Your bank tells Stripe, and Stripe tells us.

## What to do

Check your payout details in your Stripe setup and correct anything wrong. If they look right, your bank will know why the transfer was returned — Stripe passes on the fact, not the reason.

## You are told

An email and a notification, both times: when it fails, and when the retry succeeds. Money moving is never something you should have to discover by checking.

## If it fails twice

Contact support rather than waiting for a third attempt. Two failures with the same details will produce a third.
MD,
            ],
            [
                'slug' => 'do-i-charge-vat',
                'title' => 'Do I need to charge VAT?',
                'audience' => 'creator',
                'keywords' => 'vat registered, should i charge vat, vat number, tax registration, vat rate',
                'summary' => 'Only if you are VAT registered. Set your rate in your settings and it is added to your prices.',
                'related' => ['vat-and-your-earnings', 'what-fees-are-deducted'],
                'body' => <<<'MD'
Only if you are VAT registered. Most creators are not, and if you are not, there is nothing to set.

## If you are registered

Set your VAT rate in your settings. It is then added on top of your prices at checkout and paid out to you with your earnings, for you to remit.

## It is added, not deducted

Your listed price stays what you receive. VAT goes on top of it, like the platform fees do.

## Whether you should register

That is a question for your accountant and depends on your total turnover, not on what you earn here. We cannot advise on it.

## Your records

The Tax tab of your financial dashboard has per-transaction VAT and downloadable statements for any period, including the UK tax year (6 April to 5 April — not the calendar year).
MD,
            ],
            [
                'slug' => 'bonuses-explained',
                'title' => 'Which bonuses can I earn?',
                'audience' => 'creator',
                'keywords' => 'bonus, fast start, referral, founder, extra money, earn more, rewards, incentive',
                'summary' => 'Three: the Founder bonus, the Fast Start bonus, and {{referral.reward}} for referring a creator who starts earning.',
                'related' => ['founder-bonus', 'when-do-i-get-paid'],
                'body' => <<<'MD'
## Founder

Earn {{founder.min_earnings}} net in your first {{founder.window_days}} days after connecting payouts and you become a Founder — {{founder.seats}} seats in total. Founders then earn {{founder.monthly_pct}} of their monthly earnings, capped at {{founder.monthly_cap}} a month. See [the Founder bonus](/help/money-and-payouts/founder-bonus).

## Fast Start

An early-earnings bonus, paid automatically on qualifying sales in your first period.

## Referral

{{referral.reward}} when a creator you referred starts earning. Your referral link is on your dashboard.

## They pay automatically

Every bonus is paid with a normal payout once it qualifies. There is no claim to make and no approval to wait on.

## What they do not change

A bonus does not alter your fees, your reserve, or your payout schedule. It is added on top.

## Eligibility

Bonus eligibility is set per account. If you believe you qualified and were not paid, contact support with the period — the qualifying figure is calculated from completed sales only, so a refunded or pending payment does not count towards it.
MD,
            ],
            [
                'slug' => 'where-can-i-see-my-earnings',
                'title' => 'Where do I see what I have earned?',
                'audience' => 'creator',
                'keywords' => 'earnings, dashboard, statement, ledger, history, how much have i made, records, export',
                'summary' => 'The financial dashboard — three tabs: where the money sits, payouts, and tax.',
                'related' => ['when-do-i-get-paid', 'vat-and-your-earnings', 'my-payout-was-smaller-than-expected'],
                'body' => <<<'MD'
Your **financial dashboard** answers three separate questions, one per tab.

## Overview — where the money is

Your next payout, and the three things that explain it: clearing, reserve held, and awaiting delivery. Plus earnings over time and which products earn most.

## Payouts — how it was worked out

The payable calculation, the schedule, per-status buckets, bonuses, and every past payout with its date and amount.

## Tax — your records

Tax-year totals, per-transaction VAT, and downloadable statements as PDF or CSV for any month, tax year, or a custom range.

## Every figure traces to a transaction

Nothing on the dashboard is an estimate. Every number is a sum of ledger rows you can open individually and see the full fee breakdown of.

## Which listings are working

The **Opportunities** page answers the other half: which listings people look at and do not buy, which nobody finds, and where your buyers came from.
MD,
            ],
            [
                'slug' => 'can-i-be-paid-faster',
                'title' => 'Can I be paid before Friday?',
                'audience' => 'creator',
                'keywords' => 'early payout, faster, instant payout, advance, urgent, need money now, weekly',
                'summary' => 'No. Payouts run weekly on {{payout.day}} and the schedule is the same for everyone.',
                'related' => ['when-do-i-get-paid', 'why-is-some-of-my-money-held'],
                'body' => <<<'MD'
**No.** Payouts run on {{payout.day}}, weekly, and it is the same schedule for every creator on the platform. There is no early-payout option and no way to request one.

## Why it is fixed

The {{payout.hold_days}}-day hold and the reserve exist to cover disputes and refunds, which arrive after a sale rather than with it. Paying out sooner would mean paying out money that may still have to go back — and covering that is what keeps payments switched on for everybody.

## What you can control

- **Deliver promptly.** A Paid Request is not payable until it is accepted; a physical order is not payable until delivery is confirmed. Both are entirely in your hands.
- **Keep disputes down.** A risk-based reserve traces almost entirely to dispute history.

## The one exception

A payout that failed is retried in the next run, not the following week. That is a retry, not an early payment.
MD,
            ],
        ];
    }

    private static function checkout(): array
    {
        return [
            [
                'slug' => 'what-currency-am-i-charged-in',
                'title' => 'What currency am I charged in?',
                'audience' => 'both',
                'keywords' => 'currency, exchange rate, foreign, conversion, gbp, usd, eur, my currency, fx',
                'summary' => 'You are charged in the creator\'s currency. Prices are shown in yours for comparison.',
                'related' => ['why-is-the-total-more-than-the-price', 'card-or-bank'],
                'body' => <<<'MD'
Prices are **displayed** in your chosen currency so you can compare them, and the **charge** is made in the creator's currency.

## Your bank may convert

If the creator's currency is not yours, your bank does the conversion and may add its own fee. That fee is your bank's, not ours, and it is why the amount on your statement can differ slightly from the total on screen.

## Which currency you see

Set your display currency in your settings, or it is guessed from where you are. It affects what you see, never what a creator receives.

## Creators

You set the currency you sell in and you are paid in it. Supporters see their own equivalent, and the exchange rates used for that are updated regularly.

## The total is always shown before you pay

Whatever the currency, the exact amount that will be charged is on screen before you enter any payment details.
MD,
            ],
            [
                'slug' => 'i-was-charged-twice',
                'title' => 'I think I have been charged twice',
                'audience' => 'both',
                'keywords' => 'charged twice, double charge, duplicate payment, two payments, overcharged, refund duplicate',
                'summary' => 'Usually a pending authorisation that clears on its own. If both are settled, contact us — a genuine duplicate is refunded.',
                'related' => ['why-was-my-payment-declined', 'refunds-and-cancellations'],
                'body' => <<<'MD'
## Check whether both are settled

A declined or abandoned attempt often leaves a **pending authorisation** on your statement. It is not money taken and it disappears on its own, usually within a few working days. Two pending lines and one purchase is the common case.

## If both have settled

Contact us with the date and amount of both. A genuine duplicate is refunded — you are not asked to argue for it.

## Renewals

A Membership or a Bill charges once per period. If you see two in one period, tell us: that is not something that should be possible and it is worth us knowing about.

## What causes it

Most often, retrying a payment that had actually succeeded. If a payment screen does not confirm, check your purchases before paying again — a second attempt is a second purchase.
MD,
            ],
            [
                'slug' => 'why-do-i-need-an-account-for-this-purchase',
                'title' => 'Why does this purchase need an account?',
                'audience' => 'supporter',
                'keywords' => 'login required, account needed, sign up to buy, cannot checkout as guest, why login',
                'summary' => 'Anything you can renew, cancel, track or raise a problem about needs somewhere to live.',
                'related' => ['do-i-need-an-account-to-buy', 'refunds-and-cancellations'],
                'body' => <<<'MD'
Memberships, Bills, Paid Requests and Shop purchases require an account. Piggy Pot contributions and Wishes do not.

## The reason

Each of the first four is something you will want to come back to — renew it, cancel it, track its delivery, accept a completed request, or raise a problem. Without an account there is nothing to attach that to, and "email us and we will find it" is a worse experience than signing up.

## The card verification step

Once your lifetime spend passes {{gifter.verification_threshold}}, a one-off {{gifter.verification_charge}} card verification is required before further purchases. It confirms the card is yours, and the amount is stated before you pay it.

## Guest purchases you have already made

They are still yours. Use **Find my purchase** with the email you paid with; making an account later does not automatically attach them.
MD,
            ],
            [
                'slug' => 'the-creator-cannot-take-payments',
                'title' => 'It says this creator cannot take payments',
                'audience' => 'supporter',
                'keywords' => 'cannot buy, creator paused, unavailable, page paused, cannot take payments, not accepting',
                'summary' => 'Their page is paused. It is usually temporary and there is nothing wrong with your payment.',
                'related' => ['why-was-my-payment-declined', 'how-do-i-find-creators'],
                'body' => <<<'MD'
The creator's page is paused, so nothing on it can be bought right now.

## What it is not

It is not a problem with your card, your account or your payment. Nothing was attempted.

## Why we do not say more

The reason belongs to the creator's account and is theirs to know, not ours to publish. They are told exactly what it is and what to do about it.

## Is it permanent?

Usually not. Most pauses clear once the creator completes something on their side, and the page comes back on its own.

## What you can do

- Follow them, so you are told when they publish again.
- If you were part-way through something — an unfinished order or a request in progress — contact us and we will tell you where it stands.
MD,
            ],
        ];
    }

    private static function contentRules(): array
    {
        return [
            [
                'slug' => 'why-was-my-photo-rejected',
                'title' => 'Why was my photo or banner rejected?',
                'audience' => 'creator',
                'keywords' => 'photo rejected, avatar refused, banner declined, image not approved, moderation, flagged image',
                'summary' => 'The reason is on the item itself, naming which image it was. Replace that one and it goes back into review automatically.',
                'related' => ['what-content-is-allowed', 'why-is-my-profile-still-in-review', 'why-is-my-listing-under-review'],
                'body' => <<<'MD'
The reason is shown against the image itself and names **which** one — a listing can have both a cover image and a paid file, and both are checked.

## What it means

Either the automatic scan flagged it, or a person reviewed it and it does not meet the [content rules](/help/content-rules/what-content-is-allowed).

## Fixing it

Replace that one image. It goes back into review automatically and nothing else about the item is affected.

## If you think it is wrong

The automatic scan is tuned to avoid false positives — swimwear, gym photos and combat sports pass. It is not perfect. Contact support with the item and a person will look; nothing is deleted for being flagged, so there is nothing to recover.

## Why we do not quote the exact label

The scan returns a probabilistic guess, and repeating a raw machine label reads as an accusation when it is wrong. What you get instead is the category and what to change.
MD,
            ],
            [
                'slug' => 'can-i-link-to-my-other-platforms',
                'title' => 'Can I link to my other platforms?',
                'audience' => 'creator',
                'keywords' => 'external links, other platforms, onlyfans, link in bio, redirect, off platform, social links',
                'summary' => 'Your verified social accounts, yes. Sending buyers off-platform to pay you, no.',
                'related' => ['what-content-is-allowed', 'words-you-cannot-use'],
                'body' => <<<'MD'
## Your social accounts

Yes. Twitter, Instagram and TikTok can be added and verified, and they are part of how your profile is reviewed.

## Links in your bio

Reviewed alongside everything else. A link that takes a supporter somewhere to pay you outside the platform is refused — that is a supporter the platform cannot protect, cannot refund and cannot resolve a dispute for, and it is the arrangement that gets creator platforms cut off from payments.

## Contact details in a bio

Discouraged, and flagged in review. A supporter who contacts you off-platform loses every protection the purchase gave them.

## Links as a paid reward

Allowed, and common. They must be https, and link shorteners are refused — a shortener hides the destination from the supporter and from review, which is the whole reason to use one.

## Adult work elsewhere

Your business. What you publish **here** has to meet the [content rules](/help/content-rules/what-content-is-allowed); what you do elsewhere is not our concern.
MD,
            ],
            [
                'slug' => 'who-reviews-my-content',
                'title' => 'Who reviews my content, and how long does it take?',
                'audience' => 'creator',
                'keywords' => 'review time, how long, moderation queue, who checks, approval time, waiting for review',
                'summary' => 'An automatic scan first, then a person. You are notified on every decision — you never need to check back.',
                'related' => ['why-is-my-listing-under-review', 'what-content-is-allowed', 'why-was-my-photo-rejected'],
                'body' => <<<'MD'
## Two stages

1. **An automatic scan** of images and files, and a check of your words against the content rules. This takes seconds.
2. **A person.** Everything a creator publishes for sale is seen by a human before it goes live.

## How long

Items are reviewed in the order they arrive. You get an email and a notification on every decision, so there is nothing to watch and nothing to refresh.

## What you can do meanwhile

Everything except sell. Set up listings, write posts, connect payouts, edit your profile.

## Why we do it this way

It is the reason this platform's payments stay switched on when other creator platforms lose theirs. That protects every creator here, including the ones waiting.

## If something has been waiting unusually long

Contact support with the item. Occasionally something gets stuck rather than judged, and that is worth telling us about.
MD,
            ],
        ];
    }

    private static function account(): array
    {
        return [
            [
                'slug' => 'i-cannot-sign-in',
                'title' => 'I cannot sign in',
                'audience' => 'both',
                'keywords' => 'cannot login, forgot password, locked out, reset password, sign in problem, no access, wrong password',
                'summary' => 'Reset your password from the sign-in page. The newest link is the only one that works, and it expires quickly.',
                'related' => ['two-factor-and-passkeys', 'i-signed-up-with-google'],
                'body' => <<<'MD'
## Reset your password

Use **Forgot password** on the sign-in page. You will be emailed a link.

- **Only the newest link works.** Requesting a second one cancels the first, so use the most recent email.
- **It expires quickly** — deliberately, because it changes access to your account.

## Nothing arrived

Check spam. If it still has not, the address may be different from the one on the account — try the other addresses you use.

## You signed up with Google

You may have no password at all. Use "Sign in with Google", or set a password through Forgot password so you have a second way in.

## Two-factor

If you have lost your authenticator, contact support. You will be asked to confirm your identity, which is the entire point of it — there is no self-service route around it.

## Suspended accounts

A suspended account refuses sign-in and support will tell you why. See [my account has been suspended](/help/getting-started-creators/my-account-was-suspended).
MD,
            ],
            [
                'slug' => 'i-signed-up-with-google',
                'title' => 'I signed up with Google',
                'audience' => 'both',
                'keywords' => 'google, sign in with google, oauth, social login, no password, google account',
                'summary' => 'You have no password by default. Set one through Forgot password so you have a second way in.',
                'related' => ['i-cannot-sign-in', 'two-factor-and-passkeys'],
                'body' => <<<'MD'
Signing up with Google means no password was ever created.

## Set one anyway

Use **Forgot password** with the same email. It gives you a second way in if you ever lose access to the Google account, and it costs nothing to have.

## Two-factor still applies

If you have two-factor turned on, it is asked for after Google as well. Signing in with Google is not a way around it.

## Nothing is skipped

Signing up with Google skips the password and the bot check — nothing else. Every other rule applies: country, terms, account limits, and profile review for creators.

## Your email

Google confirmed it, so your address is already verified and there is no confirmation email to look for.
MD,
            ],
            [
                'slug' => 'delete-my-account',
                'title' => 'Deleting your account',
                'audience' => 'both',
                'keywords' => 'delete account, close account, remove data, gdpr, erase, cancel account, quit',
                'summary' => 'Contact support. Some records have to be kept for tax and dispute reasons, and we will say which.',
                'related' => ['email-preferences', 'refunds-and-cancellations'],
                'body' => <<<'MD'
Contact support from the address on the account.

## Do this first

- **Cancel active subscriptions.** Deleting an account does not stop a recurring payment you set up.
- **Download anything you want to keep.** Purchases and receipts go with the account.
- **Creators: wait for your final payout.** Earnings already recorded are still paid, but it is far simpler before deletion than after.

## What cannot be deleted

Payment records are kept for the period tax and financial rules require, and for as long as a dispute could still be raised. This is a legal obligation, not a preference — we will tell you exactly what is retained and for how long.

## If you only want the emails to stop

You do not need to delete anything. Every optional email can be switched off individually — see [which emails can I turn off](/help/account-and-security/email-preferences).
MD,
            ],
            [
                'slug' => 'why-am-i-not-getting-notifications',
                'title' => 'I am not getting notifications',
                'audience' => 'both',
                'keywords' => 'notifications, not receiving, push, email not arriving, missing alerts, bell, no emails',
                'summary' => 'Check your email preferences, your spam folder, and browser permission for push.',
                'related' => ['email-preferences', 'i-cannot-sign-in'],
                'body' => <<<'MD'
## Email

1. Check your **email preferences** — each category is a separate switch.
2. Check spam, and mark us as not spam if you find us there. That is what stops it recurring.
3. Confirm the address on your account is the one you are checking.

Receipts, payment confirmations and security emails always send and have no switch. If one of those has not arrived, tell us — that is a fault, not a setting.

## Push

Push needs browser permission. If you refused it once, your browser will not ask again — you have to allow it in your browser or device settings for this site.

## The bell

In-app notifications are always there whether or not email and push are on, so the bell is the reliable place to check.

## If nothing at all arrives

Tell us roughly when you expected something and what for. We keep a delivery record of every message and can see whether it was sent, skipped or failed — which is usually the entire answer.
MD,
            ],
        ];
    }

    private static function purchases(): array
    {
        return [
            [
                'slug' => 'my-content-has-not-arrived',
                'title' => 'I paid but my content has not arrived',
                'audience' => 'supporter',
                'keywords' => 'not received, no content, paid but nothing, missing download, where is my file, not delivered',
                'summary' => 'Four causes: a payment still clearing, a custom request in progress, an email that did not arrive, or a genuine problem.',
                'related' => ['i-cannot-find-my-purchase', 'my-payment-says-processing', 'refunds-and-cancellations'],
                'body' => <<<'MD'
## 1. The payment is still clearing

Bank payments can take a day or two. You would see the item with a note saying it unlocks when your bank confirms. Nothing is wrong — see [my payment says processing](/help/payments-and-checkout/my-payment-says-processing).

## 2. It is a Paid Request

Custom work is made after you order. The creator has a deadline; if they miss it, you are refunded automatically without having to ask.

## 3. The email did not arrive

Check spam. Everything you bought is also on your purchases screen permanently — and if you bought as a guest, use **Find my purchase** with the email you paid with.

## 4. Something is genuinely wrong

Open the purchase and choose **Problem with this?**. That attaches your message to the exact payment, which is what lets it be resolved quickly.

## Physical products

A parcel shows its courier and tracking number once the creator marks it sent.
MD,
            ],
            [
                'slug' => 'the-content-was-not-what-was-described',
                'title' => 'What I received was not what was described',
                'audience' => 'supporter',
                'keywords' => 'not as described, wrong content, misleading, poor quality, not what i paid for, complaint',
                'summary' => 'Raise it on the purchase itself. Every listing has to state what you receive, so a mismatch is something we can check.',
                'related' => ['refunds-and-cancellations', 'report-a-problem', 'what-am-i-actually-buying'],
                'body' => <<<'MD'
Open the purchase and choose **Problem with this?**.

## Why it can be checked

Every listing on this platform has to state what the buyer receives, before payment. That description is recorded with your purchase, so "what was promised" is not a matter of recollection on either side.

## What happens

The creator is asked to respond. Most cases are resolved between you within a day or two. If they are not, we look at what was listed against what was delivered.

## Digital content

If you asked for immediate access, you agreed at checkout to give up your 14-day right to cancel — that is stated on the checkout screen and recorded with the purchase. It does **not** cover content that was not what was described, which is a different matter entirely.

## Please raise it here first

A chargeback takes weeks, and it costs the creator money even when they delivered exactly what they listed. Asking us is faster for you and fairer to them.
MD,
            ],
            [
                'slug' => 'how-do-i-cancel-a-membership',
                'title' => 'How do I cancel a Membership or a Bill?',
                'audience' => 'supporter',
                'keywords' => 'cancel membership, stop subscription, unsubscribe, end subscription, stop paying, cancel bill',
                'summary' => 'Cancel from My Purchases. Access runs to the end of the period you have paid for, and you can resume before it ends.',
                'related' => ['refunds-and-cancellations', 'i-cannot-find-my-purchase'],
                'body' => <<<'MD'
**My Purchases → the subscription → Cancel.**

## What happens

- Nothing further is taken.
- **Your access runs to the end of the period you have already paid for** — you keep what you paid for.
- The subscription stays in your list, marked as ending, with the date.

## Changing your mind

**Resume** before that date and it continues as the same subscription. You do not lose your history or restart anything.

## Refunds

Cancelling stops future payments; it does not refund the current period. If there is a reason the current period should be refunded, raise it on the purchase — that is a separate question and it is looked at separately.

## If a creator has stopped posting

Bills and Memberships pause collection automatically when a creator stops delivering content. You are not charged while that is the case, and you keep your access.
MD,
            ],
            [
                'slug' => 'can-i-buy-for-someone-else',
                'title' => 'Can I buy something for someone else?',
                'audience' => 'supporter',
                'keywords' => 'buy for someone, another person, transfer, share content, someone else, on behalf of',
                'summary' => 'You can pay, but the content is delivered to you. It is not transferable to another account.',
                'related' => ['what-am-i-actually-buying', 'do-i-need-an-account-to-buy'],
                'body' => <<<'MD'
You can make the payment, but what you buy is delivered to **you** — to the email you paid with, or to your account.

## Not transferable

Purchases are not moved between accounts. A Membership belongs to the account that bought it, and a paid file is delivered to the buyer.

## Why

Every purchase carries a delivery record, and that record is what resolves a dispute and what proves the content was received. Moving a purchase between people breaks the one thing that protects both sides.

## What you can do

Share the creator's link. Anything on this platform can be bought as a guest or with an account, so there is nothing standing in the way of someone buying it themselves.

## Piggy Pots

A Piggy Pot is the closest thing to buying together: several people buy into one content product, and everyone who contributes receives it.
MD,
            ],
        ];
    }

    private static function trust(): array
    {
        return [
            [
                'slug' => 'someone-is-impersonating-me',
                'title' => 'Someone is impersonating me',
                'audience' => 'both',
                'keywords' => 'impersonation, fake account, pretending to be me, stolen identity, copycat, fake profile',
                'summary' => 'Report it and contact support with both profiles. Impersonation is treated urgently.',
                'related' => ['report-a-problem', 'my-content-is-being-sold-by-someone-else'],
                'body' => <<<'MD'
Report the profile, then contact support with a link to it and to your own.

## What we check

Every creator on this platform is identity-verified with a passport before they can earn anything, and their profile is reviewed by a person. That makes impersonation harder here than in most places, and it makes it faster to resolve when it happens.

## Treated urgently

Impersonation affects your income and your name, and it is not left in an ordinary queue.

## What helps

- Links to both profiles.
- Anything that shows the account is yours elsewhere — the verified socials on your profile are usually enough.

## If money has already been taken

Say so. Supporters who paid an impersonator are affected too, and that changes what we can do for them as well as for you.
MD,
            ],
            [
                'slug' => 'my-content-is-being-sold-by-someone-else',
                'title' => 'My content is being sold by someone else',
                'audience' => 'creator',
                'keywords' => 'stolen content, copyright, dmca, reupload, my photos, infringement, someone selling my work',
                'summary' => 'Use the copyright process, not a general report — it needs specific information to act on.',
                'related' => ['report-a-problem', 'someone-is-impersonating-me'],
                'body' => <<<'MD'
Use the **copyright process**, not the general report button. A copyright claim has to carry specific information before it can be acted on, and the report form does not collect it.

## What is needed

- Where your work is being sold here.
- Where the original is, or how you can show it is yours.
- A statement that you hold the rights.

## What happens

Content that appears to infringe is taken out of sale while it is looked at. It is not deleted on the strength of one claim — a report is not a verdict — but it stops being sold immediately.

## While you wait

Do not contact the other creator through the platform to resolve it. Let the process run; anything said between you can complicate a claim that would otherwise have been straightforward.

## If it is off-platform

We can only act on what is sold here. For anywhere else, the host is who you need.
MD,
            ],
            [
                'slug' => 'is-this-message-really-from-you',
                'title' => 'Is this email really from Spenny Piggy?',
                'audience' => 'both',
                'keywords' => 'phishing, scam email, fake email, suspicious, is this real, fraud email, spoof',
                'summary' => 'We never ask for your password, your full card number or a payment by transfer. If in doubt, do not click — sign in directly.',
                'related' => ['two-factor-and-passkeys', 'report-a-problem'],
                'body' => <<<'MD'
## We never ask for

- Your password. Ever, by any channel.
- Your full card number.
- A payment by bank transfer, cryptocurrency or gift card.
- Remote access to your device.

If a message asks for any of those, it is not us.

## Checking safely

Do not click the link. Open the site yourself and sign in — anything genuine is waiting for you there. Every payment, payout and account change is visible in your account, so nothing real ever depends on a link in an email.

## Payouts

We never ask you to confirm payout details by email. Payout details are only ever changed by you, signed in, through your Stripe setup.

## If you clicked

Change your password, turn on two-factor if it is not already on, and tell us. Speed matters more than certainty here — tell us on a maybe.

## Forward it

Send it to support so we can warn other people. Suspicious messages usually go to many accounts at once.
MD,
            ],
        ];
    }
}
