<?php

namespace Database\Seeders;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Services\Help\HelpContent;
use App\Support\HelpTokens;
use Database\Seeders\Help\ExtraArticles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

/**
 * The initial help centre content.
 *
 * 🚨 IDEMPOTENT, AND IT NEVER OVERWRITES AN ADMIN EDIT. A row whose `edited_at`
 * is set was changed by a human through the (future) admin CMS and is left
 * alone. Re-running this seeder adds what is missing and refreshes what nobody
 * has touched — so content can live in git today and move to the CMS later
 * without the two fighting.
 *
 * 🚨 THIS COPY IS A STRIPE-FACING PUBLIC SURFACE. The content-first ban list
 * applies in full: no gift, tip, donation, fundraise, "help with my bills",
 * "buy me a coffee", or brand names. ("Bills" as the name of the recurring
 * content product is fine — that is a feature name, and NoExpenseOrBrandName
 * deliberately does not block the bare word.)
 *
 * 🚨 NEVER TYPE A PRICE, RATE, THRESHOLD OR SEAT COUNT INTO A BODY. Use a
 * {{token}} — see App\Support\HelpTokens. The homepage FAQ published an 8% fee
 * and a £29.99/mo price for a year because they were typed by hand.
 *
 * ⚠️ No supporter-fee PERCENTAGE appears anywhere below, deliberately. Rates
 * differ per payment method AND per creator (bespoke agreements), so any single
 * figure is wrong for someone — the same rule the pricing section and the ad
 * landing pages follow. Explain the model, not a number.
 */
class HelpCentreSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('help_categories') || ! Schema::hasTable('help_articles')) {
            $this->command?->warn('Help centre tables not present — run migrations first.');

