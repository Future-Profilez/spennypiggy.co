<?php

namespace App\Services;

use App\Models\FinancialTransaction;
use App\Models\Post;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;

/**
 * "What is this creator supposed to do next?" — answered in exactly one place.
 *
 * Before this, the answer was spread across a dashboard checklist, a setup nudge bar, a
 * first-listing card, a fourteen-day drip running in the OTHER app, and a posting-cadence
 * enforcer. None of them knew what the others had said, so a creator who set everything up
 * on day one still received "add your first item" on day three — advice they had already
 * acted on, which teaches them to ignore the next message too.
 *
 * The journey is **state-based, never calendar-based**: the current step is the first one
 * that is not done. Finish a step and the next one appears immediately; do three in an hour
 * and the journey moves three places in an hour.
 *
 * ⚠️ Two apps, one database, no shared code. The drip that emails creators runs in
 * `admin.spennypiggy.co`, which cannot call this class. `syncStep()` therefore writes the
 * answer to `users.journey_step` and the admin app only ever READS that column — the
 * alternative was a second copy of this logic on the admin side, which is the cross-app
 * drift trap that has already cost this codebase real bugs.
 */
class CreatorJourneyService
{
    /** Journey finished. Kept as a real value so "done" is distinguishable from "unknown". */
    public const STEP_DONE = 'done';

    /**
     * In order. The creator's current step is the FIRST one that is not done, so the order
     * here IS the product decision about what matters next.
     *
     * Each entry's copy is what the creator is told, on every surface — the dashboard card,
     * the nudge bar and the drip email all render from this, so they cannot contradict
     * each other. Content-first wording only: no gift/tip/donation/fundraise/bill language,
     * because this text is coaching creators on what to publish and Stripe reads what they
     * publish.
     */
    public const STEPS = [
        'profile' => [
            'title' => 'Finish your profile',
            'body' => 'Add a photo and a short bio so supporters know whose page they are on.',
            'cta' => 'Add photo and bio',
            // 🚨 `?edit=profile` OPENS THE FORM. Without it this lands on Account
            // Settings and stops there — the photo/bio form is a collapsed row
            // partway down a page of two dozen, and the creator has to know which
            // one it is. Measured 25 Aug 2026: of the 33 creators who signed up in
            // the prior 90 days, 2 added a photo and 0 wrote a bio.
            // Read by `accountsetting/Accountsetting.jsx` → EditProfile `autoOpen`.
            'route' => 'account',
            'params' => ['edit' => 'profile'],
        ],
        'subscription' => [
            'title' => 'Add your card',
            'body' => 'Takes a minute, and you are not charged until your first sale.',
            'cta' => 'Add your card',
            'route' => 'activate-subscription',
            'params' => [],
        ],
        'stripe' => [
            'title' => 'Connect your payouts',
            'body' => 'Add your bank details so the money you earn can reach you.',
            'cta' => 'Connect payouts',
            // ⚠️ `stripe.connect` is the ACTION endpoint (/stripe/connect-init) —
            // it needs a POST carrying `termaccept` and a country, so a plain
            // click on it bounced straight back with a red error toast, every
            // time. `stripe.index` is the page that collects those.
            'route' => 'stripe.index',
            'params' => [],
        ],
        'identity' => [
            'title' => 'Verify your identity',
            'body' => 'A quick passport check. You cannot list anything for sale until this is done.',
            'cta' => 'Verify identity',
            'route' => 'stripe.identity.verification',
            'params' => [],
        ],
        'first_listing' => [
            'title' => 'Put something up for sale',
            'body' => 'A file, a custom order, or something physical. Nothing can be bought until you list one thing.',
            'cta' => 'Add your first item',
            // Rendered as the three-way chooser rather than one link — see the card.
            'route' => null,
            'params' => [],
        ],
        'first_post' => [
            'title' => 'Publish your first post',
            'body' => 'Posts are what supporters see after they buy. One is enough to start.',
            'cta' => 'Write a post',
            // ⚠️ Needs the param. Plain 'dashboard' sent the creator to the page the card is
            // already rendered on, so the button did nothing at all.
            'route' => 'dashboard',
            'params' => ['add' => 'post'],
        ],
        'first_sale' => [
            'title' => 'Share your page',
            'body' => 'Your page is ready to sell. Post your link where your audience already follows you.',
            'cta' => 'Share your page',
            // No destination: this step opens the device's share sheet in place, because
            // sharing is the action — navigating somewhere to then find a share button is
            // one step more than the creator needs.
            'route' => null,
            'params' => [],
        ],
    ];

