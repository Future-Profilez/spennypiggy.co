<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * The ONE definition of every customer-facing risk / account-state message.
 *
 * Source: client brief "Spenny Piggy — Customer-Facing Messaging Brief" (9 Aug 2026),
 * 18 states — 11 supporter-facing, 7 creator-facing. Copy is used VERBATIM;
 * it was signed off by the client and is a Stripe-facing surface.
 *
 * Why this class exists: the same sentence used to be written in 18 places
 * (14 in RiskEngineService, 4 more hardcoded in checkout JSX) and had already
 * drifted — "Guest checkout is disabled" vs "Guest checkout is currently
 * disabled". Changing wording meant finding every copy, and missing one was
 * silent.
 *
 * THREE RULES, enforced by tests/Feature/RiskMessagesGoldenRulesTest.php:
 *
 *  1. NEVER reveal a threshold to a supporter. No cooldown minutes, no spend
 *     headroom, no attempt count, no "N new creators per day". Anyone testing
 *     stolen cards would use it to stay just under the line. This is why
 *     nothing here interpolates a limit value, and why the cooldown copy says
 *     "in a little while" rather than counting down.
 *  2. NEVER imply the supporter is a criminal. The banned words are
 *     fraud / suspicious / flagged / violation / risk / denied / blocked, plus
 *     any internal platform state name (THROTTLE, FREEZE). The overwhelming
 *     majority of people hitting these are genuine.
 *  3. ALWAYS give a next step and a rough timeframe. A dead end is what sends
 *     someone to their bank instead of our chat — and that is a chargeback we
 *     caused ourselves.
 *
 * AUDIENCE IS RESOLVED SERVER-SIDE, never in JSX. A guest has no /history, no
 * dashboard and no account, so a message built for a logged-in supporter points
 * them at a page they cannot reach. Passing a resolved `cta` (null for guests)
 * makes that mistake structurally impossible rather than a rule to remember.
 */
class RiskMessages
{
    public const AUDIENCE_GUEST = 'guest';

    public const AUDIENCE_AUTH = 'auth';

    public const AUDIENCE_CREATOR = 'creator';

    /**
     * Words that must never appear in a supporter-facing message.
     * "risk" is included deliberately: the engine is called the risk engine
     * internally, and that word has no place in front of the person paying.
     */
    public const BANNED_SUPPORTER_WORDS = [
        'fraud', 'fraudulent', 'suspicious', 'flagged', 'violation',
        'risk', 'denied', 'blocked', 'declined by us', 'security reasons',
        'throttle', 'freeze', 'elevated',
    ];

    /**
     * The only digit-bearing string allowed in supporter copy: the £1 card
     * verification charge is a fixed, disclosed price the supporter is about to
     * pay — not a threshold anyone can game by staying under it.
     */
    public const SUPPORTER_DIGIT_ALLOWLIST = ['£1'];

    /**
     * Reason codes emitted by RiskEngineService / Helpers mapped onto the
     * brief's message states. Several codes share a message on purpose — a
     * supporter does not need to know whether they were slowed down for
     * velocity or for repeat attempts, only that it is a short pause.
     */
    public const REASON_CODE_MAP = [
        // Msg 1 — step-up
        'HIGH_VALUE_TX' => 'STEP_UP_REQUIRED',
        'ACCELERATION_3_IN_10M' => 'STEP_UP_REQUIRED',
        'HIGH_VALUE_VELOCITY_2H' => 'STEP_UP_REQUIRED',

        // Msg 3 — cooldown
        'ACTIVE_COOLDOWN' => 'COOLDOWN_ACTIVE',
        'VELOCITY_5_IN_10M' => 'COOLDOWN_ACTIVE',
        'RAPID_AFTER_STEP_UP' => 'COOLDOWN_ACTIVE',

        // Msg 4 — spend cap
        'LIMIT_EXCEEDED_1H' => 'SPEND_CAP_REACHED',
        'LIMIT_EXCEEDED_24H' => 'SPEND_CAP_REACHED',
        'LIMIT_EXCEEDED_7D' => 'SPEND_CAP_REACHED',

        // Msg 5 — cross-creator
        'NEW_CREATOR_RESTRICTED' => 'CROSS_CREATOR_RESTRICTED',
        'NEW_CREATOR_LIMIT' => 'CROSS_CREATOR_RESTRICTED',

        // Msg 6 — new creator's own daily cap
        'NEW_CREATOR_VOLUME_LIMIT' => 'NEW_CREATOR_VOLUME_LIMIT',

        // Msg 7 — guest checkout unavailable
        'GUEST_CHECKOUT_DISABLED' => 'GUEST_ACCOUNT_REQUIRED',
        'GUEST_BLOCKED_IN_STATE' => 'GUEST_ACCOUNT_REQUIRED',
        // Deliberately a DIFFERENT state: this one is about the size of the
        // payment, not about the platform running extra checks. Telling someone
        // paying £60 that "guest checkout is switched off for a bit" is simply
        // untrue — they could pay a smaller amount right now.
        'HIGH_VALUE_GUEST' => 'GUEST_ACCOUNT_REQUIRED_VALUE',

        // Hard block — an identity an admin has stopped
        'IDENTITY_BLOCKED' => 'IDENTITY_BLOCKED',
    ];

