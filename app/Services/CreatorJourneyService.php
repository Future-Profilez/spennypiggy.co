<?php

namespace App\Services;

use App\Models\FinancialTransaction;
use App\Models\Post;
use App\Models\User;
use App\Support\IdentityCheckState;
use App\Support\ProfileAssetVisibility;
use App\Support\ReviewSubmission;
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
        'social' => [
            'title' => 'Add a social handle',
            'body' => 'One account you actually post on. It is how the review team checks you are who your page says.',
            'cta' => 'Add a social handle',
            // The socials editor lives on the creator's own profile (CreatorVerification),
            // and `dashboard` redirects there with the query string intact.
            'route' => 'dashboard',
            'params' => [],
        ],
        'subscription' => [
            'title' => 'Add your card',
            'body' => 'Takes a minute, and you are not charged until your first sale.',
            'cta' => 'Add your card',
            'route' => 'activate-subscription',
            'params' => [],
        ],
        'review' => [
            'title' => 'Submit your profile for review',
            'body' => 'Photo, bio, handle and card are in — send it to the team. Payouts unlock once it is approved.',
            'cta' => 'Submit for review',
            // 🚨 THIS STEP IS WHAT WAS MISSING (31 Aug 2026). `ProfileController::
            // updateProfileLockStatus` is the only thing that puts a creator in the review
            // queue (`profile_status_lock` 0 → 1), and it is a manual click. The journey
            // used to treat "photo and bio uploaded" as "under review", so a creator who
            // did both and stopped read "Nothing to do — we check every photo and bio"
            // while sitting in no queue at all. Measured on the live DB: that was the
            // stall for most of the August ad-campaign signups.
            'route' => 'update.profile.lock.status',
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
     * The steps that make an account READY, as opposed to the ones that make it EARN.
     *
     * 🚨 THIS IS NOT `STEP_DONE`, AND THE DIFFERENCE IS THE WHOLE POINT. The journey runs
     * nine steps deep and only reports itself finished after `first_sale` — a moment that
     * depends on a supporter, not on the creator. But the creator has *finished their own
     * setup* six steps earlier, the instant the ID check passes, and that is the moment
     * worth marking: everything the platform asked of them is done, and from here the
     * remaining work is theirs to choose. Reading `STEP_DONE` for that moment would
     * congratulate them only after somebody had already bought something, which is far too
     * late to be encouragement and reads as sarcasm to a creator with no sales.
     *
     * ⚠️ Order matters and mirrors STEPS. A step added to STEPS before `first_listing` must
     * be added here too, or the celebration fires while a real setup task is outstanding.
     */
    public const SETUP_STEPS = ['profile', 'social', 'subscription', 'review', 'stripe', 'identity'];

    /**
     * What a step says once the creator has done their part and it is with an admin.
     *
     * Same step, opposite message: it removes the task instead of repeating it, and gives
     * them a reason for the wait rather than silence.
     */
    public const REVIEW_COPY = [
        'review' => [
            'title' => 'Your profile is being reviewed',
            'body' => 'Nothing to do — the team checks every photo, bio and handle before a page goes live. This is usually quick.',
            'cta' => null,
            'route' => null,
            'params' => [],
        ],
        // ⚠️ Reached ONLY once Stripe has told us a document was actually submitted
        // (`identity.verification_session.processing` → `identity_session_status`).
        // A session that is merely OPEN renders UNFINISHED_COPY instead — see there.
        'identity' => [
            'title' => 'Your ID check is being processed',
            'body' => 'Your passport is with Stripe. They usually answer within minutes and we will tell you either way — there is nothing else for you to do.',
            'cta' => null,
            'route' => null,
            'params' => [],
        ],
    ];

    /**
     * The creator STARTED something and did not finish it. Their move, not ours.
     *
     * 🚨 This exists because `identity_status = 2` is written when the Stripe session is
     * CREATED, not when a document is submitted — and Stripe emits no event for a closed
     * tab. Every abandoned creator was therefore shown REVIEW_COPY: "being processed",
     * with an IN REVIEW pill and their step filed under "with our team", waiting on an
     * answer that nothing was ever going to send. One creator sat like that for days.
     */
    public const UNFINISHED_COPY = [
        'identity' => [
            'title' => 'Finish your ID check',
            'body' => 'You opened the passport check but did not finish it, so nothing has reached Stripe yet. It takes about two minutes and you cannot list anything for sale until it is done.',
            'cta' => 'Finish ID check',
            'route' => 'stripe.identity.verification',
            'params' => [],
        ],
    ];

    /**
     * A step the creator cannot move on their own — a person has said no, and the next
     * move is a conversation, not a click. Rendered instead of the task copy, never nudged.
     */
    public const BLOCKED_COPY = [
        // 3 = flagged by Stripe's fraud signals. Retrying is another billable check with
        // the same answer; support can look at the actual reason.
        'identity' => [
            'title' => 'We could not verify your ID',
            'body' => 'Your identity check did not pass the security review. Message support from the chat bubble and we will sort it out with you.',
            'cta' => null,
            'route' => null,
            'params' => [],
        ],
    ];

    /**
     * A rejected profile submission. The stored reason is what the reviewer wrote for the
     * creator, so it is the body — a generic "needs changes" would send them hunting.
     */
    public const REJECTED_REVIEW_COPY = [
        'title' => 'Your profile needs a change before it can go live',
        'cta' => 'Fix and resubmit',
        'route' => 'dashboard',
        'params' => [],
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
            // ⚠️ `profile_status_lock = 1` is "submitted, with the review team" — written by
            // `ProfileController::updateProfileLockStatus`, cleared back to 0 by an admin
            // rejection (with `profile_reject_reason`) or to 2 by an approval. While it is
            // set the creator has done their part, and `nextStep()` reports `awaiting_review`
            // for the `review` step; mailing them "finish setting up" would be asking for work
            // already handed in. For an already-approved creator the same value is also a
            // demotion that delists everything they sell — either way, not a coaching moment.
            // Same exclusion as the admin drip.
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

        // A step a person has said no to is not "stuck"; chasing it is asking the creator
        // to retry a check that will answer the same way.
        if ($this->isBlocked($creator, $step)) {
            return null;
        }

        // 🚨 Nor is a step we owe THEM. `nextStep()` has always carried `awaiting_review`
        // with a note that callers must not nudge on it, and this caller never read it —
        // so a creator whose documents were genuinely with Stripe was emailed "you started
        // this check but it was never completed", which is false and unactionable. The
        // `review` step was covered only by accident, through the query's
        // `profile_status_lock != 1` exclusion.
        if ($this->isAwaitingReview($creator, $step)) {
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

        return ['key' => $step] + $this->copyFor($creator, $step, $waiting) + [
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
     * Which wording a step renders with: the task, the "with us" copy, the blocked copy, or
     * — for a rejected profile submission — the reviewer's own reason.
     *
     * @return array{title: string, body: string, cta: ?string, route: ?string, params: array}
     */
    private function copyFor(User $creator, string $step, bool $waiting): array
    {
        if ($waiting && $this->isBlocked($creator, $step)) {
            return self::BLOCKED_COPY[$step];
        }

        if ($waiting) {
            return self::REVIEW_COPY[$step];
        }

        // Started, not finished, and nobody is waiting on us. Rendered as a task with a
        // way back in rather than as the plain "Verify identity" first-run copy, which
        // would tell a creator to start something they already started.
        if (isset(self::UNFINISHED_COPY[$step]) && $this->isUnfinished($creator, $step)) {
            return self::UNFINISHED_COPY[$step];
        }

        if ($step === 'review' && filled($creator->profile_reject_reason)) {
            return self::REJECTED_REVIEW_COPY + ['body' => (string) $creator->profile_reject_reason];
        }

        return self::STEPS[$step];
    }

    /**
     * The step is stopped by a decision the creator cannot reverse themselves.
     * Reported through `awaiting_review` so every "do not nudge" rule already covers it.
     */
    public function isBlocked(User $creator, string $step): bool
    {
        return $step === 'identity' && (int) ($creator->identity_status ?? 0) === 3;
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
            // 1 = submitted by the creator, not yet decided. 🚨 Keyed on the LOCK, never on
            // "photo and bio are filled in" — uploading both puts nobody in a queue.
            //
            // 🚨 AND THE LOCK ALONE IS NOT ENOUGH EITHER (6 Sep 2026). The admin queue
            // also requires a photo, bio, handle and card, so a creator carrying the lock
            // with one of those missing is in NO queue and nobody will ever decide. Saying
            // "awaiting review" there is a wait with no end — measured live, all 22
            // creators at lock 1 were in exactly that state. ReviewSubmission is the one
            // definition the queue, this and the nudge mail all read.
            'review' => ReviewSubmission::isWithReviewTeam($creator),

            // 🚨 2 alone is NOT "with us". It is written when the Stripe session is
            // CREATED, so it also covers a creator who opened the check and walked away
            // — and Stripe sends no event for that, so they would wait forever. Only a
            // session Stripe has told us is `processing` (a document was submitted) is
            // genuinely out of the creator's hands. 3 = flagged, see isBlocked().
            'identity' => IdentityCheckState::isProcessing($creator)
                || (int) ($creator->identity_status ?? 0) === 3,

            default => false,
        };
    }

    /**
     * The creator began this step and stopped part-way — it is still their move.
     *
     * Distinct from "not started": the copy has to acknowledge what they already did,
     * or the card reads as though the last five minutes never happened.
     */
    public function isUnfinished(User $creator, string $step): bool
    {
        return $step === 'identity' && IdentityCheckState::isUnfinished($creator);
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

    /**
     * Has the creator finished everything the PLATFORM asked of them?
     *
     * True the instant the ID check passes, whether or not they have listed, posted or sold
     * anything. Read by the setup celebration and by the listings progress strip.
     *
     * ⚠️ Costs NO query. Every one of the six is a plain column read or an already-loaded
     * relation, which is why this can sit on the shared Inertia payload — the three steps
     * that do hit the database (`first_listing`, `first_post`, `first_sale`) are exactly the
     * ones this deliberately does not look at.
     *
     * ⚠️ Returns false for a fan and for a suspended account, through `applies()`. A
     * suspended creator is not being congratulated on an account they cannot sell from.
     */
    public function setupComplete(User $creator): bool
    {
        if (! $this->applies($creator)) {
            return false;
        }

        foreach (self::SETUP_STEPS as $step) {
            if (! $this->isDone($creator, $step)) {
                return false;
            }
        }

        return true;
    }

    public function isDone(User $creator, string $step): bool
    {
        return match ($step) {
            // 🚨 "Uploaded", NOT "approved". Approval is what the `review` step waits on;
            // reading the approved flags here made a creator with both halves filled in
            // look stuck on a step they had finished. `avatar_approved` and `bio_approved`
            // also flip independently of `profile_status_lock` (a creator at lock 1 can
            // carry an approved avatar — ProfileAssetVisibility), so they were never a
            // reliable proxy for "the page is live" either.
            'profile' => empty($this->missingProfileParts($creator)),

            'social' => ProfileAssetVisibility::hasAnyHandle($creator->social_links),

            // 2 = approved and live. Only an admin writes it.
            'review' => (int) ($creator->profile_status_lock ?? 0) === 2,

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