    /**
     * What a step says once the creator has done their part and it is with an admin.
     *
     * Same step, opposite message: it removes the task instead of repeating it, and gives
     * them a reason for the wait rather than silence.
     */
    public const REVIEW_COPY = [
        'profile' => [
            'title' => 'Your profile is being reviewed',
            'body' => 'Nothing to do — we check every photo and bio before it goes live. This is usually quick.',
            'cta' => null,
            'route' => null,
            'params' => [],
        ],
        'identity' => [
            'title' => 'Your ID check is being processed',
            'body' => 'Nothing to do — we are waiting on the result. You will be told either way.',
            'cta' => null,
            'route' => null,
            'params' => [],
        ],
    ];

    /**
     * The creator's current step, or STEP_DONE.
     *
     * Short-circuits: the first unfinished step wins, so a creator early in the journey
     * costs one or two checks rather than all six.
     */
    /**
     * How many days after ENTERING a step the creator is reminded about it.
     *
     * 🚨 Two, and then silence on that step forever. A creator who has not acted on the
     * second reminder is not going to act on the fifth, and a platform that keeps asking
     * is how a creator learns to filter everything we send — including the receipt and the
     * payout notice. Moving to a new step resets the clock (`journey_step_at`), so the
     * cap is per step, not per creator.
     */
    public const NUDGE_STAGES = [2, 7];

    /**
     * ⚠️ `first_listing` is DELIBERATELY ABSENT. It already has its own two-stage nudge
     * (`creators:nudge-first-listing`, days 3 and 10) with its own mailable and its own
     * dedup ledger. Adding it here would mail the same creator twice for the same task
     * from two commands that cannot see each other.
     *
     * @return array<int, string>
     */
    public static function nudgeableSteps(): array
    {
        return array_values(array_diff(array_keys(self::STEPS), ['first_listing']));
    }

    /**
     * A creator who signed up months ago is dormant, not onboarding.
     *
     * Same window and same reasoning as the admin app's drip: mailing a long tail of
     * abandoned signups in one run is how a sending domain earns a spam reputation, after
     * which the mail that matters stops arriving for everyone.
     */
    public const NUDGE_FRESH_WINDOW_DAYS = 30;

    /**
     * Everyone who might be due a "you have not finished setting up" reminder.
     *
     * The step itself is NOT filtered here — `nudgeStageFor()` decides, once, so the rule
     * lives in one place rather than being half in a query and half in a method.
     */
    public function nudgeCandidateQuery(bool $includeDormant = false): Builder
    {
        $query = User::query()
            ->where('role', 1)
            ->where('suspended_account', 0)
            // ⚠️ `profile_status_lock = 1` is a PUNISHMENT, not a review state — it delists
            // everything the creator sells. Coaching them to finish setting up is the wrong
            // message entirely. Same exclusion as the admin drip.
            ->where('profile_status_lock', '!=', 1)
            // Never mail an address nobody has confirmed: a guaranteed bounce against our
            // sending reputation. The verification reminder is the right message for them.
            ->whereNotNull('email_verified_at')
            ->where('notification_send', 1)
            ->whereNotNull('journey_step')
            ->where('journey_step', '!=', self::STEP_DONE)
            ->whereIn('journey_step', self::nudgeableSteps())
            // NULL means the hourly sync has not stamped them yet, so there is no clock to
            // measure against — "unknown", never "stuck since forever".
            ->whereNotNull('journey_step_at');

        if (! $includeDormant) {
            $query->where('created_at', '>=', now()->subDays(self::NUDGE_FRESH_WINDOW_DAYS));
        }

        return $query;
    }