    /**
     * Message states.
     *
     * A state is either a flat definition (same for everyone) or keyed by
     * audience. `cta` / `cta_secondary` are {label, route, params} — `route`
     * null means the surface supplies its own action (open the chat, submit a
     * form) and `false` means there is deliberately no link for this audience.
     */
    protected const STATES = [

        // ---------------------------------------------------------------
        // SUPPORTER-FACING — 11 states
        // ---------------------------------------------------------------

        // 1 — Step-up, one-time code required.
        // Framed as a check, never as a rejection: the brief is explicit that
        // "this isn't a rejection" is the line that stops the retry spiral.
        'STEP_UP_REQUIRED' => [
            'audience_class' => 'supporter',
            'title' => 'Quick check — just to be safe 🐷',
            'body' => "We've sent a code to your email. Pop it in below and you're through.\n\nThis isn't a rejection — it's how we make sure it's really you before a payment goes out. Takes about ten seconds. ✨",
            'next_step' => 'Enter the code we emailed you.',
            'cta' => ['label' => 'Enter code', 'route' => null],
            'cta_secondary' => ['label' => 'Resend code', 'route' => null],
        ],

        // 2 — Step-up code did not match.
        'STEP_UP_CODE_FAILED' => [
            'audience_class' => 'supporter',
            'title' => "That code didn't match 📩",
            'body' => 'Have another go, or resend a fresh one. Check your spam folder too — they hide in there sometimes.',
            'next_step' => 'Try the code again, or resend a fresh one.',
            'cta' => ['label' => 'Try again', 'route' => null],
            'cta_secondary' => ['label' => 'Resend code', 'route' => null],
        ],

        // 2b — The code has run out. Distinct from a wrong code: there is
        // nothing to retype, so the only useful action is a fresh one.
        'STEP_UP_CODE_EXPIRED' => [
            'audience_class' => 'supporter',
            'title' => 'That code has expired 📩',
            'body' => "They only last a few minutes. Send yourself a fresh one and you're through.",
            'next_step' => 'Resend a fresh code.',
            'cta' => ['label' => 'Resend code', 'route' => null],
        ],

        // 2c — Too many wrong codes.
        // ⚠️ Says nothing about how many attempts there were or how many are
        // left, and never suggests the person was doing something wrong.
        'STEP_UP_CODE_LOCKED' => [
            'audience_class' => 'supporter',
            'title' => "Let's start that one again 📩",
            'body' => "We'll send you a brand new code — the old one's no good now.\n\nCheck your spam folder when it arrives, they hide in there sometimes.",
            'next_step' => 'Request a new code.',
            'cta' => ['label' => 'Send a new code', 'route' => null],
        ],

        // 3 — Cooldown.
        // ⚠️ The exact duration is NEVER shown. "In a little while" is
        // deliberate — a precise countdown tells a card tester exactly when to
        // resume. Do not reintroduce a timer here or in the payload.
        'COOLDOWN_ACTIVE' => [
            'audience_class' => 'supporter',
            'title' => "Let's pause for a sec ⏳",
            'body' => "There have been a few payment attempts in a short space of time, so we've put a short hold on this one. Have a cuppa and try again in a little while. ☕\n\nTrying repeatedly will only extend the wait — one clean attempt afterwards is all you need.\n\nIf your card keeps being declined, it's worth checking with your bank first. Most declines are an international payment block, and one quick phone call sorts it.",
            'next_step' => 'Try again in a little while — one clean attempt is all you need.',
            'cta' => null,
        ],

        // 4 — Spend cap reached.
        // 4a (auth) links /history, which is the one screen that answers this
        // without a support ticket. 4b (guest) must NOT: a guest has no
        // /history, and guest limits are keyed to card fingerprint, device and
        // IP — a running total on an unauthenticated screen hands a card tester
        // a live readout of exactly how much headroom is left.
        'SPEND_CAP_REACHED' => [
            'audience_class' => 'supporter',
            self::AUDIENCE_AUTH => [
                'title' => "You've hit your spending limit for now 💳",
                'body' => "There's a cap on how much can be spent in a short window. It's there to protect people whose card details get stolen — and once in a while it catches someone genuinely generous instead. 🐷\n\nYou can see your spend and current limits in your support history. The limit lifts on its own — no need to do anything.\n\nSomething not right? Give us a shout on the chat and we'll take a look.",
                'next_step' => 'The limit lifts on its own — check your support history any time.',
                'cta' => ['label' => 'See my spend and limits', 'route' => 'support.history.page', 'fragment' => '#limits'],
            ],
            self::AUDIENCE_GUEST => [
                'title' => "You've hit your spending limit for now 💳",
                'body' => "There's a cap on how much can be spent in a short window. It protects people whose card details get stolen — and now and then it catches someone genuinely generous instead. 🐷\n\nThe limit lifts on its own, so you can come back a bit later and pick up where you left off. Nothing's been charged.\n\nWant to keep track of this? Creating an account shows you your spend and your current limits any time. Takes about a minute. ✨\n\nSomething not right? Give us a shout on the chat.",
                'next_step' => "The limit lifts on its own — come back a bit later. Nothing's been charged.",
                'cta' => ['label' => 'Create an account', 'route' => 'register'],
                'cta_secondary' => ['label' => 'Back to creator', 'route' => null],
            ],
        ],

        // 5 — Cross-creator restriction.
        // Wording is account-neutral on purpose so ONE string serves guests and
        // logged-in supporters. Never say "your account" here.
        'CROSS_CREATOR_RESTRICTED' => [
            'audience_class' => 'supporter',
            'title' => "That's a lot of creators in a short time 👀",
            'body' => "You've supported quite a few creators very quickly, so we've paused things briefly while that settles.\n\nNothing's wrong and nothing's been charged. Try again a bit later, or drop us a message on the chat if you think something's off.",
            'next_step' => "Try again a bit later — nothing's been charged.",
            'cta' => null,
        ],

        // 6 — The creator's own daily cap.
        // Framed as being about THE CREATOR, never about the supporter — they
        // have done nothing at all here.
        'NEW_CREATOR_VOLUME_LIMIT' => [
            'audience_class' => 'supporter',
            'title' => "This creator's just getting started 🌱",
            'body' => "New creators have a daily limit while they find their feet — and this one's hit it for today.\n\nTry again tomorrow, or grab something from their profile another time. They'll be glad you came back. 🐷",
            'next_step' => 'Try again tomorrow.',
            'cta' => null,
        ],

        // 7 — Guest checkout unavailable (platform state, or the value gate).
        'GUEST_ACCOUNT_REQUIRED' => [
            'audience_class' => 'supporter',
            'title' => "You'll need an account for this one 🔐",
            'body' => "We're running some extra checks at the moment, so guest checkout is switched off for a bit.\n\nCreating an account takes about a minute and means you can see everything you've bought in one place. There's a one-off £1 card verification when you sign up — here's why.",
            'next_step' => 'Create an account — it takes about a minute.',
            'cta' => ['label' => 'Create an account', 'route' => 'register'],
        ],

        // 7b — Guest checkout unavailable because of the SIZE of the payment.
        // ⚠️ The threshold itself is never stated. The old copy read "Larger
        // payments more than £50 need to login", which handed anyone testing
        // stolen cards the exact figure to stay under — rule 1, broken in the
        // most literal way possible.
        'GUEST_ACCOUNT_REQUIRED_VALUE' => [
            'audience_class' => 'supporter',
            'title' => "You'll need an account for this one 🔐",
            /*
             * ⚠️ THE ACTION FIRST, THE REASSURANCE AFTER — and still no number.
             *
             * The previous wording opened with "For a payment this size we'll
             * need you signed in" and buried "create an account" in the third
             * line, so somebody who had just been stopped mid-purchase read four
             * lines before finding out what to do. Reported from the live login
             * screen, 21 Aug 2026.
             *
             * 🚨 It STILL does not state the threshold, and it must never
             * start. That is rule 1 of this file: the old copy read "Larger
             * payments more than £50 need to login", which tells anyone testing
             * stolen cards exactly what to stay under — the one thing that turns
             * a limit into a target.
             */
            'body' => "This purchase needs an account — it takes about a minute to make one.\n\nHaving one means the purchase is tied to you: you can find it again, and we can help if anything goes wrong. There's a one-off £1 card verification when you sign up — here's why.",
            'next_step' => 'Create an account — it takes about a minute.',
            'cta' => ['label' => 'Create an account', 'route' => 'register'],
            'cta_secondary' => ['label' => 'Log in', 'route' => 'login'],
        ],

        // 8 — Platform state: throttle / freeze.
        // ⚠️ NEVER say "elevated risk", "fraud", "under attack", or anything
        // suggesting instability, and NEVER surface the internal state name.
        'PLATFORM_STATE_ACTIVE' => [
            'audience_class' => 'supporter',
            'title' => 'Bear with us a moment ⏸',
            'body' => "We're running some extra safety checks across the platform right now, so a few things are moving a little slower than usual.\n\nNothing's wrong with your account or your card. Try again shortly — this doesn't usually last long.",
            'next_step' => "Try again shortly — this doesn't usually last long.",
            'cta' => null,
        ],

        // 9 — Review hold: the payment SUCCEEDED and is held for checks.
        // ⚠️ Verified in code: review_hold withholds the CREATOR's funds only —
        // the deliverable is still written `delivered`
        // (StripeWebhookController ~:1376). So "your content is on its way" is
        // true today. If deliverable-level holding is ever switched on
        // (the branch at ~:6480, currently commented out), THIS COPY BECOMES A
        // LIE and must change with it.
        'REVIEW_HOLD' => [
            'audience_class' => 'supporter',
            'title' => 'Payment received — just running a quick check ✅',
            'body' => "Your payment's gone through and your content is on its way. We're running a standard check first, which is usually done in no time.\n\nKeep an eye on your email — your receipt and download link land there as soon as it clears.",
            'next_step' => 'Keep an eye on your email — your receipt lands there shortly.',
            'cta' => null,
        ],

        // 10 — Generic bank decline. Nothing to do with us, and saying so is
        // what stops the supporter phoning us about their own card issuer.
        'BANK_DECLINE' => [
            'audience_class' => 'supporter',
            'title' => 'Your bank said no 🏦',
            'body' => "That one didn't get past your card issuer — and annoyingly, they don't tell us why.\n\nWorth trying, in order:\n• Pay by Bank if it's available where you are — it clears more reliably and costs you less 🐷\n• Double-check the card number, expiry and billing address (that's the one people get wrong)\n• Complete the bank's verification screen fully — don't close it early\n• Give your bank a ring: \"I'm making an online purchase and it's being declined\" usually fixes it on the spot",
            'next_step' => 'Try Pay by Bank, or check the card details and billing address.',
            'cta' => null,
        ],

        // 11 — 3DS forced.
        'THREE_DS_REQUIRED' => [
            'audience_class' => 'supporter',
            'title' => 'One more step with your bank 🔐',
            'body' => "Your bank wants to confirm this one. You'll be popped over to their screen for a few seconds.\n\nDon't close the window or switch apps — wait for it to bounce you back, or the payment won't complete.",
            'next_step' => "Wait for your bank's screen to bounce you back — don't close it.",
            'cta' => null,
        ],

        // 12 — Card refused for this purchase; Pay by Bank is the way through.
        //
        // ⚠️ NOT one of the brief's 18 states. Added 11 Aug 2026 on the client's
        // own wording, when the decision on high-value card payments landed:
        // instead of blocking card outright above the card ceiling, the buyer
        // risk screen now runs there too, and a buyer who fails it is sent to
        // Pay by Bank rather than refused. The first sentence of `body` is the
        // client's copy verbatim.
        //
        // ⚠️ Says nothing about WHY, and above all names no amount. The reason
        // this fires is a threshold plus a risk signal, and both are exactly
        // what rule 1 exists to keep off the screen — "payments over £X need
        // Pay by Bank" would tell a card tester precisely where to sit.
        'CARD_UNAVAILABLE_USE_BANK' => [
            'audience_class' => 'supporter',
            'title' => "Let's do this one by bank 🏦",
            'body' => "This payment can't be completed by card. Please pay securely using Pay by Bank.\n\nYou'll approve it inside your own banking app, so nothing sensitive comes near us — and it usually costs you less than paying by card. 🐷",
            'next_step' => 'Choose Pay by Bank on the payment screen.',
            'cta' => null,
        ],

        // Hard block — an identity an admin has stopped by hand. Deliberately
        // gives no reason and no retry: there is nothing the person can do on
        // their own, and the chat is the only honest next step.
        'IDENTITY_BLOCKED' => [
            'audience_class' => 'supporter',
            'title' => "We can't take this one 🐷",
            'body' => "We're not able to put this payment through at the moment.\n\nDrop us a message on the chat and we'll pick it up from there.",
            'next_step' => 'Give us a shout on the chat and we\'ll take a look.',
            'cta' => null,
        ],

        // Fallback for a reason code with no mapping. It still has to obey all
        // three rules — the old fallback ("Payment blocked for security
        // reasons.") broke every one of them.
        'GENERIC_HOLD' => [
            'audience_class' => 'supporter',
            'title' => "We couldn't put that one through 🐷",
            'body' => "Nothing's been charged. It's worth trying again shortly.\n\nIf it keeps happening, drop us a message on the chat and we'll sort it with you.",
            'next_step' => "Try again shortly — nothing's been charged.",
            'cta' => null,
        ],

        // ---------------------------------------------------------------
        // CREATOR-FACING — 7 states
        //
        // Specificity matters more here than anywhere else. A creator CAN be
        // told numbers — their own posting requirement, their own reserve
        // percentage — because those are their account's terms, not a threshold
        // a card tester can stay under.
        // ---------------------------------------------------------------

        // 12 — Subscription lapsed. Two audiences, two messages.
        'CREATOR_SUBSCRIPTION_INACTIVE' => [
            'audience_class' => 'both',
            self::AUDIENCE_GUEST => [
                'title' => "This creator's page is paused right now ⏸",
                'body' => "They'll be back shortly. Worth checking their socials in the meantime. 🐷",
                'next_step' => 'Check back shortly.',
                'cta' => null,
            ],
            self::AUDIENCE_AUTH => [
                'title' => "This creator's page is paused right now ⏸",
                'body' => "They'll be back shortly. Worth checking their socials in the meantime. 🐷",
                'next_step' => 'Check back shortly.',
                'cta' => null,
            ],
            self::AUDIENCE_CREATOR => [
                'title' => "Your subscription's lapsed — payments are paused 🐷",
                'body' => "Nobody can buy from you until it's active again. Everything's exactly where you left it, and it comes straight back on when you renew.\n\n:price a month. Sort it now and you're back earning in under a minute. ✨",
                'next_step' => 'Renew now — you\'re back earning in under a minute.',
                'cta' => ['label' => 'Renew my subscription', 'route' => 'activate-subscription'],
                // The price is NEVER retyped here — SubscriptionPlan is the one
                // source, and a stale figure on this screen is how Disputes.jsx
                // came to advertise £4/month long after the price changed.
                'requires' => ['price'],
            ],
        ],

        // 12b — The creator's page is paused because they are BEHIND ON POSTING.
        //
        // Split out of CREATOR_SUBSCRIPTION_INACTIVE on 14 Aug 2026 (client
        // direction, off the back of an Intercom ticket): the one collapsed
        // "they'll be back shortly" answer told a supporter nothing they could
        // act on, and this is the one pause reason where they genuinely can —
        // a nudge to the creator is what ends it.
        //
        // ⚠️ It is also the only pause reason that discloses nothing private.
        // A lapsed subscription or a Stripe account problem is the creator's
        // billing position and stays behind the generic message; "they owe some
        // posts" is a content rule, visible from their own public feed anyway.
        //
        // ⚠️ NO COUNT. Rule 1 forbids a number in supporter copy, and the
        // requirement is the creator's own term — the creator is told ":required
        // approved posts every :window days" on their dashboard, the supporter
        // is told there are some outstanding.
        'CREATOR_CONTENT_PAUSED' => [
            'audience_class' => 'supporter',
            'title' => "This creator's page is paused right now ⏸",
            'body' => "They've got some new posts to publish before purchases can go through again — and it switches back on the moment they do.\n\nWorth giving them a nudge on their socials in the meantime. 🐷",
            'next_step' => 'Give them a nudge — it comes back on as soon as they post.',
            'cta' => null,
        ],

        // 20 — Creator sign-up is paused platform-wide.
        //
        // 🚨 This replaces the copy that used to live inline in
        // RegisteredUserController: "New creator registration is temporarily
        // paused due to system maintenance." That sentence was a LIE — the
        // platform is not under maintenance, it has stopped opening new creator
        // accounts because a safety threshold tripped. We do not have to say
        // which threshold (rule 1), but we must not invent a different reason:
        // the person finds out it was untrue the moment support tells them
        // something else, and this is the first thing the platform ever says to
        // them.
        //
        // ⚠️ The CTA has `route => null` DELIBERATELY. The action is the
        // waitlist form rendered on the registration screen itself — sending
        // someone somewhere else to leave an email is one step more than they
        // will take, and this state exists precisely because we were losing
        // them at this exact moment.
        'CREATOR_SIGNUP_PAUSED' => [
            'audience_class' => 'creator',
            'title' => "We've paused new creator sign-ups ⏸",
            'body' => "We're not opening new creator accounts at the moment — it's a temporary pause on our side, and it's nothing to do with you or anything you've entered.\n\nLeave your email and we'll write to you the moment it opens. You won't have to check back. 🐷",
            'next_step' => "Leave your email and we'll tell you the moment sign-ups reopen.",
            'cta' => ['label' => 'Tell me when it opens', 'route' => null],
        ],

        // 13 — Posting rule. The WARNING is the highest-value message in the
        // brief: it prevents the pause happening at all, which is the cheapest
        // prevention on the list.
        'CREATOR_POSTING_PAUSED' => [
            'audience_class' => 'creator',
            'title' => 'Your recurring features have paused ⏸',
            'body' => "You need :required approved posts every :window days to keep memberships and recurring content running — and this window's come up short.\n\nGood news: posting brings it straight back. No penalty, no appeal, no waiting on us.\n\nYour one-off sales are unaffected and still earning. 🐷",
            'next_step' => 'Publish a post — your recurring features come straight back.',
            'cta' => ['label' => 'Create a post', 'route' => 'dashboard', 'params' => ['add' => 'post']],
        ],

        'CREATOR_POSTING_WARNING' => [
            'audience_class' => 'creator',
            'title' => 'Heads up — a couple of posts to go 📅',
            'body' => "You've got :days_left days left in this window and need :posts_needed more posts to keep your recurring features running.\n\nPop something up and you're sorted. 🐷",
            'next_step' => 'Publish a post before the window closes.',
            'cta' => ['label' => 'Create a post', 'route' => 'dashboard', 'params' => ['add' => 'post']],
        ],

        // 14 — Account status issue.
        // ⚠️ ALWAYS substitute the specific reason. "Account status issue" on
        // its own is exactly what this whole brief exists to get away from —
        // a generic string here is the bug, not the fallback.
        'CREATOR_ACCOUNT_ISSUE' => [
            'audience_class' => 'creator',
            'title' => 'Something needs your attention ⚠',
            'body' => "There's an issue on your account that's stopping payments coming through.\n\n:reason\n\nHead to your dashboard — it'll tell you exactly what's needed and how to sort it.\n\nStuck? Chat bubble, bottom right. We'll walk you through it. 🐷",
            'next_step' => 'Head to your dashboard to see exactly what\'s needed.',
            'cta' => ['label' => 'Go to my dashboard', 'route' => 'dashboard'],
            'requires' => ['reason'],
        ],

        // 15 — Reserve applied or increased.
        'CREATOR_RESERVE_APPLIED' => [
            'audience_class' => 'creator',
            'title' => 'A reserve has been applied to your account 🐷',
            'body' => ":percent% of your earnings is being held for :days days before release. Here's why:\n\n:reason\n\nIt releases automatically — no forms, no asking. Your countdown is right here. ⏳\n\nThink this isn't right? Appeal it below and a human will take a look.",
            'next_step' => 'It releases automatically — no action needed.',
            'cta' => ['label' => 'Appeal this', 'route' => null],
            'requires' => ['percent', 'days', 'reason'],
        ],

        // 16 — Payout held.
        // The brief calls this "the single scariest message a creator can
        // receive". Never leave it unexplained, and always say the money is safe.
        'CREATOR_PAYOUT_HELD' => [
            'audience_class' => 'creator',
            'title' => "Friday's payout is on hold ⏸",
            'body' => "Reason: :reason\n\nYour money is safe and it isn't going anywhere. Sort the above and it'll go out on the next weekly run. 🐷",
            'next_step' => 'Sort the reason above and it goes out on the next weekly run.',
            'cta' => ['label' => 'View my payouts', 'route' => 'financial.dashboard'],
            'requires' => ['reason'],
        ],

        // 17 — Early fraud warning. Creator-facing, so the word "fraud" is
        // correct here — it is what the card issuer told us, and softening it
        // would cost the creator the window to act.
        'CREATOR_FRAUD_WARNING' => [
            'audience_class' => 'creator',
            'title' => 'Heads up — one to act on quickly ⚠',
            'body' => "We've had a fraud warning from the card issuer on a recent payment. That usually means the card was used without the owner's permission.\n\nOur recommendation: refund it now. A refund costs you the sale. A chargeback costs you the sale, a dispute fee, and a mark against your account.",
            'next_step' => 'Refund this payment now to avoid a chargeback and dispute fee.',
            'cta' => ['label' => 'Refund this payment', 'route' => null],
            'cta_secondary' => ['label' => 'Tell me more', 'route' => null],
        ],

        // 18 — Referral bonus ready. Unclaimed money creates "why didn't anyone
        // tell me" tickets, so this warrants a dashboard badge AND an email.
        'CREATOR_REFERRAL_BONUS_READY' => [
            'audience_class' => 'creator',
            'title' => "You've got money waiting 💸",
            'body' => ":amount in referral bonuses has landed and is ready to send.\n\nPress the button and it goes out as a separate payment. It won't send itself — so go on. 🐷",
            'next_step' => 'Press the button and your bonus goes out as a separate payment.',
            'cta' => ['label' => 'Send my bonus', 'route' => null],
            'requires' => ['amount'],
        ],
    ];

