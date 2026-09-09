<?php

namespace Database\Seeders\Help;

/**
 * The fifth content batch — SELLING RULES.
 *
 * Source: the client's "SP Selling Rules Master" document (9 Sep 2026,
 * `docs/client/9 sept/`), written as an Intercom Help Centre draft — eleven
 * sections, one per monetisation feature, each with can / can't / good wording
 * / wording to avoid.
 *
 * 🚨 THE HEADLINE RULE IT ADDS, which no existing article said: **adult
 * creators are welcome, and their branding is not the thing being judged.**
 * `what-content-is-allowed` already said "adult creators are welcome here for
 * their SFW work", but nothing anywhere told a creator that a name like
 * Goddess, Domme, Findom or Cashmaster is not itself a refusal — so the only
 * way to find out was to be rejected. The boundary is what is SOLD, never who
 * the creator is.
 *
 * 🚨 THREE THINGS IN THE SOURCE DOCUMENT WERE DELIBERATELY NOT COPIED ACROSS:
 *
 * 1. **Every "How moderation should treat this feature" section is omitted.**
 *    Those are instructions to reviewers — which selections may be
 *    auto-approved, which terms escalate rather than refuse. Published to
 *    creators they are a map of what to write to get past review, and a
 *    public page describing the mechanism invites arguing the implementation
 *    rather than the rule. Same reasoning as the Growth Bonus Part B spec,
 *    which is deliberately unpublished. The one creator-facing half of those
 *    sections — *"if the wording is unclear but the offering is allowed, we
 *    ask you to reword rather than refuse"* — IS carried, because that is a
 *    promise to the creator rather than a threshold.
 *
 * 2. **"Memberships are preset on SP. Creators choose from the available
 *    membership options"** is not what the platform does.
 *    `MembershipController::membershipLevelSave` validates a creator-supplied
 *    `level` (the tier name) and `month_price`, so the PRICE and the NAME are
 *    the creator's. What is preset is the ongoing **benefits** list —
 *    `config('rewards.perks')`, a fixed set of ten. Written accurately here.
 *
 * 3. **"The eight ways creators can get paid"** is seven.
 *    The document's eighth, *Exclusive Content / Content Unlocks*, has no
 *    distinct product in this codebase — `posts` carries no price or unlock
 *    column, and the document's own description of it ("a one-off paid unlock;
 *    the supporter knows exactly what content they receive immediately after
 *    purchase") is a **Wish**. Its rules are therefore folded into
 *    `wish-and-unlock-rules` rather than advertising a product nobody can
 *    reach. ⚠️ If a real paid-post unlock ever ships, split it back out.
 *
 * ⚠️ Merged by HelpCentreSeeder alongside ExtraArticles, FeatureArticles and
 * CoverageArticles, so the rules are the ones stated once in HelpCentreSeeder's
 * docblock. Two that bite hardest here:
 *
 * 🚨 Never type a price, rate, threshold, window or seat count — use a
 *    {{token}} from App\Support\HelpTokens. The source document's
 *    wording-to-avoid lists quote amounts ("Send me £100", "Send me £50 every
 *    week"); those are **neutralised**, because a figure on a public page is a
 *    figure that goes stale whether or not it describes us, and the example
 *    reads the same without it.
 * 🚨 An article whose SUBJECT is a prohibition may name what is prohibited —
 *    that is what a prohibited list is, and `words-you-cannot-use` already
 *    names expense wording. The rule it must not break is using that
 *    vocabulary APPROVINGLY, or importing it into an article about something
 *    else.
 */
class SellingRulesArticles
{
    /** @return array<int, array<string, mixed>> */
    public static function forCategory(string $slug): array
    {
        return match ($slug) {
            'content-rules' => self::contentRules(),
            default => [],
        };
    }