    /**
     * Which reminder is due for this creator, or null when none is.
     *
     * Pure and separated from delivery so the one business rule is testable on its own —
     * the same split `NudgeFirstListing::stageFor()` uses.
     */
    public function nudgeStageFor(User $creator): ?int
    {
        $step = $creator->journey_step ?? null;

        if ($step === null || $step === self::STEP_DONE || ! in_array($step, self::nudgeableSteps(), true)) {
            return null;
        }

        if (empty($creator->journey_step_at)) {
            return null;
        }

        $enteredAt = Carbon::parse($creator->journey_step_at);

        // ⚠️ diffInDays() is absolute. A timestamp in the future — clock skew or bad data —
        // would otherwise read as "stuck for 90 days" and fire the final reminder at once.
        if ($enteredAt->isFuture()) {
            return null;
        }

        $days = (int) $enteredAt->diffInDays(now());

        // Newest threshold first, so a creator past day 7 gets the second reminder rather
        // than the first — and anyone already past both when this shipped gets exactly one.
        foreach (array_reverse(self::NUDGE_STAGES) as $stage) {
            if ($days >= $stage) {
                return $stage;
            }
        }

        return null;
    }

    public function currentStep(User $creator): string
    {
        foreach (array_keys(self::STEPS) as $step) {
            if (! $this->isDone($creator, $step)) {
                return $step;
            }
        }

        return self::STEP_DONE;
    }

    /**
     * The full payload for whatever the creator should do next, or null when the journey is
     * finished — at which point `CreatorOpportunityService` owns the "what next" question
     * and this must go quiet rather than invent another task.
     */
    public function nextStep(User $creator): ?array
    {
        if (! $this->applies($creator)) {
            return null;
        }

        $step = $this->currentStep($creator);

        if ($step === self::STEP_DONE) {
            return null;
        }

        $waiting = $this->isAwaitingReview($creator, $step);

        return ['key' => $step] + ($waiting ? self::REVIEW_COPY[$step] : self::STEPS[$step]) + [
            'position' => array_search($step, array_keys(self::STEPS), true) + 1,
            'total' => count(self::STEPS),

            // ⚠️ The single most important flag here. Two steps are finished by the creator
            // but completed by an ADMIN, so "not done" does not mean "they have not acted".
            // Measured on live data: 11 of the 30 creators sitting on `profile` had already
            // written a bio and were waiting on approval. Telling them to finish their
            // profile is telling them to redo work they have done, which is exactly how a
            // guidance system teaches people to ignore it.
            //
            // Callers MUST NOT nudge, email or push while this is true — the platform owes
            // them the next move, not the other way round.
            'awaiting_review' => $waiting,
        ];
    }

    /**
     * The whole journey, in order, with each step's state — for surfaces that draw a
     * progress rail rather than a single "do this next" card.
     *
     * ⚠️ Exists because the rail was being hardcoded in the JSX. `stripe/Stripe.jsx` carried
     * its own five-entry array that still listed identity BEFORE connect — the order that
     * changed on 31 July 2026 — so the rail highlighted "Identity verified — you're here"
     * while the panel directly beneath it said "Connect your payments". One screen, two
     * answers. A step order is a product decision and belongs in exactly one place.
     *
     * Deliberately a PAGE prop, not a shared one: it costs a handful of checks and only the
     * setup screens draw it, so putting it on every Inertia navigation would be paying for
     * it everywhere to use it twice.
     *
     * @return array<int, array{key: string, label: string, done: bool, awaiting_review: bool}>
     */
    public function stepStates(User $creator): array
    {
        $states = [];

        foreach (self::STEPS as $key => $copy) {
            $done = $this->isDone($creator, $key);

            $states[] = [
                'key' => $key,
                'label' => $copy['title'],
                'done' => $done,
                'awaiting_review' => ! $done && $this->isAwaitingReview($creator, $key),
            ];
        }

        return $states;
    }

    /**
     * Has the creator done their part of this step, leaving it with us?
     */
    public function isAwaitingReview(User $creator, string $step): bool
    {
        return match ($step) {
            // Submitted something on both halves, and at least one is still unapproved.
            'profile' => (! empty($creator->avatar) || ! empty($creator->bio))
                && ! $this->isDone($creator, 'profile')
                && empty($this->missingProfileParts($creator)),

            // 2 = submitted, awaiting Stripe's answer (0 failed, 1 verified, 3 flagged).
            'identity' => (int) ($creator->identity_status ?? 0) === 2,

            default => false,
        };
    }