    /**
     * Resolve the audience for the current request.
     *
     * Pass $isGuest explicitly wherever the caller already knows (the risk
     * engine resolves it from the request context); otherwise it falls back to
     * the session. It never reads RiskIdentity.is_guest — that column is a
     * one-way latch and cannot be trusted to say someone is a guest.
     */
    public static function audienceFor(?bool $isGuest = null): string
    {
        if ($isGuest === null) {
            $isGuest = ! Auth::check();
        }

        return $isGuest ? self::AUDIENCE_GUEST : self::AUDIENCE_AUTH;
    }

    /**
     * Map a set of engine reason codes onto a message key.
     * First recognised code wins — the engine returns its decisive rule first.
     */
    public static function keyForReasonCodes(array $reasonCodes): string
    {
        foreach ($reasonCodes as $code) {
            if (isset(self::REASON_CODE_MAP[$code])) {
                return self::REASON_CODE_MAP[$code];
            }
        }

        return 'GENERIC_HOLD';
    }

    /**
     * Build the rendered message for a state.
     *
     * @param  array  $vars  placeholder values, e.g. ['reason' => '…', 'days' => 30]
     * @return array{key:string,audience:string,title:string,body:string,next_step:string,cta:?array,cta_secondary:?array}
     */
    public static function get(string $key, ?string $audience = null, array $vars = []): array
    {
        $audience = $audience ?: self::audienceFor();
        $state = self::STATES[$key] ?? self::STATES['GENERIC_HOLD'];

        if (! isset(self::STATES[$key])) {
            $key = 'GENERIC_HOLD';
        }

        // Audience-specific variant, falling back to the shared definition.
        //
        // 🚨 The fallback NEVER crosses the supporter/creator line. It used to
        // prefer `creator` unconditionally, so the first state defining
        // `creator` + `auth` but no `guest` would have silently handed a guest
        // the creator's copy — which is where reserve percentages, payout hold
        // reasons and account states live. Nothing hits that today; the point is
        // that nothing ever can.
        //
        // A supporter audience falls back only to the other supporter variant;
        // a creator audience only to a creator one. With neither, the shared
        // definition is used, and a state that has no shared definition either
        // renders empty rather than borrowing someone else's message.
        $variant = $state[$audience] ?? null;
        if ($variant === null) {
            $variant = match ($audience) {
                self::AUDIENCE_GUEST => $state[self::AUDIENCE_AUTH] ?? null,
                self::AUDIENCE_AUTH => $state[self::AUDIENCE_GUEST] ?? null,
                self::AUDIENCE_CREATOR => $state[self::AUDIENCE_CREATOR] ?? null,
                default => null,
            };
        }
        $definition = $variant ?? $state;

        return [
            'key' => $key,
            'audience' => $audience,
            'title' => self::interpolate($definition['title'] ?? '', $vars),
            'body' => self::interpolate($definition['body'] ?? '', $vars),
            'next_step' => self::interpolate($definition['next_step'] ?? '', $vars),
            'cta' => self::resolveCta($definition['cta'] ?? null, $audience),
            'cta_secondary' => self::resolveCta($definition['cta_secondary'] ?? null, $audience),
        ];
    }