    /** @return array<int, array<string, mixed>> */
    private static function contentRules(): array
    {
        return [
            [
                'slug' => 'the-selling-rules',
                'title' => 'What are the rules on what I can sell?',
                'audience' => 'creator',
                'keywords' => 'selling rules, what am i allowed to sell, allowed, not allowed, prohibited, banned, compliance, sfw, safe for work, refused, rejected, rules, guidelines, policy, what can i list',
                'summary' => 'Everything sold here has to be a real thing the buyer receives, and it has to be non-explicit. Six rules cover every product, and each product has its own page of examples.',
                'related' => ['adult-creators-and-branding', 'what-content-is-allowed', 'words-you-cannot-use', 'what-can-i-sell'],
                'body' => <<<'MD'
Two things, and everything else follows from them.

1. **The buyer receives something real** — a piece of content, a product, or a creator service.
2. **What you sell here is non-explicit** — not sexual, not fetish content or services.

That second rule is about what you *sell*, not about who you are. Adult creators are welcome; see [I'm an adult creator — can I use Spenny Piggy?](/help/content-rules/adult-creators-and-branding).

## The six rules

**Say exactly what the buyer receives.** Every paid listing has to name the content, product, access or service being bought. "You'll get" is the sentence that has to be true.

**Keep it non-explicit.** No nudity, no sexual or fetish content, no sexual or fetish services.

**Do not use this to move cash.** A listing that asks for money with nothing on the other side of it is refused, however it is phrased.

**Keep the payment here.** Never ask a supporter to pay you by bank transfer, or through any payment app or service outside this platform. That removes their refund rights and their protection if something goes wrong, and it is the fastest way to lose your account.

**Nothing illegal, dangerous or regulated.** No drugs, weapons, counterfeit or stolen goods, gambling products, financial instruments or prescription medicines. Regulated legal, medical or financial advice needs separate approval.

**Be accurate.** Do not mislead anyone about what they receive, when it arrives, whether it is authentic, or whether it is still available.

## If the wording is the only problem

You will normally be asked to **reword it**, not refused. If the thing you are actually selling is allowed and only the description reads wrong, that is a rewrite, and the review team will tell you which part to change.

## The rules for each product

- [Memberships](/help/content-rules/membership-benefits-allowed)
- [Paid Requests](/help/content-rules/paid-request-rules)
- [Piggy Pots and content goals](/help/content-rules/content-goal-rules)
- [Piggy Bank](/help/content-rules/piggy-bank-rules)
- [Bills — recurring content](/help/content-rules/recurring-content-rules)
- [Wishes and one-off content unlocks](/help/content-rules/wish-and-unlock-rules)
- [Shop products, digital and physical](/help/content-rules/shop-product-rules)
- [Your profile, bio and posts](/help/content-rules/profile-and-bio-rules)
MD,
            ],
            [
                'slug' => 'adult-creators-and-branding',
                'title' => "I'm an adult creator — can I use Spenny Piggy?",
                'audience' => 'creator',
                'keywords' => 'adult creator, adult, findom, findomme, goddess, domme, mistress, cashmaster, princess, queen, master, branding, creator name, persona, nsfw creator, am i allowed, banned, tribute, worship, kink, fetish',
                'summary' => 'Yes. Your wider persona can be adult-focused, and names like Goddess, Domme, Findom or Cashmaster are not refused on their own. What you sell through this platform has to be non-explicit.',
                'related' => ['the-selling-rules', 'what-content-is-allowed', 'profile-and-bio-rules', 'words-you-cannot-use'],
                'body' => <<<'MD'
**Yes.** Adult creators, including creators from findom and other adult-creator communities, are welcome here.

You do not have to change who you are or how you brand yourself anywhere else. This platform is the safe-for-work commercial layer of your creator business — what you **sell through it** has to be non-explicit and must not be sexual or fetish content or services.

## Your name and branding are not the problem

Creator names such as Goddess, Princess, Queen, Master, Domme, Findom or Cashmaster are **not** automatically refused. They describe who you are. They are read as branding, not as the thing being sold.

What they cannot do is make a prohibited sale acceptable. Branding is not a workaround: if the underlying offering is sexual or fetish content or a sexual service, the name on it changes nothing.

## Words that get read in context

Some words mean completely different things depending on how they are used, so a person reads them rather than a filter refusing them. Among them: **tribute, worship, humiliation, slave, feet, lingerie**.

None of those is banned outright. A lingerie *fashion* set and a listing marketed as fetish content are different listings, and the difference is what is being sold and to what end — not the vocabulary.

## What you still cannot do here

- Sell sexual or fetish content, or sexual or fetish services.
- Sell nudity, explicit content, sexting, sex chat or sexual roleplay.
- Advertise an explicit menu or price list, here or by pointing at one.
- Ask a supporter to pay you anywhere other than through this platform.

## Why the line is drawn here and not somewhere else

It is why this platform's payments stay switched on when other creator platforms lose theirs. That protects every creator here, including you — the boundary is what keeps your income working.

## If you are not sure

Ask before you list it rather than after. [Getting help from us](/help/trust-and-safety/getting-help-from-us) reaches a person, and a question costs you nothing.
MD,
            ],
            [
                'slug' => 'membership-benefits-allowed',
                'title' => 'What can I offer in a membership?',
                'audience' => 'creator',
                'keywords' => 'membership rules, membership benefits, perks, tiers, what can i offer members, member benefits, dm chat, video call, community, allowed, not allowed, nsfw membership',
                'summary' => 'A membership sells repeatable, non-explicit benefits. You pick your ongoing benefits from a fixed list and set your own monthly price, and at least one of them has to be content delivered here.',
                'related' => ['the-selling-rules', 'memberships-vs-bills', 'why-were-my-subscriptions-paused', 'what-is-a-reward'],
                'body' => <<<'MD'
A membership charges a supporter every month, so it has to **deliver something every month**. The benefits have to be repeatable and non-explicit.

## How a membership is put together

You choose your ongoing benefits from a **fixed list** — content bundles, DM chat, video calls, and access to a community channel — and you write your own tier name and set your own monthly price, up to {{price.max.membership}} a month.

**At least one benefit has to be content delivered on this platform.** A membership cannot be published without one, because a recurring content subscription that delivers nothing here is not a content subscription. If you do not pick one, a monthly content bundle is added for you rather than the save being refused.

Everything beyond that fixed list — polls, Q&As, early access, community updates, a heads-up on new products — is delivered through your **members-only posts**, which every membership includes.

## What you can offer

- Members-only posts on your profile
- Safe-for-work photo or video updates
- Behind-the-scenes creator updates
- Early access to new content
- Polls, Q&As and community updates
- Early access or a better price on your own compliant listings
- Non-sexual DM chat, where that benefit is offered
- Non-sexual video calls, where that benefit is offered
- Access to an approved creator community or channel
- Recurring safe-for-work content bundles

## What you cannot offer

- A membership whose purpose is sexual content
- Nudity or explicit content
- Sex chat, sexting or sexual roleplay
- Explicit video calls or cam-style performances
- A membership promising unrestricted custom requests

That last one is refused even when nothing explicit is named. "Anything you ask" is not a benefit anyone can price, deliver or hold you to — and it is the wording most often written by accident.

## Wording that works

- VIP membership with weekly behind-the-scenes posts
- Monthly safe-for-work photo bundle and member updates
- Supporter membership with early access and private creator posts
- Monthly creator Q&A and members-only updates

## Wording to avoid

- NSFW membership
- Explicit VIP
- Sex chat included
- Fetish access
- Anything-goes private requests

## You have to keep posting

Selling a recurring product means delivering content, and it is enforced: below {{cadence.min_posts}} member posts in {{cadence.window_days}} days, collection on your memberships pauses until you are posting again. Nobody is charged for a month you did not deliver. [Why have my subscription payments stopped?](/help/content-rules/why-were-my-subscriptions-paused)
MD,
            ],
            [
                'slug' => 'paid-request-rules',
                'title' => 'What can someone pay me to do?',
                'audience' => 'creator',
                'keywords' => 'paid request rules, paid task, custom request, commission, custom content, shoutout, personalised video, what can i offer, allowed, not allowed, private session, anything you want',
                'summary' => 'A Paid Request is custom work, defined before it is bought. Personalised work is checked more closely than a fixed listing, because the buyer is paying for something that does not exist yet.',
                'related' => ['the-selling-rules', 'how-do-paid-requests-work', 'what-is-a-reward', 'words-you-cannot-use'],
                'body' => <<<'MD'
A Paid Request sells **a specific piece of custom work**, and the buyer has to know what it is before they pay. That is the whole rule, and it is why this is the most closely checked product here — with a fixed listing the reviewer can see the thing; with a request they can only see your description of it.

## What you can offer

- Personalised birthday or celebration videos
- Shoutouts and greetings
- Custom safe-for-work photos or videos
- Reaction videos
- Answering a set number of questions
- Outfit selection or styling feedback
- Creative challenges
- Artwork, design or creative work
- Gaming coaching or gaming-related tasks
- Creator, business or content advice that is not regulated
- Tutorials or demonstrations
- Non-sexual voice notes or personalised messages
- Non-sexual video calls or consultations

## What you cannot offer

- Sexual acts or sexual services
- Nudity or explicit custom content
- Sexting, sex chat or sexual roleplay
- Sexual or fetish humiliation or degradation
- Explicit cam or video sessions
- Meetups, escorting or physical sexual services
- Anything involving illegal activity
- Anything requiring account access, card details, bank logins or control of an account
- Regulated legal, medical or financial services, unless separately approved
- Unrestricted "do anything I ask" requests

## Never accept a request for your account details

Nobody legitimately needs your bank login, your card details or access to your account to buy something from you. A request asking for any of them is an attempt to take your money, not a paid task — refuse it and [report it](/help/trust-and-safety/report-a-problem).

## Wording that works

- A 60-second personalised birthday video
- A custom safe-for-work outfit photo
- A 30-minute video call about content creation
- Five questions answered about growing your social profile

Notice what those have in common: a length, a count, or a subject. Something you can be held to, and something a buyer can tell has been delivered.

## Wording to avoid

- Anything you want
- Private session
- Custom nude
- Sex chat
- Cam show
- Worship session
- Anything asking for account or payment details

## If it is allowed but too vague

You will be asked to describe it more clearly rather than refused. "Vague" is a rewrite, not a rejection — and it protects you as much as the buyer, because a request nobody defined is a request nobody can agree has been finished.

## The money waits until you deliver

Payment for a request is held until you deliver and the buyer accepts. [How do paid requests work?](/help/selling/how-do-paid-requests-work)
MD,
            ],
            [
                'slug' => 'content-goal-rules',
                'title' => 'What can I set a content goal for?',
                'audience' => 'creator',
                'keywords' => 'piggy pot rules, content goal, goal, target, progress bar, group buy, what can i list, allowed, not allowed, cash, crowdfund, no reward, nothing in return',
                'summary' => 'A Piggy Pot sells one piece of content to several buyers and can show a goal alongside it. The goal is context — the content is what is being bought.',
                'related' => ['the-selling-rules', 'what-is-a-piggy-pot', 'what-is-a-reward', 'words-you-cannot-use'],
                'body' => <<<'MD'
A Piggy Pot sells **the same piece of content to several buyers**, and can show progress towards a goal while it does. Both halves matter, in this order: the content is the product, and the goal is context.

Say what the buyer receives and the goal can be almost anything. Show a goal with no content behind it and there is nothing being sold.

## Goals that are fine

- A camera or creator equipment goal
- A laptop, phone, lighting or studio upgrade
- A clothing, shoes or wardrobe goal
- A travel or event goal
- Funding a creative project
- A home-office or workspace goal
- A training or course goal
- A beauty, fitness or lifestyle goal
- Any other ordinary personal or creator goal

## What is refused

- A listing where the buyer receives nothing
- A generic ask for money
- A cash transfer
- Debt repayment as the thing being bought
- A household cost as the thing being bought
- Funding crypto or gambling
- Illegal or prohibited goods
- Sexual or fetish content as the reward

## Wording that works

- New camera goal — unlock my latest safe-for-work photo set
- Studio upgrade goal — purchase this behind-the-scenes video
- New shoes goal — unlock this exclusive creator photo bundle

Each one names the goal **and** the content, in that order, in one line.

## Wording to avoid

- Any wording asking for money towards the goal, with no content named
- Send me money
- Pay my debt
- Give me cash for shoes
- Tribute towards my goal

## The goal can never become the product

If the content is clear but the wording reads as a cash transfer, you will be asked to reword it. If there is no content item at all, there is nothing to reword — add one.

## Ranking is by how many people bought, not how much they spent

The supporter list on a Pot ranks by **number of purchases**, deliberately. It is a content product with several buyers, not a scoreboard of who paid the most.
MD,
            ],
            [
                'slug' => 'piggy-bank-rules',
                'title' => 'What can I say on my Piggy Bank?',
                'audience' => 'creator',
                'keywords' => 'piggy bank rules, choose your amount, support me, supporter posts, what can i say, allowed, not allowed, send me money, cash, tribute',
                'summary' => 'The Piggy Bank lets a supporter choose their own amount and receive access to your supporter posts. The access is what they are buying, so the listing has to say so.',
                'related' => ['the-selling-rules', 'what-is-the-piggy-bank', 'what-is-a-reward', 'words-you-cannot-use'],
                'body' => <<<'MD'
The Piggy Bank is the one product where the **buyer** chooses the amount. What they receive is access to your supporter posts — and because the amount is open, the listing has to be especially clear that something is being bought.

It is a **one-off** purchase, not a subscription. Nothing renews.

## What you can say

- Support tied to access to your supporter or profile posts
- An open amount, where the access the buyer receives stays clear
- What that access actually includes
- Ongoing safe-for-work posts for the supporters who bought it

## What you cannot say

- "Pay me for nothing"
- "Send me cash"
- A generic ask for money
- An unrestricted tribute payment
- Anything selling sexual or fetish access

## Wording that works

- Support my page and unlock access to my supporter posts
- Choose your amount and get access to my supporter feed
- Become a supporter and access my private updates

## Wording to avoid

- Send me money
- Pay me for nothing
- Cash gift
- Any wording that names no benefit at all
- Tribute me
- Send it straight to my bank

That last one is refused for a second reason as well: never point a supporter at a payment route outside this platform. See [the selling rules](/help/content-rules/the-selling-rules).

## Tribute, specifically

You may use the word in your wider creator branding. What it cannot do is turn the Piggy Bank into an open cash transfer — the access the buyer receives has to be visible in the listing either way.

## If your wording is vague

You will be asked to say what supporters get for it. That is the whole fix.
MD,
            ],
            [
                'slug' => 'recurring-content-rules',
                'title' => 'What can I sell as recurring content?',
                'audience' => 'creator',
                'keywords' => 'bills rules, recurring content, subscription rules, weekly, monthly, what can i sell, allowed, not allowed, pay my rent, pay my phone bill, rent, debt, expense, household cost',
                'summary' => 'Bills sell a weekly or monthly content stream. A personal cost can be your reason for selling it, but the content is what the supporter buys — and you are never asked to say what you spend the income on.',
                'related' => ['the-selling-rules', 'memberships-vs-bills', 'why-were-my-subscriptions-paused', 'words-you-cannot-use'],
                'body' => <<<'MD'
Bills sell **a recurring content stream** — weekly or monthly, up to {{price.max.bill}} a month. The supporter is buying that content.

A personal cost may well be your motivation for selling it. That is entirely your business, and **you are never asked to disclose what you spend the income on.** What the rule governs is the listing: the recurring content is the product, and a cost is not.

## What you can sell

- Weekly safe-for-work photo sets
- Monthly creator video bundles
- Recurring behind-the-scenes content
- Weekly or monthly creator updates
- Recurring tutorials, guides or digital content
- Any other clearly defined recurring non-explicit content

## What is refused

- A listing whose product is a household cost
- Debt repayment as the purchase
- A loan or credit-card repayment as the product
- Tax or financial obligations presented as a payment service
- A recurring transfer with no content
- Sexual or fetish recurring content

## Wording that works

- Monthly safe-for-work photo bundle
- Weekly behind-the-scenes video
- Monthly creator update pack
- A new set delivered every week

## Wording to avoid

- Anything naming a household cost or a debt
- Monthly tribute
- A fixed amount every week, with no content named

## The deliverable has to be clear

If a title or description names a cost as the thing being bought, you will be asked to reword it so the content is the product. The income is yours to spend however you like — it is the sentence on the listing that has to describe a purchase.

## You have to keep posting

Below {{cadence.min_posts}} member posts in {{cadence.window_days}} days, collection pauses until you are posting again. [Why have my subscription payments stopped?](/help/content-rules/why-were-my-subscriptions-paused)

## Bills or a membership?

They are different products on purpose — a Bill is one stream, a membership is tiers with a benefits bundle. [Memberships vs Bills](/help/selling/memberships-vs-bills)
MD,
            ],
            [
                'slug' => 'wish-and-unlock-rules',
                'title' => 'What can I list as a wish or a one-off unlock?',
                'audience' => 'creator',
                'keywords' => 'wish rules, wishlist rules, exclusive content, content unlock, one off, photo set, cosplay, feet, feet pics, nudes, explicit set, nsfw bundle, fetish, lingerie, allowed, not allowed, buy me these shoes, gift card, adult toys',
                'summary' => 'A Wish sells one piece of content, and can show a goal alongside it. The content is the product — we never source or ship a third-party item for you.',
                'related' => ['the-selling-rules', 'what-is-a-wishlist', 'price-limits', 'adult-creators-and-branding'],
                'body' => <<<'MD'
A Wish sells **one piece of content**, once. It can show a goal or wish alongside it, and it does not have to — a Wish with no goal line is simply a one-off content unlock, and the rules are the same either way.

The content is what is bought. **We never source, buy or ship a third-party item on your behalf** — a goal describes what you are working towards, it is not an order we fulfil.

## Goals that are fine

Clothing, shoes and accessories · technology and creator equipment · homeware and furniture · beauty and lifestyle · travel · gaming and hobby equipment · books, art supplies and creative equipment — and any other ordinary goal, paired with a real content item.

## Content that sells well here

- Safe-for-work photo sets
- Fashion, lifestyle and travel content
- Fitness and gym content
- Beauty or makeup content
- Cosplay, kept non-explicit
- Behind-the-scenes videos
- Tutorials and how-to content
- Q&As and creator updates
- Audio, music or voice content
- Art, guides and other digital content

## What is refused

- A personal item listed as though we are selling or sourcing it
- A cash-equivalent reward, such as a voucher
- Crypto or gambling credit
- Weapons or illegal goods
- Prescription or controlled medicines
- Adult toys or sexual products
- Sexual or fetish content as the reward
- Nudity or explicit content
- Content sexualising or exploiting a minor, in any form

## Wording that works

- Designer shoes goal — unlock my exclusive safe-for-work photo set
- New laptop goal — purchase my behind-the-scenes creator bundle
- Holiday goal — unlock this travel Q&A video

## Wording to avoid

- Buy me these shoes
- Send me money for a handbag
- Pay for my holiday
- Give me cash
- Nudes, explicit sets, NSFW bundles
- Anything marketed as fetish content

## Ordinary content is not refused for what it could be read as

Normal body parts and ordinary clothing are **not** blocked because they can appear in fetish contexts. A beach photo that happens to show bare feet is not the same listing as one marketed specifically as feet content, and it is not treated as one.

Where an image is genuinely borderline, a person looks at it rather than a filter guessing. [Who reviews my content?](/help/content-rules/who-reviews-my-content)

## The optional goal line

A Wish can carry a separate, optional **goal label** — a line shown on the card and the progress bar only. It never appears at checkout, on the pay button, on a receipt or on a bank statement, all of which always describe the content. Both fields are checked against the same rules. [What should I call my listing?](/help/selling/what-should-i-call-my-listing)
MD,
            ],
            [
                'slug' => 'shop-product-rules',
                'title' => 'What can I sell in my shop?',
                'audience' => 'creator',
                'keywords' => 'shop rules, product rules, digital products, physical products, merch, prints, presets, ebook, what can i sell, allowed, not allowed, counterfeit, replica, resell',
                'summary' => 'Your shop sells digital or physical products. They have to be legal, genuine, accurately described, and yours to sell.',
                'related' => ['the-selling-rules', 'shipping-physical-products', 'selling-to-buyers-in-the-us', 'price-limits'],
                'body' => <<<'MD'
Your shop sells clearly described **digital or physical products**, up to {{price.max.shop}}. Four conditions apply to all of them: legal, genuine, accurately described, and yours to sell.

That last one catches more listings than the others. You need the right to sell it — your own work, or something you are licensed to resell.

## What you can sell

- Safe-for-work photos and photo sets
- Safe-for-work videos and video bundles
- PDFs, guides and e-books
- Templates, presets and printables
- Artwork and digital illustrations
- Audio, music or recorded content
- Tutorials and creator resources
- Prints, posters and signed photos
- Creator merchandise such as clothing or accessories
- Books, stationery and ordinary collectibles
- Other ordinary legal digital or physical creator products

## What is refused

- Explicit sexual content
- Fetish content sold for sexual gratification
- Sex toys or sexual products
- Illegal drugs or controlled substances
- Weapons or explosives
- Counterfeit or stolen goods
- Gambling products or credit
- Cryptocurrency or financial instruments
- Prescription medicines
- Anything you do not own or have the right to sell

## Wording that works

- 10-photo safe-for-work fashion set
- Creator posing guide PDF
- Signed A4 print
- Digital preset pack
- Limited-edition creator T-shirt

Each names the format and the quantity. That is what makes a product description accurate rather than optimistic.

## Wording to avoid

- Explicit photo pack
- Fetish bundle
- Cash voucher
- Crypto token
- Replica designer item
- Prescription medication

## What review looks at

The title, the description, the thumbnail **and** the file or link you deliver. A clean title with a prohibited file attached is refused on the file.

## Digital delivery

A delivery link has to be direct and secure, and clearly the thing that was bought. Link shorteners are refused, because they hide the destination from the buyer and from review.

## Physical products

Postage, legality and restricted-product checks apply on top. [Shipping physical products](/help/selling/shipping-physical-products) covers how postage is set, and [selling to buyers in the US](/help/selling/selling-to-buyers-in-the-us) covers what changes for US orders.

## High-value listings

A listing priced unusually high is held for a closer look before it goes on sale, and a high-value order is held until delivery is confirmed. Nothing is wrong — it is the same check a bank makes, and it clears.
MD,
            ],
            [
                'slug' => 'profile-and-bio-rules',
                'title' => 'What can I put in my bio and my posts?',
                'audience' => 'creator',
                'keywords' => 'bio rules, profile rules, post rules, banner, profile photo, branding, links, social handles, what can i write, bio rejected, allowed, not allowed, off platform, cash app',
                'summary' => 'Your wider creator identity can be adult-focused. Your profile, bio, banner and posts here follow the same non-explicit standard as anything you sell.',
                'related' => ['adult-creators-and-branding', 'why-is-my-profile-still-in-review', 'my-profile-was-rejected', 'can-i-link-to-my-other-platforms'],
                'body' => <<<'MD'
Your profile is judged by exactly the same standard as your paid content: **non-explicit**. Nothing more is asked of it, and nothing less.

You are not required to hide who you are elsewhere. What you cannot do is use the profile to sell, or to point at, something this platform does not allow.

## What you can have

- Adult-creator identifiers in your general branding, where they describe your wider persona
- Creator names such as Goddess, Princess, Queen, Master, Domme, Findom or Cashmaster
- The links and social handles this platform allows
- Safe-for-work profile photos and banners
- Safe-for-work posts, updates, polls and messages
- References to your broader creator work, as long as they are not selling prohibited content or services here

## What is refused

- Explicit images in a profile photo, a banner or a post
- Selling or soliciting sexual or fetish services through the bio
- Instructions to pay you outside this platform
- Anything directing supporters around the payment rules
- A sexual or fetish menu or price list
- Illegal goods or services
- A misleading identity, or impersonating someone else

## Bio wording that works

- Adult creator | lifestyle, fashion and creator updates
- Findom creator | this is where I share safe-for-work supporter content
- Goddess X | exclusive safe-for-work updates and memberships

Each states who they are and what is sold **here**. That is the whole trick, and it is why an adult-focused persona is not a problem.

## Bio wording to avoid

- Any instruction to pay you through another app or by bank transfer
- Any reference to an explicit menu, here or elsewhere
- Sexual or fetish services offered
- An ask for money with nothing named in return

## Your identity is not what is being judged

An account is **not** refused because the creator's wider identity is adult-focused. The question is always what is being sold. If a reviewer cannot tell the two apart from what you have written, that is usually a wording fix — see [I'm an adult creator — can I use Spenny Piggy?](/help/content-rules/adult-creators-and-branding).

## Your photo and bio are reviewed

Both are checked before they go live, and again when you change them. If yours comes back, the reason is on your own dashboard and names what to change: [my profile was rejected](/help/getting-started-creators/my-profile-was-rejected).

## Links off the platform

Some are allowed and some are not, and it is not about where they point so much as what they are for. [Can I link to my other platforms?](/help/content-rules/can-i-link-to-my-other-platforms)
MD,
            ],
        ];
    }
}