    /**
     * Which halves of the profile the creator still has to supply themselves.
     *
     * Empty means they have supplied everything and the remainder is review.
     *
     * @return array<int, string>
     */
    public function missingProfileParts(User $creator): array
    {
        $missing = [];

        if (empty($creator->avatar)) {
            $missing[] = 'photo';
        }

        if (empty($creator->bio)) {
            $missing[] = 'bio';
        }

        return $missing;
    }

    /**
     * Is this creator on the journey at all?
     *
     * A suspended account is not being coached toward publishing, and a fan has no journey.
     */
    public function applies(User $creator): bool
    {
        return (int) ($creator->role ?? 0) === 1
            && (int) ($creator->suspended_account ?? 0) !== 1;
    }

    public function isDone(User $creator, string $step): bool
    {
        return match ($step) {
            // Both halves are reviewed by an admin, so this is "approved", not "uploaded".
            'profile' => (int) ($creator->avatar_approved ?? 0) === 1
                && (int) ($creator->bio_approved ?? 0) === 1,

            'identity' => (int) ($creator->identity_status ?? 0) === 1,

            // Same allow-list the eight supporter-checkout gates use: 1 is
            // billing, 2 is the free period. Both mean a card is on file, which
            // is what this step is asking for.
            'subscription' => in_array((int) ($creator->subscription_status ?? 0), [1, 2], true),

            'stripe' => (int) ($creator->stripe_details_submitted ?? 0) === 1,

            // Reuses the six-table check rather than keeping a second list of listing
            // tables — miss one and the creator is chased forever for work they have done.
            // The `Fast` form answers in ONE query instead of six; this runs hourly across
            // every creator, so the difference is the whole cost of the sweep.
            'first_listing' => app(CreatorSetupService::class)->hasAnyListingFast($creator),

            // ⚠️ Excludes the thank-you posts the PLATFORM writes on a purchase — a creator
            // who has never written anything would otherwise be credited with posting and
            // moved on. Reuses PostingCadenceService's list rather than keeping a second
            // one. Unapproved posts DO count: the creator did the work, and approval is not
            // in their hands (same rule as `first_listing`).
            'first_post' => Post::where('user_id', $creator->id)
                ->where(function ($q) {
                    $q->whereNull('type')
                        ->orWhereNotIn('type', PostingCadenceService::SYSTEM_TYPES);
                })
                ->exists(),

            // ⚠️ `completed` only. Without it a refunded or still-pending row counts as a
            // sale and the creator is advanced past the step — money that came back out is
            // not a first sale. `user_id` IS the creator on an income row; there is no
            // creator_id column.
            'first_sale' => FinancialTransaction::where('user_id', $creator->id)
                ->where('type', 'income')
                ->where('status', 'completed')
                ->exists(),

            default => true,
        };
    }

    /**
     * Persist the current step so the admin app's drip can read it.
     *
     * `journey_step_at` records when the creator ENTERED the step, not when this last ran —
     * a creator stuck on the same step for three weeks is the signal worth acting on, and
     * that is invisible if the timestamp moves on every sync.
     *
     * Returns true when the step actually changed.
     */
    public function syncStep(User $creator): bool
    {
        if (! $this->applies($creator)) {
            return false;
        }

        try {
            $step = $this->currentStep($creator);

            if (($creator->journey_step ?? null) === $step) {
                return false;
            }

            $creator->forceFill([
                'journey_step' => $step,
                'journey_step_at' => now(),
                // ⚠️ Write-once. A creator who finishes and then regresses — deletes their
                // only listing, has a sale refunded — has still finished once, and that is a
                // historical fact rather than a current state. Clearing it on regression
                // also silently reopens the journey's "are they new?" question for someone
                // who is not new at all.
                'journey_completed_at' => $creator->journey_completed_at
                    ?? ($step === self::STEP_DONE ? now() : null),
            ])->saveQuietly();

            return true;
        } catch (\Throwable $e) {
            // Never let bookkeeping break the caller. This runs from a scheduled sweep and
            // from request paths; a failure here costs one stale row, not a page.
            Log::warning('CreatorJourneyService: failed to sync step', [
                'user_id' => $creator->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