    /**
     * Convenience: build the message straight from engine reason codes.
     */
    public static function forReasonCodes(array $reasonCodes, ?string $audience = null, array $vars = []): array
    {
        return self::get(self::keyForReasonCodes($reasonCodes), $audience, $vars);
    }

    /**
     * Every state key, for tests and for the JS mirror check.
     */
    public static function keys(): array
    {
        return array_keys(self::STATES);
    }

    /**
     * Keys whose copy is read by a supporter (guest or logged in). These are
     * the ones the golden-rules test holds to rule 1 and rule 2.
     */
    public static function supporterKeys(): array
    {
        return array_keys(array_filter(
            self::STATES,
            fn ($s) => in_array($s['audience_class'] ?? 'supporter', ['supporter', 'both'], true)
        ));
    }

    public static function creatorKeys(): array
    {
        return array_keys(array_filter(
            self::STATES,
            fn ($s) => in_array($s['audience_class'] ?? 'supporter', ['creator', 'both'], true)
        ));
    }

    /**
     * Raw definition — tests only. Never render from this; it has not been
     * interpolated and its CTA has not been audience-resolved.
     */
    public static function definition(string $key): ?array
    {
        return self::STATES[$key] ?? null;
    }

    /**
     * Resolve a CTA to a real URL for this audience.
     *
     * A guest never receives a link to an auth-only page. `route` null means
     * the rendering surface supplies the action itself (opens the OTP field,
     * fires a refund) — the label still travels so both surfaces agree on the
     * wording.
     */
    protected static function resolveCta(?array $cta, string $audience): ?array
    {
        if (! $cta) {
            return null;
        }

        $routeName = $cta['route'] ?? null;

        if ($routeName === null) {
            return ['label' => $cta['label'], 'url' => null];
        }

        // Belt and braces: even if a state is mis-edited later, a guest can
        // never be handed a link into the authenticated app.
        if ($audience === self::AUDIENCE_GUEST && ! in_array($routeName, self::GUEST_SAFE_ROUTES, true)) {
            return ['label' => $cta['label'], 'url' => null];
        }

        try {
            return [
                'label' => $cta['label'],
                // A fragment lets the CTA land on the panel that answers the
                // question rather than the top of a long page — /history is
                // several screens tall and the limits sit well down it.
                'url' => route($routeName, $cta['params'] ?? []).($cta['fragment'] ?? ''),
            ];
        } catch (\Throwable $e) {
            // A route that has not been generated yet must not take a checkout
            // refusal down with it — the message matters more than the button.
            // Logged, because a CTA that silently loses its link is exactly the
            // dead end rule 3 exists to prevent.
            Log::warning('RiskMessages: CTA route could not be resolved', [
                'route' => $routeName,
                'error' => $e->getMessage(),
            ]);

            return ['label' => $cta['label'], 'url' => null];
        }
    }

    /**
     * The only routes a guest-facing CTA may point at.
     */
    protected const GUEST_SAFE_ROUTES = ['register', 'login', 'home'];

    protected static function interpolate(string $text, array $vars): string
    {
        if (empty($vars)) {
            return $text;
        }

        foreach ($vars as $name => $value) {
            $text = str_replace(':'.$name, (string) $value, $text);
        }

        return $text;
    }
}