            return;
        }

        $unknown = [];

        foreach ($this->categories() as $order => $category) {
            $model = HelpCategory::updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'title' => $category['title'],
                    'summary' => $category['summary'],
                    'icon' => $category['icon'],
                    'audience' => $category['audience'],
                    'sort_order' => $order,
                    'is_published' => true,
                ]
            );

            // Additional articles live in their own file so this one stays
            // readable as the corpus grows. Same shape, same rules.
            $articles = array_merge(
                $category['articles'],
                ExtraArticles::forCategory($category['slug'])
            );

            foreach ($articles as $i => $article) {
                $unknown = array_merge(
                    $unknown,
                    HelpTokens::unknown($article['body']),
                    HelpTokens::unknown($article['summary'])
                );

                $existing = HelpArticle::withTrashed()->where('slug', $article['slug'])->first();

                // A human has edited this through the CMS — leave their words
                // alone. Only the filing (category, order) is kept in step.
                if ($existing && $existing->edited_at) {
                    $existing->forceFill([
                        'help_category_id' => $model->id,
                        'sort_order' => $i,
                    ])->saveQuietly();

                    continue;
                }

                HelpArticle::updateOrCreate(
                    ['slug' => $article['slug']],
                    [
                        'help_category_id' => $model->id,
                        'title' => $article['title'],
                        'summary' => $article['summary'],
                        'body' => $article['body'],
                        'keywords' => $article['keywords'],
                        'audience' => $article['audience'],
                        'sort_order' => $i,
                        'status' => HelpArticle::STATUS_PUBLISHED,
                        'published_at' => now(),
                        'feature_flag' => $article['feature_flag'] ?? null,
                        'related_slugs' => $article['related'] ?? null,
                    ]
                );
            }
        }

        HelpContent::forget();

        $unknown = array_values(array_unique($unknown));

        if ($unknown) {
            // Loud, not silent: an unknown token renders as an empty gap in a
            // sentence on a public page.
            $this->command?->error('Unknown help tokens (they will render as nothing): '.implode(', ', $unknown));
        }

        $this->command?->info('Help centre seeded: '
            .HelpCategory::count().' categories, '
            .HelpArticle::count().' articles.');
    }

    /** @return array<int, array<string, mixed>> */
    private function categories(): array
    {
        return [
            [
                'slug' => 'getting-started-creators',
                'title' => 'Getting started — creators',
                'summary' => 'Everything between signing up and your first sale, in the order it happens.',
                'icon' => '🚀',
                'audience' => 'creator',
                'articles' => $this->creatorStartArticles(),
            ],
            [
                'slug' => 'getting-started-supporters',
                'title' => 'Getting started — supporters',
                'summary' => 'Buying from a creator, with or without an account.',
                'icon' => '🎯',
                'audience' => 'supporter',
                'articles' => $this->supporterStartArticles(),
            ],
            [
                'slug' => 'selling',
                'title' => 'Selling',
                'summary' => 'What you can sell, what a supporter receives, and how a listing goes live.',
                'icon' => '🏷️',
                'audience' => 'creator',
                'articles' => $this->sellingArticles(),
            ],
            [
                'slug' => 'money-and-payouts',
                'title' => 'Money and payouts',
                'summary' => 'When you are paid, what is deducted, and why some of it waits.',
                'icon' => '💷',
                'audience' => 'creator',
                'articles' => $this->moneyArticles(),
            ],
            [
                'slug' => 'payments-and-checkout',
                'title' => 'Payments and checkout',
                'summary' => 'Paying by card or bank, what the total is made of, and payments that are still clearing.',
                'icon' => '💳',
                'audience' => 'both',
                'articles' => $this->checkoutArticles(),
            ],
            [
                'slug' => 'content-rules',
                'title' => 'Content rules and review',
                'summary' => 'What is allowed, why something is held, and the posting rule that keeps subscriptions running.',
                'icon' => '🛡️',
                'audience' => 'creator',
                'articles' => $this->contentRulesArticles(),
            ],
            [
                'slug' => 'account-and-security',
                'title' => 'Account and security',
                'summary' => 'Signing in, two-factor, and the emails you receive.',
                'icon' => '🔐',
                'audience' => 'both',
                'articles' => $this->accountArticles(),
            ],
            [
                'slug' => 'my-purchases',
                'title' => 'My purchases',
                'summary' => 'Finding what you bought, refunds, and items that sold out.',
                'icon' => '📦',
                'audience' => 'supporter',
                'articles' => $this->purchasesArticles(),
            ],
            [
                'slug' => 'trust-and-safety',
                'title' => 'Trust and safety',
                'summary' => 'Disputes, chargebacks and reporting a problem.',
                'icon' => '⚖️',
                'audience' => 'both',
                'articles' => $this->trustArticles(),
            ],
        ];
    }

    private function creatorStartArticles(): array
    {
        return [
            [
                'slug' => 'how-do-i-start-selling',
                'title' => 'How do I start selling?',
                'audience' => 'creator',
                'keywords' => 'get started, setup, onboarding, new creator, begin, first steps, sign up',
                'summary' => 'Six steps, in this order: profile → card on file → payouts → identity → first listing → first sale.',
                'related' => ['why-is-my-profile-still-in-review', 'what-does-the-subscription-cost', 'connect-your-payouts'],
                'body' => <<<'MD'
Setting up runs in a fixed order, and each step unlocks the next. Your dashboard always shows the one step you are on, so you never have to remember where you got to.

## 1. Your profile

Add a photo, a banner and a bio. A real person reviews all three before they go public — that review is part of why this platform's payments stay switched on.

## 2. Card on file

Add a card for the creator subscription. Nothing is charged {{subscription.when_charged}} — see [what the subscription costs](/help/getting-started-creators/what-does-the-subscription-cost).

## 3. Connect your payouts

Set up your Stripe account so money can reach your bank. This is your own account, in your name.

## 4. Verify your identity

A passport check through Stripe Identity. It happens after payouts are connected, not before.

## 5. Publish your first listing

You cannot put anything up for sale until identity verification is done. Browsing the whole platform before that is fine — only publishing is blocked.

## 6. Your first sale

This is the step that starts your subscription billing, and it is the point at which the platform starts earning anything from you at all.

If a step says it is being reviewed, there is nothing for you to do — you will be told when it clears.
MD,
            ],
            [
                'slug' => 'why-is-my-profile-still-in-review',
                'title' => 'Why is my profile still in review?',
                'audience' => 'creator',
                'keywords' => 'profile review, pending, approval, avatar, banner, bio, waiting, not approved',
                'summary' => 'Photos, banner and bio are each checked by a person. Until they clear, the public sees a placeholder — you still see your own upload.',
                'related' => ['how-do-i-start-selling', 'what-content-is-allowed'],
                'body' => <<<'MD'
Every profile photo, banner and bio is reviewed by a real person before it is shown publicly. That is deliberate: it is a large part of why this platform's payments stay switched on when other creator platforms lose theirs.

## What you see versus what everyone else sees

**You always see your own upload.** Nobody else does until it is approved. If your photo looks right to you but a friend sees a placeholder, that is review in progress, not a failed upload.

## How long it takes

Assets are reviewed in the order they arrive. You will get an email and a notification the moment a decision is made — you do not need to check back.

## If something is refused

You will be told which asset it was and why, in plain words. Replace just that one thing and it goes back into review automatically. Nothing else on your profile is affected.

## Editing something already approved

An edit to a live photo, banner or bio does **not** take the current version down. The public keeps seeing the approved version until the new one clears review, and rejecting the change simply leaves your existing one in place.
MD,
            ],
            [
                'slug' => 'what-does-the-subscription-cost',
                'title' => 'What does the creator subscription cost?',
                'audience' => 'creator',
                'keywords' => 'subscription, price, cost, monthly, billing, charge, free, cancel, vat',
                'summary' => '{{subscription.price}} + VAT a month, flat, whatever you earn — charged {{subscription.when_charged}}.',
                'related' => ['how-do-i-start-selling', 'what-fees-are-deducted', 'when-do-i-get-paid'],
                'body' => <<<'MD'
**{{subscription.price}} + VAT a month — {{subscription.total}} in total.** Flat, whatever you earn, and you can cancel at any time. There is no exit fee.

## When you are charged

Billing starts {{subscription.when_charged}}. Your card is collected at the same point in setup either way, but it is not charged until then.

## Why we take the card before charging it

The card is the filter that keeps automated sign-ups away from identity verification, which costs the platform money on every check, and away from the review queue. It is not a hold on your funds — nothing is taken.

## Cancelling

Cancel before you have ever been charged and it stops immediately, with nothing owed. Cancel after a period has been paid for and your access runs to the end of that period.

## What this is not

This is not a commission. There is no percentage of your sales taken as a subscription fee — the two are separate things, and [the fees at checkout](/help/money-and-payouts/what-fees-are-deducted) work differently.
MD,
            ],
            [
                'slug' => 'connect-your-payouts',
                'title' => 'Connecting your payouts',
                'audience' => 'creator',
                'keywords' => 'stripe, connect, bank account, payouts, onboarding, express, account setup',
                'summary' => 'Payouts run through your own Stripe account, in your name. Setting it up is a form Stripe hosts, not us.',
                'related' => ['when-do-i-get-paid', 'verify-your-identity', 'stripe-is-asking-for-something'],
                'body' => <<<'MD'
Money reaches you through a Stripe account that belongs to **you**, in your name. We never hold your earnings in an account of ours.

## What Stripe asks for

Your legal name, date of birth, address and bank details. Some of it is prefilled from what you have already given us; the rest Stripe collects on its own hosted form.

## Why we do not prefill your name

Your display name here can be anything — a stage name, a shop name. Stripe runs an identity check against the name you enter, so a confidently wrong prefill would fail that check days later with nothing on screen explaining why. An empty field you fill in correctly is better.

## If you close the form halfway

Come back to the same page and it says **Resume Stripe setup**. Your account already exists, so you are not asked for your country again — that is fixed when the account is created and cannot be changed afterwards.

## If Stripe asks for more

Anything Stripe still needs shows on your dashboard, in plain words, with the deadline it has to be done by. Creators rarely open the Stripe dashboard, so everything Stripe wants is repeated where you actually are.
MD,
            ],
            [
                'slug' => 'stripe-is-asking-for-something',
                'title' => 'Stripe is asking me for something',
                'audience' => 'creator',
                'keywords' => 'action required, stripe requirements, document rejected, past due, restricted, payouts disabled, deadline, verification failed',
                'summary' => 'Everything Stripe still needs is shown on your dashboard, in plain words, with the date it has to be done by.',
                'related' => ['connect-your-payouts', 'verify-your-identity', 'when-do-i-get-paid'],
                'body' => <<<'MD'
Creators do not open the Stripe dashboard, so anything Stripe still wants is repeated on **your** dashboard where you actually are.

## One problem, one panel

A single underlying issue used to produce several identical-looking warnings. Now there is one card naming the actual state, and additional cards only when they say something genuinely different.

## What the card tells you

- **What is missing**, in words rather than field names — "your bank account for payouts", not `external_account`.
- **Why a document was refused**, in Stripe's own wording. If it says the image was unreadable, that is the real reason — re-uploading the same photo will fail again.
- **The deadline.** This is the date payments get switched off, and it turns red inside the last week.

## "Being reviewed" is not a task

If the card says pending verification or under review, there is genuinely nothing to do. It is styled differently from a card that needs you precisely so the two are not confused.

## Charges working but payouts not

These are separate. You can be able to take money while being unable to withdraw it — usually a missing or rejected bank account. The card says which.

## If it cannot be fixed from here

Some account states cannot be resolved by finishing a form. In those cases there is no button, because there is nothing a form would do — the card points you at support instead of sending you round a loop.
MD,
            ],
            [
                'slug' => 'verify-your-identity',
                'title' => 'Verifying your identity',
                'audience' => 'creator',
                'keywords' => 'identity, passport, kyc, verification, id check, stripe identity, rejected',
                'summary' => 'A passport check through Stripe Identity, after payouts are connected. You cannot publish a listing until it passes.',
                'related' => ['connect-your-payouts', 'how-do-i-start-selling'],
                'body' => <<<'MD'
Identity verification is a passport check run by Stripe Identity. It happens **after** you have connected payouts, not before.

## What it blocks

Publishing a listing. Nothing else — you can browse the entire platform, set up your profile and connect your payouts while it is outstanding.

## Why it comes after payouts

Each check costs the platform money. Connect onboarding costs nothing and already asks for bank details and Stripe's own checks, so running identity after it means we are only paying for checks on creators who are genuinely set up.

## If it does not pass

You are told what went wrong in words you can act on — an unreadable photo, a document that has expired, a selfie that did not match. Retry from the same screen with the problem fixed.

Some outcomes cannot be retried. In those cases the message says so and points you at support instead of sending you round a loop.

## While it is being checked

You will see "being reviewed". There is nothing to do and nothing to resubmit — starting a second check does not make the first one finish faster.
MD,
            ],
        ];
    }

    private function supporterStartArticles(): array
    {
        return [
            [
                'slug' => 'do-i-need-an-account-to-buy',
                'title' => 'Do I need an account to buy something?',
                'audience' => 'supporter',
                'keywords' => 'guest checkout, account, sign up, login required, buy without account',
                'summary' => 'Not always. Some purchases work as a guest; the ones you can renew or cancel need an account so they can be managed.',
                'related' => ['i-cannot-find-my-purchase', 'card-or-bank'],
                'body' => <<<'MD'
It depends on what you are buying.

## You can buy as a guest

- **Piggy Pot** contributions
- **Wishes**

You give an email address at checkout and the content is sent there.

## You need an account

- **Memberships**
- **Bills** (a recurring content subscription)
- **Paid Requests**
- **Shop** purchases

These are all things you may later want to renew, cancel, track delivery on, or raise a problem about. Without an account there is nothing to attach that to.

## If you bought as a guest and lost the email

Use [Find my purchase](/help/my-purchases/i-cannot-find-my-purchase). Enter the address you paid with and we email you a link back to everything you bought with it.

## Making an account later

Signing up afterwards with the same email address does not automatically attach older guest purchases. The purchase lookup above is the way to reach them.
MD,
            ],
            [
                'slug' => 'what-am-i-actually-buying',
                'title' => 'What am I actually buying?',
                'audience' => 'supporter',
                'keywords' => 'what do i get, reward, deliverable, content, exclusive, unlock, what you get',
                'summary' => 'Every paid item on this platform has to say what you receive in return, before you pay.',
                'related' => ['do-i-need-an-account-to-buy', 'i-cannot-find-my-purchase'],
                'body' => <<<'MD'
Every sellable item here answers one question in the same place: **what do you get?**

You will see the answer on the item's card, on the checkout screen, and again on your receipt. It is one of three things:

- **A file** — a photo set, a video, a document, a download.
- **A message** — written content the creator has prepared.
- **A link** — access to something the creator hosts.

Recurring items (Memberships and Bills) add ongoing access to subscriber-only posts on top of that.

## Before you pay

You see the headline and the description of what you are buying. You do **not** see the content itself — that is the thing being sold.

## After you pay

The content appears on the thank-you page and in your receipt email. If you have an account it is also in [My Purchases](/my-purchases) permanently.

## If a payment is still clearing

Bank payments can take a day or two to confirm. Until they do, you will see the headline and a note that the content unlocks when your bank confirms. Nothing is lost — see [my payment says processing](/help/payments-and-checkout/my-payment-says-processing).
MD,
            ],
        ];
    }

    private function sellingArticles(): array
    {
        return [
            [
                'slug' => 'what-can-i-sell',
                'title' => 'What can I sell?',
                'audience' => 'creator',
                'keywords' => 'products, wishes, shop, paid requests, piggy pot, memberships, bills, piggy bank, ways to earn',
                'summary' => 'Seven ways to be paid — one-off content, custom work, physical goods, group products, and two recurring options.',
                'related' => ['what-is-a-reward', 'why-is-my-listing-under-review', 'price-limits'],
                'body' => <<<'MD'
Seven products, all sold from the same page and the same link.

## Paid once

- **Wishes** — a single piece of content, up to {{price.max.wish}}.
- **Shop** — digital or physical products, up to {{price.max.shop}}.
- **Paid Requests** — custom work you make to order, up to {{price.max.task}}. Money is held until you deliver and the buyer accepts.
- **Piggy Pot** — one content product several people buy into, up to {{price.max.pot}}. It can show a progress goal alongside it.
- **Piggy Bank** — a one-off content purchase.

## Paid every month

- **Memberships** — tiers, each with its own perks bundle, up to {{price.max.membership}} a month.
- **Bills** — one recurring content stream, no tiers and no perks list, up to {{price.max.bill}} a month.

Memberships and Bills are deliberately different products. A Membership sells tiers with a bundle; a Bill sells one stream.

## The minimum

{{price.min}} on everything. Below that the payment processing costs more than the sale is worth.

## What every one of them needs

A reward — the thing the buyer receives. See [what is a reward](/help/selling/what-is-a-reward).
MD,
            ],
            [
                'slug' => 'what-is-a-reward',
                'title' => 'What is a reward, and why does every listing need one?',
                'audience' => 'creator',
                'keywords' => 'reward, deliverable, what the buyer gets, content file, message, link, required',
                'summary' => 'The reward is what the buyer receives. Every paid item must have one — it is what makes the sale a purchase rather than a transfer.',
                'related' => ['what-can-i-sell', 'why-is-my-listing-under-review', 'words-you-cannot-use'],
                'body' => <<<'MD'
Every listing has to answer "what does the supporter get?" — and it answers it the same way whichever product you are selling.

## The three kinds

- **A file** — upload it and it is delivered on payment.
- **A message** — written content, delivered on payment.
- **A link** — https only. Link shorteners are refused, because they hide the destination from both the buyer and from review.

## What the buyer sees before paying

The reward **headline** and its description. Never the content itself — that is what they are paying for.

## Recurring items

Memberships and Bills add ongoing access to subscriber-only posts. A Membership must include at least one on-platform benefit before it can be published; a Bill meets that structurally, because it cannot be published without a subscriber post and its collection pauses if you stop posting.

## Paid Requests

A timed Paid Request cannot offer a file as its reward. The whole point is work you make afterwards, and a pre-uploaded file would be downloadable the moment the buyer pays. Use a message or a link.

## Physical products

A physical Shop product needs no separate reward headline — the parcel is the deliverable and its name already describes it.
MD,
            ],
            [
                'slug' => 'what-should-i-call-my-listing',
                'title' => 'What should I call my listing?',
                'audience' => 'creator',
                // ⚠️ Keywords are server-side only — HelpContent::card() and
                // articlePayload() do not return them, so nothing here is rendered
                // or indexed. That makes this the one correct place for the words
                // people actually type, including the ones the copy itself may not
                // use: someone whose title was refused searches the phrase they
                // wrote, not the phrase we would prefer.
                'keywords' => 'name my listing, name my wish, what to call it, what do I write, reward title, listing title, listing name, wording, headline, naming, describe, coffee, treat, favour, support me',
                'summary' => 'Name it after what the buyer receives. That title is shown on your card, at checkout and on the receipt, so it has to describe the content rather than the payment.',
                'related' => ['words-you-cannot-use', 'what-is-a-reward', 'why-is-my-listing-under-review'],
                'body' => <<<'MD'
Name it after **what the buyer receives**. That one habit keeps you clear of every rule on this page.

## Where that title actually goes

It is not just a label on your own dashboard. The same words appear:

- on the card people browse
- on the last screen before they pay
- on their receipt
- on the record of the payment held by our payment partner

So it is read by the buyer at the moment they decide, and by a reviewer months later working out what was sold. Both need it to say what the thing is.

## Good ones

- "The full behind-the-scenes set"
- "A personalised video message"
- "This month's photo bundle"
- "One hour of custom editing"

Each names a thing. Someone who has never seen your profile knows what arrives.

## The test before you save

Take the money reason out of the title. Does what is left still describe something?

"The full summer set" stands on its own. A title naming a household cost, a favour or a treat does not — remove the money and nothing is left, because nothing was being sold.

## If you want to say what it is for

You can. Wishes and Bills have a separate, optional **goal line** for exactly that — an aspirational note shown on the card and the progress bar, and nowhere else. It never reaches checkout, the pay button, the receipt or a bank statement.

Keep the two apart: the goal line is what you are working towards, the title is what the buyer gets. See [why was my listing title rejected?](/help/content-rules/words-you-cannot-use) for what is refused in either field.

## If you are not sure

Write the sentence you would say to someone who asked "what do I get?" — then cut it down. That answer is almost always the right title, because it is the one thing the field is for.
MD,
            ],
            [
                'slug' => 'why-is-my-listing-under-review',
                'title' => 'Why is my listing under review?',
                'audience' => 'creator',
                'keywords' => 'under review, held, moderation, not live, pending approval, listing hidden, flagged',
                'summary' => 'Every new listing is checked before it goes on sale. Most clear without you doing anything.',
                'related' => ['what-content-is-allowed', 'words-you-cannot-use', 'schedule-a-listing'],
                'body' => <<<'MD'
Every new listing is created unpublished and checked before it can be bought. There are two different states and they mean different things.

## "Waiting for review"

Nobody has looked at it yet, and there is nothing for you to do. This is the normal path for most listings.

## "Changes needed"

Someone — or the automatic scan — has looked and something needs fixing. The reason is shown on the listing's own card, in plain words. Fix that one thing and it goes back into the queue automatically.

## What gets checked

- **Images and files** — an automatic scan, then a person.
- **Your words** — the listing title, description and reward text are checked against the platform's content rules.

## Why an item can be held twice

A Shop listing has both a product image and a paid reward file. Both are scanned, so an item can be held for either. The reason names which one.

## If your listing is scheduled

Approving a scheduled listing does not put it on sale early — it still goes live at the time you set. See [scheduling a listing](/help/selling/schedule-a-listing).
MD,
            ],
            [
                'slug' => 'schedule-a-listing',
                'title' => 'Scheduling a listing to go live later',
                'audience' => 'creator',
                'keywords' => 'schedule, publish later, drop, launch, timed, go live, future date',
                'summary' => 'Set a publish time on any listing from My Listings. It goes on sale at that minute, whether or not you are at a keyboard.',
                'related' => ['why-is-my-listing-under-review', 'what-can-i-sell'],
                'body' => <<<'MD'
Any listing can be given a publish time, set from **My Listings** rather than from the individual forms. A schedule is a property of your catalogue, so it lives in one place.

## What happens

Until the time you set, the listing is invisible to everyone but you. Nobody can find it, nobody can buy it, and it does not appear on your profile or in Discover. At the minute you chose, it goes on sale.

## It does not depend on anything running

Visibility is decided by the clock. There is no job that has to fire for your drop to happen.

## Review still applies

A scheduled listing is reviewed normally. If it reaches its publish time still unapproved, it goes live when it is approved instead.

## What you see

Your own screens show a "Goes live" badge on anything scheduled, so a listing that nobody can buy yet never looks identical to one that is selling.

## Limits

Up to 90 days ahead. Setting a time in the past simply publishes it now.

## It still counts as having listed

Scheduling your first item counts — you will not be nudged to "publish your first item" while one is queued.
MD,
            ],
            [
                'slug' => 'price-limits',
                'title' => 'Why can I not set that price?',
                'audience' => 'creator',
                'keywords' => 'price limit, minimum, maximum, too high, too low, price rejected, 4.99',
                'summary' => 'Every product has a minimum of {{price.min}} and its own maximum, checked in GBP whatever currency you list in.',
                'related' => ['what-can-i-sell', 'what-fees-are-deducted'],
                'body' => <<<'MD'
Prices are checked against a GBP equivalent, so the same limits apply whatever currency you sell in.

## The minimum

**{{price.min}} on everything.** Below that, payment processing costs more than the sale is worth.

## The maximums

| Product | Maximum |
| --- | --- |
| Wishes | {{price.max.wish}} |
| Piggy Pot | {{price.max.pot}} |
| Bills | {{price.max.bill}} a month |
| Memberships | {{price.max.membership}} a month |
| Shop | {{price.max.shop}} |
| Paid Requests | {{price.max.task}} |

## High-value listings

A Shop listing above {{payment.tier.card_max}} is held for an extra review before it can be bought, and an order at that level is held until delivery is confirmed. That is a deliberate protection for both sides on a large sale.

## What you are paid

You keep the price you set. Supporters cover the platform's fees on top at checkout, and they see the full total before they pay — see [what fees are deducted](/help/money-and-payouts/what-fees-are-deducted).
MD,
            ],
        ];
    }

    private function moneyArticles(): array
    {
        return [
            [
                'slug' => 'when-do-i-get-paid',
                'title' => 'When do I get paid?',
                'audience' => 'creator',
                'keywords' => 'payout, when paid, friday, payment schedule, bank transfer, money, earnings',
                'summary' => 'Every {{payout.day}}. Earnings run {{payout.day}} to Thursday and go out the following {{payout.day}}, usually landing on Monday.',
                'related' => ['why-is-some-of-my-money-held', 'connect-your-payouts', 'what-fees-are-deducted'],
                'body' => <<<'MD'
Payouts run **every {{payout.day}}**. Your earnings week runs {{payout.day}} to Thursday, and that week's money goes out the following {{payout.day}} — usually reaching your bank on the Monday after.

Money is paid straight into your own Stripe account, in your name.

## The hold

A sale is not eligible until it is {{payout.hold_days}} days old. That window is what lets a genuine problem with a purchase surface before the money has left.

## What is included

- The price you listed, plus any VAT collected on it.
- Bonuses you have qualified for.

## What is not included yet

- Sales inside the {{payout.hold_days}}-day hold.
- Paid Requests the buyer has not accepted, and physical Shop orders not yet marked delivered.
- Anything under [reserve](/help/money-and-payouts/why-is-some-of-my-money-held).

Your financial dashboard shows each of these separately, so a lower-than-expected payout always has a reason you can see.

## If a payout fails

The money returns to your balance and retries in the next run. You are told when it happens — there is nothing to chase and nothing is lost.
MD,
            ],
            [
                'slug' => 'why-is-some-of-my-money-held',
                'title' => 'Why is some of my money held back?',
                'audience' => 'creator',
                'keywords' => 'reserve, held, rolling reserve, withheld, not paid out, release, 30 days, 10 percent, 10%, percentage held, why is money held, holding back, deducted from payout',
                // 🚨 TWO CLOCKS, SAID SEPARATELY. An earlier version read "held
                // for 30 days and then paid out. New creators are on 10% for
                // their first 2 days", which reads as the money being held for
                // two days — wrong on both counts, and reported by a reader.
                // Never put the two windows in one sentence without labelling
                // which is the hold and which is the rate.
                'summary' => 'Every reserve is released {{reserve.window_days}} days after the sale it came from. How much is reserved is a separate question — for your first {{reserve.onboarding_days}} days as a creator the rate is {{reserve.onboarding_pct}}, then it drops to nothing.',
                'related' => ['is-the-reserve-permanent', 'when-do-i-get-paid', 'disputes-and-chargebacks'],
                'body' => <<<'MD'
A reserve is a percentage of each sale held back for a while and then paid out to you. It is **not** a fee — every penny of it reaches you.

## Two separate things

These get confused constantly, so they are worth stating apart:

- **How long money is held: {{reserve.window_days}} days.** Each sale's reserve is released {{reserve.window_days}} days after **that sale**. This never changes.
- **How much is reserved: a percentage.** This is where the new-creator rate comes in, below.

So a creator on the new-creator rate is not having money held for a shorter or longer time than anyone else. The hold is always {{reserve.window_days}} days. Only the percentage differs.

## What percentage

Two things can set it, and **the higher of the two applies**:

- **The new-creator rate — {{reserve.onboarding_pct}}.** Every creator is on this for their first {{reserve.onboarding_days}} days after connecting payouts. **That is how long you stay on the rate, not how long the money is held.** After it, the rate drops to nothing on its own.
- **A risk-based rate.** Set on your account if your dispute or refund history warrants it. Most creators never have one.

So if you are seeing {{reserve.onboarding_pct}} of your sales reserved, the usual reason is that you are inside your first {{reserve.onboarding_days}} days as a creator — see [is the reserve permanent](/help/money-and-payouts/is-the-reserve-permanent).

Your financial dashboard shows the exact percentage on your account right now, and the date the new-creator period ends.

## Why it exists

A card payment can be disputed by the buyer weeks after it was made. The reserve is what covers that window, and it is a large part of why this platform's payments stay switched on when other creator platforms lose theirs.

## What it is calculated on

**Your net earnings — never on what the supporter paid.** The fees a supporter covers at checkout are not yours, so they are not reserved against.

**VAT is not reserved either.** It is tax you hold on HMRC's behalf, and holding part of it back would leave you unable to remit it in full.

## When it is released

{{reserve.window_days}} days after **that sale's own date** — not from the payout run it was part of.

That is why a reserve can still be held after the rest of that same sale has already been paid to you: the sale and its reserve are on two different clocks. Once released, a reserve is never held again.
MD,
            ],
            [
                'slug' => 'is-the-reserve-permanent',
                // ⚠️ NO TOKEN IN A TITLE. Titles are printed into page titles,
                // breadcrumbs, JSON-LD and search results, none of which render
                // tokens — a literal {{...}} would leak into all four. Tokens
                // live in the summary and the body only, and a test asserts it.
                'title' => 'Is the reserve permanent?',
                'audience' => 'creator',
                'keywords' => 'reserve permanent, every month, forever, 10% every month, still being held, when does reserve stop, reduce reserve, new creator reserve',
                'summary' => 'No. The new-creator rate stops on its own once you are {{reserve.onboarding_days}} days past connecting payouts. If money is still being reserved after that, it is a risk-based rate instead.',
                'related' => ['why-is-some-of-my-money-held', 'when-do-i-get-paid', 'disputes-and-chargebacks'],
                'body' => <<<'MD'
**No.** The {{reserve.onboarding_pct}} rate every new creator starts on is time-limited: it applies to sales made in your first {{reserve.onboarding_days}} days after connecting payouts, and then stops. Nothing needs to be requested and nobody has to approve it.

## It can look permanent, and it is not

Each individual sale's reserve is held for {{reserve.window_days}} days from that sale. So during your first weeks you are always looking at *some* money held — but it is a different set of sales each time, with the earliest releasing as new ones arrive. The figure stays roughly level while the sales behind it turn over completely.

That is also why the two numbers are easy to mix up: the **rate** lasts {{reserve.onboarding_days}} days, each **hold** lasts {{reserve.window_days}} days, and they are unrelated.

Your financial dashboard shows the date the new-creator period ends and what is due to release, so you can see it moving rather than having to take it on trust.

## If it has not stopped

Then it is a **risk-based reserve**, which is a different thing with a different cause — usually a dispute or refund history the platform has to cover. It is shown separately on your dashboard.

A risk reserve is not permanent either. It is recalculated as your history changes, and a clean run of sales moves it down.

## What does not affect it

- How much you earn.
- Which products you sell.
- Being a Founder, or any bonus you have qualified for.

## What you can do

Deliver what you sold, on time, and describe it accurately. Almost every risk reserve traces back to disputes, and almost every dispute traces back to a supporter not receiving what they expected.
MD,
            ],
            [
                'slug' => 'what-fees-are-deducted',
                'title' => 'What fees come out of my sales?',
                'audience' => 'creator',
                'keywords' => 'fees, commission, platform fee, deduction, keep 100%, what do i keep, charges',
                'summary' => 'You keep the price you list. Supporters cover the platform fees at checkout and see the full total before they pay.',
                'related' => ['when-do-i-get-paid', 'what-does-the-subscription-cost', 'why-is-the-total-more-than-the-price'],
                'body' => <<<'MD'
**You keep 100% of the price you set.** Fees are added on top at checkout and paid by the supporter, who sees the full total before they pay anything.

## What that means in practice

List something at {{price.min}} and {{price.min}} is what reaches your balance. The supporter's card is charged more than that, and the difference never passes through your earnings.

## The rate is not one number

It varies by **payment method** — a bank payment costs less to process than a card, so the total a supporter pays is lower — and some creators are on individually negotiated rates. That is why you will not find a single percentage published anywhere: any one figure would be wrong for someone.

The exact breakdown for any sale is on that transaction in your financial dashboard.

## The rate is frozen on each sale

Whatever rate applied when a sale was made stays recorded against it. If your rate later changes, your past transactions are not re-costed.

## Separately, the subscription

The monthly creator subscription is [a flat fee](/help/getting-started-creators/what-does-the-subscription-cost), not a commission. The two are unrelated.
MD,
            ],
            [
                'slug' => 'vat-and-your-earnings',
                'title' => 'VAT and your earnings',
                'audience' => 'creator',
                'keywords' => 'vat, tax, hmrc, tax year, statement, invoice, tax return',
                'summary' => 'VAT collected on your sales is paid out with your earnings — it is yours to remit, not ours to hold.',
                'related' => ['when-do-i-get-paid', 'why-is-some-of-my-money-held'],
                'body' => <<<'MD'
Where VAT is collected on your sales, it is collected on top of your price and paid out to you along with your earnings.

## It leaves with your payout

VAT is not held back and it is not reserved against. It is tax you hold on HMRC's behalf, and holding part of it back would leave you unable to remit it in full.

## Your records

The **Tax** tab of your financial dashboard has:

- Totals for the current UK tax year (6 April to 5 April — not the calendar year).
- A per-transaction ledger.
- Downloadable statements as PDF or CSV, for any month, tax year, or a range you choose.

## The statement always matches the dashboard

Both are built from the same ledger, so a statement can never report a different figure from the screen you generated it on.

## What we do not do

We do not file anything for you and we are not your accountant. What we provide is a complete, downloadable record of what you were paid and when.
MD,
            ],
            [
                'slug' => 'founder-bonus',
                'title' => 'The Founder bonus',
                'audience' => 'creator',
                'keywords' => 'founder, bonus, seats, qualify, earnings bonus, 30 days, monthly bonus',
                'summary' => 'Earn {{founder.min_earnings}} net in your first {{founder.window_days}} days and you become a Founder — {{founder.seats}} seats in total.',
                'related' => ['when-do-i-get-paid', 'what-fees-are-deducted'],
                'body' => <<<'MD'
New creators who earn **{{founder.min_earnings}} net** within their first **{{founder.window_days}} days** of connecting payouts become Founders. There are **{{founder.seats}} seats** in total.

## Net, not gross

The figure that counts is your net earnings — what actually reaches you — on completed sales. A refunded or still-pending payment does not count towards it.

## What the number on your dashboard means

The progress tracker on your dashboard and the qualifying figure are the same calculation. What you see is what you are measured on.

## The monthly bonus

Founders earn **{{founder.monthly_pct}}** of their monthly earnings as a bonus, capped at **{{founder.monthly_cap}}** a month.

## If your window closes without qualifying

You are told, and the reason is stated — either the earnings threshold or the seats being full. The notice stays on your dashboard for two weeks so it is not something you discover by absence.

## Payment

Qualifying bonuses are paid automatically. There is no approval step to wait on and nothing to claim.
MD,
            ],
        ];
    }

    private function checkoutArticles(): array
    {
        return [
            [
                'slug' => 'card-or-bank',
                'title' => 'Card or bank — which should I use?',
                'audience' => 'both',
                'keywords' => 'pay by bank, sepa, ach, card, payment method, cheaper, which payment',
                'summary' => 'Bank payments cost less to process, so the total is lower. Card is instant; some bank methods take a day or two to clear.',
                'related' => ['why-is-the-total-more-than-the-price', 'my-payment-says-processing'],
                'body' => <<<'MD'
Where both are offered, the checkout shows you each total side by side before you choose.

## Bank

Costs less to process, so **the total you pay is lower**. Available in the UK, parts of Europe and the US depending on the method.

- **Pay by Bank** (UK, and some of Europe) settles almost immediately.
- **SEPA** and **ACH** are debits that take a day or two to confirm.

## Card

Instant, and available everywhere. Slightly higher total because card processing costs more.

## Larger payments

Above {{payment.tier.open_max}} the checkout recommends bank. Above {{payment.tier.card_max}} card is still offered, with an extra 3-D Secure step from your bank.

If our checks flag something about the payment, card may not be offered on a larger purchase and bank will be. That is not a judgement about you — it is a threshold plus a signal, and bank is always available.

## Recurring purchases

Memberships and Bills are card only. Bank methods are for one-off payments.
MD,
            ],
            [
                'slug' => 'why-is-the-total-more-than-the-price',
                'title' => 'Why is the total more than the listed price?',
                'audience' => 'both',
                'keywords' => 'total, extra, more than price, added at checkout, why more expensive, fees added',
                'summary' => 'The creator keeps the price they listed, and the platform fees are added on top — shown in full before you pay.',
                'related' => ['card-or-bank', 'what-fees-are-deducted'],
                'body' => <<<'MD'
The price on a listing is **what the creator receives**. The platform's fees are added on top and paid by you.

## Nothing is hidden

The full total is on screen before you enter any payment details, and it is the exact amount that will be charged. There is no step where a number changes.

## Why it is built this way round

If fees came out of the price, a creator listing something at £20 would receive less than £20 and would have to guess at a higher number to end up where they meant to be. Adding on top means the creator's price is real and yours is honest.

## Why it varies

- **Payment method.** Bank costs less to process than card, so the bank total is lower.
- **The creator.** Some creators are on individually negotiated rates.

That is why no single percentage is published — any one figure would be wrong for someone.

## A basket with several items

The fee is applied once to the basket total, not once per item. Adding the individual totals together gives a slightly higher figure than the basket does — the basket is correct.
MD,
            ],
            [
                'slug' => 'my-payment-says-processing',
                'title' => 'My payment says "processing"',
                'audience' => 'both',
                'keywords' => 'processing, pending, bank confirming, not received, payment stuck, sepa, ach, clearing',
                'summary' => 'A bank debit your bank has not confirmed yet. Nothing is wrong and nothing is lost — the content unlocks when it clears.',
                'related' => ['card-or-bank', 'i-cannot-find-my-purchase'],
                'body' => <<<'MD'
Some bank payment methods — SEPA in Europe and ACH in the US — are **debits**. You have authorised them, and your bank then confirms them, which usually takes one to two working days.

## What is happening

The purchase is real and the creator's item is reserved. We simply do not hand over paid content on money that has not cleared, for anyone.

## What you will see

The reward headline and a note saying it unlocks when your bank confirms. As soon as it does:

- The content appears on your receipt and in My Purchases.
- The creator is notified of the sale.

## Nothing to do

You do not need to pay again, and you should not. A second payment is a second purchase.

## If it fails

If your bank declines the debit you are told, and nothing is taken. You can try again with the same method or with a card.

## Card payments

Card payments do not have this state. A card payment either succeeds or it does not, immediately.
MD,
            ],
        ];
    }

    private function contentRulesArticles(): array
    {
        return [
            [
                'slug' => 'what-content-is-allowed',
                'title' => 'What content is allowed?',
                'audience' => 'creator',
                'keywords' => 'sfw, nudity, allowed content, rules, adult, explicit, banned, safe for work',
                'summary' => 'Strictly SFW, and actively enforced. No nudity, no explicit content, no exceptions.',
                'related' => ['why-is-my-listing-under-review', 'words-you-cannot-use'],
                'body' => <<<'MD'
This is a **strictly safe-for-work platform**, and it is enforced rather than merely stated.

- No nudity.
- No explicit content.
- No exceptions.

## How it is enforced

Every upload is scanned automatically and then reviewed by a real person before it goes live. Every creator is identity-verified with a passport before they can earn anything.

## Adult creators

Adult creators are welcome here for their SFW work. What you do elsewhere is your business — what you publish here has to meet the rule above.

## Why we are this strict

It is why this platform's payments stay switched on when other creator platforms lose theirs. That protects every creator here, not just the platform.

## False positives

The automatic scan is tuned to avoid flagging ordinary content — swimwear, gym photos and combat sports pass. If something is held that should not be, a person clears it. Nothing is deleted for being flagged.

## Beyond images

Monetising hateful or violent content is prohibited outright, and that applies to your words as well as your files.
MD,
            ],
            [
                'slug' => 'words-you-cannot-use',
                'title' => 'Why was my listing title rejected?',
                'audience' => 'creator',
                'keywords' => 'banned words, title rejected, brand name, expense, rent, bill, wording, blocked word, not allowed, refused, held at review',
                'summary' => 'Listings must read as a purchase of content or a creator service — not as an expense, a transfer, or a branded product. The form refuses all three as you save, and a person reviews the listing on top of that.',
                'related' => ['what-should-i-call-my-listing', 'what-is-a-reward', 'why-is-my-listing-under-review', 'what-content-is-allowed'],
                'body' => <<<'MD'
Everything you sell here has to read as a **purchase of your content or your service**. Three kinds of wording are refused.

## Living expenses

Rent, mortgage, car payment, vet bill, credit card, phone bill and similar. A listing named after a household cost reads as a transfer rather than as something being sold, and that is the framing that gets creator platforms cut off from payments.

## Brand names

Naming a shop, a product or a company in a listing title. You are selling your own content, not someone else's product.

## The payment itself

A title that names **why you want the money**, or describes the payment as a favour or a treat, instead of naming what the buyer receives. This is the one most often written by accident, usually because it is the normal wording on other creator sites. It is not normal wording here, because here every payment has to have something on the other side of it.

## What you can say instead

Describe **what the buyer receives**. "The full behind-the-scenes set", "a personalised video message", "this month's photo bundle".

## The test

Take the money reason out of the title. Does what is left still describe something?

"The full summer set" survives on its own. A title naming a household cost, a favour or a treat does not — remove the money and there is nothing left, because there was never anything being sold.

## When you find out

All three are refused **as you save**, with a message naming the problem, on every kind of listing and on the reward title.

Saving successfully still does not mean approved — every new listing is reviewed by a person before it goes on sale, and review looks at the whole thing rather than the wording alone. If yours is held, [why is my listing under review?](/help/selling/why-is-my-listing-under-review) explains what happens next.

## Words that are fine

The check is deliberately narrow, so ordinary content wording passes: "Bill Murray impressions", "one styling tip a week", "my gift guide", "new shoes wish". It is the phrasing that names a household cost or the payment itself that is refused, not the individual words.

## The optional goal line

Wishes and Bills have a separate, optional **goal label** — an aspirational line shown on the card and the progress bar only. It never appears at checkout, on the pay button, on a receipt, or on a bank statement, all of which always describe the content.

Both fields are checked against the same rules.

## The bare word "bill"

Not blocked — it is the name of one of the products, and a name like "Bill Murray" has to pass. It is the expense phrasing that is refused, not the word.
MD,
            ],
            [
                'slug' => 'why-were-my-subscriptions-paused',
                'title' => 'Why have my subscription payments stopped?',
                'audience' => 'creator',
                'keywords' => 'paused, posting, cadence, subscribers not charged, collection paused, income stopped, member posts',
                'summary' => 'Selling a recurring product means delivering content. Below {{cadence.min_posts}} member posts in {{cadence.window_days}} days, collection pauses.',
                'related' => ['what-can-i-sell', 'what-content-is-allowed'],
                'body' => <<<'MD'
If you sell Bills or Memberships, you need at least **{{cadence.min_posts}} approved member posts in a rolling {{cadence.window_days}} days**. Below that, your active recurring subscriptions stop collecting.

## What "paused" means

Your subscribers are **not charged** while it is paused. They keep their access; no money is taken. It is fully reversible — collection restarts automatically the moment you are back at the threshold.

## You are warned first

You get an email, a notification and a message on your dashboard **before** anything pauses, and then {{cadence.warning_days}} days to post. You will not find out because the money stopped.

## The grace period

A brand new subscription is never paused before you have had a full {{cadence.window_days}}-day window to post in.

## What counts

Approved posts published to members or subscribers. Automatic posts the platform creates on your behalf do not count.

## Where to check

Your Activity Status page shows how many posts count right now, when each one drops out of the window, and exactly what is left to do.

## Why the rule exists

A recurring content subscription has to deliver content. That is what makes it a subscription rather than a standing transfer, and it is what keeps this platform's payments working.
MD,
            ],
        ];
    }

    private function accountArticles(): array
    {
        return [
            [
                'slug' => 'two-factor-and-passkeys',
                'title' => 'Two-factor authentication and passkeys',
                'audience' => 'both',
                'keywords' => '2fa, two factor, passkey, security, otp, authenticator, login, sign in',
                'summary' => 'Add an authenticator app or a passkey. Both work alongside your password, and with Sign in with Google.',
                'related' => ['email-preferences'],
                'body' => <<<'MD'
## Two-factor authentication

Turn it on from your account settings and scan the code with any authenticator app. From then on, signing in asks for a six-digit code after your password.

It applies however you sign in — including with Google.

## Passkeys

A passkey signs you in with your device's own fingerprint, face or screen lock. No password to remember and nothing to type. Add one from your account settings; you can have several, one per device.

## Sign in with Google

If you signed up with Google you have no password by default. You can set one at any time through "forgot password", which also gives you a second way in if you ever lose access to the Google account.

## If you lose your authenticator

Contact support. You will be asked to confirm your identity before it is reset — that is the point of it, and there is no self-service route around it.
MD,
            ],
            [
                'slug' => 'email-preferences',
                'title' => 'Which emails can I turn off?',
                'audience' => 'both',
                'keywords' => 'emails, unsubscribe, notifications, marketing, preferences, stop emails, opt out',
                'summary' => 'Promotional and reminder emails are all optional, one category at a time. Receipts and security emails always send.',
                'related' => ['two-factor-and-passkeys'],
                'body' => <<<'MD'
Email settings live on your **Email preferences** page, and each category is a separate switch — turning off promotions does not silence product announcements.

## What you can turn off

- Promotional email
- Product updates
- Creator updates
- Reactivation reminders
- Restock alerts
- Unfinished-checkout reminders
- Push notifications

## What always sends

Receipts, payment confirmations, password resets, security notices and anything about your account's own state — a payout, a refund, a payment that could not be taken.

There is no switch for these by design. They are about money that has moved or access to your account, and there is no version of that you should be able to miss.

## One-click unsubscribe

Every optional email has an unsubscribe link, and the ones in a promotional email turn off just that category rather than everything.

## Bought as a guest

Reminder emails to a guest carry their own unsubscribe link — you do not need an account to stop them.
MD,
            ],
        ];
    }

    private function purchasesArticles(): array
    {
        return [
            [
                'slug' => 'i-cannot-find-my-purchase',
                'title' => 'I cannot find what I bought',
                'audience' => 'supporter',
                'keywords' => 'lost purchase, receipt, no email, cannot find, missing content, guest, find my purchase',
                'summary' => 'If you have an account it is in My Purchases. If you bought as a guest, use Find my purchase with the email you paid with.',
                'related' => ['do-i-need-an-account-to-buy', 'my-payment-says-processing', 'refunds-and-cancellations'],
                'body' => <<<'MD'
## If you have an account

Everything is in **[My Purchases](/my-purchases)** — permanently, including the files, messages and links you paid for, plus your receipts.

## If you bought as a guest

Use **Find my purchase**. Enter the email address you paid with and we send a link back to everything bought with it. There is a link to it on the sign-in page and on your receipt email.

We reply the same way whether or not that address has purchases — we will not confirm to a stranger whether an email address is on this platform.

## The link expires

Seven days, because it grants access to paid content. Request a new one whenever you need it.

## If your payment is still clearing

A bank payment can take a day or two. You will see the item and a note that it unlocks when your bank confirms — see [my payment says processing](/help/payments-and-checkout/my-payment-says-processing).

## If the listing was removed

A creator taking a listing down does not un-buy it. Your purchase is still shown, and so is your receipt.
MD,
            ],
            [
                'slug' => 'refunds-and-cancellations',
                'title' => 'Refunds and cancelling a subscription',
                'audience' => 'supporter',
                'keywords' => 'refund, cancel, money back, subscription cancel, return, chargeback, stop payments',
                'summary' => 'Ask through the purchase itself. Subscriptions cancel at the end of the period you have paid for.',
                'related' => ['i-cannot-find-my-purchase', 'disputes-and-chargebacks'],
                'body' => <<<'MD'
## Asking for a refund

Open the purchase in [My Purchases](/my-purchases) or your support history and choose **Problem with this?**. That attaches your request to the exact payment, which is what lets it be looked at quickly.

Bought as a guest? Your receipt email has the same link.

## Digital content

If you asked for immediate access to a digital item, you agreed to that at checkout in exchange for your 14-day right to cancel. That is stated on the checkout screen and recorded with the purchase — it is not something applied afterwards.

## Paid Requests

Money for custom work is held until you accept the delivery. If a creator misses their deadline, it is refunded automatically — you do not have to ask.

## Cancelling a subscription

Cancel from My Purchases. Your access runs to the **end of the period you have already paid for**, and nothing further is taken. You can resume before it ends and keep the same subscription.

## Please do not go straight to your bank

A chargeback is slower for you than asking us, and it costs the creator money on a sale they may have delivered in full. Ask first — see [disputes and chargebacks](/help/trust-and-safety/disputes-and-chargebacks).
MD,
            ],
            [
                'slug' => 'item-sold-out',
                'title' => 'The item I wanted is sold out',
                'audience' => 'supporter',
                'keywords' => 'sold out, out of stock, waitlist, restock, notify me, back in stock',
                'summary' => 'Join the waitlist and you are emailed the moment it is back — and the creator can see the demand.',
                'related' => ['i-cannot-find-my-purchase'],
                'body' => <<<'MD'
A sold-out listing shows a **waitlist**. Join it and you are told as soon as it is back in stock.

## You do not need an account

An email address is enough.

## What you get

One notice, with the number back in stock, linking straight to the item. Everyone waiting is told at once and only a few can buy, so the link goes to the listing rather than making you hunt for it.

## The creator sees the demand

The number of people waiting shows on the creator's own screen. That is often what makes a restock happen at all — without it, a sold-out listing simply looks like a finished one.

## Leaving the list

There is a link in the email. If you have an account you can also leave from the listing itself.

## If it sells out again

You can rejoin. Being notified once does not remove you permanently.
MD,
            ],
        ];
    }

    private function trustArticles(): array
    {
        return [
            [
                'slug' => 'disputes-and-chargebacks',
                'title' => 'Disputes and chargebacks',
                'audience' => 'both',
                'keywords' => 'dispute, chargeback, bank dispute, fraud, unrecognised charge, evidence, claim',
                'summary' => 'A chargeback is your bank reversing a payment. Asking us first is faster, and it is the only route that can be resolved in days.',
                'related' => ['refunds-and-cancellations', 'why-is-some-of-my-money-held'],
                'body' => <<<'MD'
A chargeback is your **card issuer** reversing a payment. It runs on their timetable, not ours.

## If you are a supporter

**Ask us first.** Open the purchase and choose "Problem with this?". Most cases are resolved in a day or two, whereas a chargeback takes weeks and cannot be sped up by anyone.

If you genuinely do not recognise a charge: payments from this platform appear on a statement as the creator's name followed by CONTENT. That is often the whole explanation.

## If you are a creator

You are told as soon as a dispute is raised, with a deadline. The platform assembles the evidence — the purchase, what was delivered, when it was accessed, and the terms agreed at checkout — and answers the card issuer.

An unanswered dispute is lost automatically at its deadline, which is why you are told about it more than once.

## Why the deliverable matters

Every paid item here has to record what was sold and when it was delivered. That record is what a dispute is won with, and it is the reason the reward on a listing is mandatory rather than optional.

## Early fraud warnings

Sometimes a card issuer flags a payment before any dispute exists. Acting on it in time avoids a chargeback fee entirely, so those are surfaced immediately too.
MD,
            ],
            [
                'slug' => 'report-a-problem',
                'title' => 'Reporting a creator, a listing or a post',
                'audience' => 'both',
                'keywords' => 'report, abuse, breaks the rules, complaint, flag, copyright, stolen content',
                'summary' => 'Report from the item itself. Content that breaks the rules is taken out of sale while it is reviewed.',
                'related' => ['what-content-is-allowed', 'disputes-and-chargebacks'],
                'body' => <<<'MD'
## Reporting

Use the report control on the profile, listing or post. Reporting from the item itself is what tells us which one you mean — a general message costs a round trip to establish that.

## What happens

Content that appears to break the rules is taken **out of sale** while it is looked at. It is not deleted: a report is not a verdict, and a creator's work is not destroyed on the strength of one.

The creator is told what was objected to, so they can fix it if it is fixable.

## Copyright

If something of yours has been published here without permission, use the copyright process rather than a general report. It needs specific information to act on, and the report form cannot collect it.

## Safety

Anything involving a person's immediate safety goes straight to support, marked urgent. Do not wait on a queue for that.

## Retaliation

Reports are not shown to the person reported. A creator cannot see who reported them.
MD,
            ],
        ];
    }
}
