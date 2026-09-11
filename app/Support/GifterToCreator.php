<?php

namespace App\Support;

use App\Jobs\CheckMediaModeration;
use App\Jobs\LinkUserToCrmCreator;
use App\Mail\CreatorAccountOpened;
use App\Models\CreatorReferral;
use App\Models\Dispute;
use App\Models\ProfileChangeRequest;
use App\Models\ReferralCode;
use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserVerificationStatus;
use App\Services\ActivityLogger;
use App\Services\CreatorJourneyService;
use App\Services\UserProfileService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * A gifter becoming a creator — the ONE path, for every caller.
 *
 * There are two entry points today (the settings card and the card on their own
 * profile) and there will be more; a role flip re-implemented at a call site is a
 * role flip that forgets one of the resets below, and every one of those resets is
 * the difference between a reviewed creator profile and an unreviewed one.
 *
 * 🚨 A GIFTER'S PHOTO AND BIO WERE NEVER REVIEWED BY ANYBODY. `ProfileController`
 * writes `avatar_approved`/`bio_approved` as 1 for role 0 on upload — a fan's
 * picture is not published anywhere that needs judging — so an account that keeps
 * those flags through a conversion goes live as a creator with a photo and a bio
 * no human has looked at. That is the whole reason this class resets rather than
 * simply setting `role = 1`, and it is why the reset list must never be trimmed
 * for the sake of a faster conversion.
 *
 * 🚨 CONVERSION IS INSTANT AND THE CHECKS ARE NOT SKIPPED. The account becomes a
 * creator the moment they submit, and then walks the ordinary creator journey
 * (profile → social → stripe → subscription). Since 11 Sep 2026 nobody approves
 * the profile: `judgeConvertedAssets()` re-runs the automatic checks over what the
 * fan already had, and the page goes live on its own once they pass. There is
 * deliberately no approval queue: a queue nobody staffs is a feature nobody can
 * finish.
 *
 * ⚠️ WHAT IS NOT TOUCHED, deliberately: their purchases, the memberships and
 * subscriptions they bought, saved items, follows, `gifter_addresses`, their
 * `GifterCardVerification` (a £500 card check they already passed is still a fact
 * about them — the admin panel shows it beside the conversion), `promo_code_id`,
 * every marketing-consent column, and `created_at`. A conversion changes what the
 * account IS, not what it has done.
 */
final class GifterToCreator
{
    /**
     * Blocking reasons, keyed so the page can render its own copy per reason and a
     * test can assert one without matching prose. Empty array = may convert.
     *
     * 🚨 THE GATES ARE THE CREATOR-SIGNUP GATES THIS PATH WOULD OTHERWISE SKIP.
     * Signing up as a creator costs a Turnstile solve, a device cookie and a
     * 5-accounts-per-IP ceiling; converting an existing account meets none of
     * those, so "sign up as a gifter, then convert" would be the cheap way in
     * without them. There is no account-age gate (client decision, 7 Sep 2026) —
     * these three are what stands in for it.
     */
    public static function blockers(User $user): array
    {
        $blockers = [];

        if (empty($user->email_verified_at)) {
            $blockers[] = 'email_unverified';
        }

        if (SuspendedAccount::isSuspended($user)) {
            $blockers[] = 'suspended';
        }

        if (self::hasDisputeHistory($user)) {
            $blockers[] = 'dispute_history';
        }

        return $blockers;
    }

    /**
     * Is this account eligible to SEE the offer at all? Role only — a blocker is a
     * refusal with a reason to read, and hiding the button from somebody whose
     * e-mail is simply unverified tells them nothing about how to fix it.
     */
    public static function isEligibleRole($user): bool
    {
        return $user instanceof User && (int) $user->role === 0;
    }

    /**
     * Has this person charged back, or is a dispute against one of their purchases
     * still open?
     *
     * 🚨 MATCHED ON THE E-MAIL, NOT ON `disputes.creator_id` — that column is the
     * person being bought FROM, never the buyer (the same trap that had a blocked
     * purchase reported to the wrong party on 29 Aug 2026). `customer_email` is the
     * only buyer-side link the disputes table carries, and it is the link
     * `PaymentTierService::passesBuyerRiskChecks` already screens card payments on;
     * the two use the same status exclusions so a buyer this platform refuses to
     * take a card from cannot be told they may start selling.
     *
     * ⚠️ `won` and `warning_closed` are excluded because they are disputes that
     * resolved in the platform's favour or never became one — counting them would
     * refuse a creator for a chargeback somebody else lost.
     */
    private static function hasDisputeHistory(User $user): bool
    {
        $email = strtolower(trim((string) $user->email));

        if ($email === '') {
            return false;
        }

        return Dispute::whereRaw('LOWER(customer_email) = ?', [$email])
            ->whereNotIn('status', ['won', 'warning_closed'])
            ->exists();
    }

    /**
     * Flip the account. Returns true when THIS call converted it.
     *
     * $input: social_platform, social_handle (already normalised/validated by the
     * caller), creator_category[], pride_badges[], referral (nullable code),
     * country + country_code (only read when the account has no country yet).
     *
     * 🚨 THE FLIP AND EVERY RESET ARE ONE TRANSACTION. A conversion that set
     * `role = 1` and then failed before clearing `avatar_approved` is the exact
     * hole this class exists to close, and it would leave no trace of having been
     * half-done.
     *
     * 🚨 IDEMPOTENT UNDER A RACE. The read of `creator_converted_at` and the write
     * are two statements, so a double-tapped button could pass the read twice —
     * once flipping the account and once re-clearing approvals on a creator who is
     * already mid-review, and stamping a second `terms_accepted_at`. The lock
     * serialises them; a caller that cannot take it treats the account as already
     * converted, which is the safe answer either way.
     */
    public static function convert(User $user, array $input): bool
    {
        if (! self::isEligibleRole($user) || $user->creator_converted_at !== null) {
            return false;
        }

        $lock = Cache::lock("gifter_to_creator:{$user->id}", 10);

        if (! $lock->get()) {
            return false;
        }

        try {
            $fresh = User::find($user->id);

            if (! self::isEligibleRole($fresh) || $fresh->creator_converted_at !== null) {
                return false;
            }

            DB::transaction(function () use ($fresh, $input) {
                self::flip($fresh, $input);
            });

            $user->refresh();

            // Everything below is a consequence, not the conversion. Each is wrapped
            // so a failure cannot roll back an account that is already a creator —
            // the same reason the signup path keeps its social-handle write in a
            // catch it cannot escape.
            self::afterFlip($user, $input);

            return true;
        } finally {
            $lock->release();
        }
    }

    /**
     * The transactional half: the role, the resets, and the creator-only columns.
     */
    private static function flip(User $user, array $input): void
    {
        $interests = Badges::sanitiseInterests($input['creator_category'] ?? []);
        $pride = Badges::sanitisePride($input['pride_badges'] ?? []);

        $attributes = [
            'role' => 1,
            'creator_converted_at' => now(),

            /*
             * 🚨 THE RESETS. Every one of these is 1 on a gifter account because
             * nothing ever reviewed it (see the class docblock), and every one of
             * them decides whether something is shown to the public.
             *
             * ⚠️ The FILES are kept. Clearing the avatar and the bio would throw
             * away work the person already did and leave them staring at an empty
             * profile as their reward for converting; the review is the thing that
             * was missing, not the content.
             *
             * ⚠️ `profile_status_lock = 0` is "drafting": the automatic checks in
             * `judgeConvertedAssets()` move it to 2 on their own once the assets
             * pass. There is no Submit and no queue (11 Sep 2026).
             */
            /*
             * 🚨 RESET TO 0 HERE, THEN RE-JUDGED BY THE MACHINE BELOW (10 Sep 2026).
             * A fan's photo and bio were approved under the fan rules — nobody looked.
             * They are not thrown away: `judgeConvertedAssets()` runs the creator
             * checks on what is already there, so a clean bio is approved in the same
             * transaction and a photo is scanned; the profile goes live on its own the
             * moment all three clear. Nothing waits on a person.
             */
            'avatar_approved' => 0,
            'bio_approved' => 0,
            'profile_status_lock' => 0,
            'profile_reject_reason' => null,

            // The creator-only acknowledgement, and the terms re-accepted. A
            // gifter agreed to the supporter terms; selling is a different
            // relationship, so the consent is taken again rather than inherited.
            'creator_email_receipt_acknowledged_at' => now(),
            'terms_accepted_at' => now(),

            'creator_category' => $interests !== [] ? json_encode($interests) : null,
            'pride_badges' => $pride !== [] ? json_encode($pride) : null,

            /*
             * 🚨 THE JOURNEY CLOCK STARTS NOW, NOT AT SIGNUP.
             * `CreatorJourneyService::nudgeCandidateQuery` only coaches a creator
             * whose `journey_step_at` is inside a 30-day window, so a converted
             * account carrying a null (or a months-old supporter signup date) is
             * written off as dormant on the day it becomes a creator — the exact
             * fault that had 25 live creators uncoached until 7 Sep 2026.
             */
            'journey_step_at' => now(),
        ];

        // Only when the account has none. Every gifter since 31 Aug 2026 was asked
        // at signup, but a legacy row can be NULL — and `users.country` is what the
        // shipping zones and the Stripe business-type check read, so a creator
        // cannot be left without one.
        if (blank($user->country) && filled($input['country_code'] ?? $input['country'] ?? null)) {
            $attributes['country'] = $input['country_code'] ?: $input['country'];
        }

        /*
         * A fan cover is a fan cover. Reassigned from the designed creator pool so
         * the new page does not open on the default grey fan banner — but a cover
         * they uploaded THEMSELVES is kept and sent for review instead, because
         * replacing it would delete a deliberate choice.
         *
         * 🚨 `cover_approved` FOLLOWS WHAT THE COVER IS, and is the one approval
         * flag here that is not simply zeroed. A curated cover is approved ON
         * SELECTION and skips the scan — `PresetCovers::isPreApproved`, and the
         * signup path writes 1 for exactly this reason — so zeroing it would hide
         * a house banner behind a review queue and leave the new creator's page
         * blank at the top for no gain. An UPLOADED cover was approved under the
         * fan rules and does need a look.
         */
        if (blank($user->cover) || $user->cover === PresetCovers::FAN_DEFAULT) {
            $pool = PresetCovers::signupPool();
            $attributes['cover'] = $pool[array_rand($pool)];
            $attributes['cover_cdn_modifier'] = null;
            $attributes['cover_approved'] = 1;
        } else {
            $attributes['cover_approved'] = PresetCovers::isPreApproved($user->cover) ? 1 : 0;
        }

        // forceFill, not fill: `creator_converted_at` is deliberately absent from
        // $fillable (as are the approval flags), so a mass assignment would drop
        // exactly the columns that matter here, in silence.
        $user->forceFill($attributes)->save();

        /*
         * The social handle, at `status = 0` — awaiting review, identical to a
         * Creator Studio submission and to a creator signup.
         *
         * ⚠️ `updateOrCreate` on the user, never a second row: a gifter can already
         * hold a `social_links` row (the editor is not creator-gated), and a second
         * row for one account is two answers to "which handle is under review".
         */
        $platform = $input['social_platform'] ?? null;
        $handle = SocialHandle::normalise($platform, $input['social_handle'] ?? null);

        if ($platform !== null && $handle !== null) {
            $existing = SocialLinks::where('user_id', $user->id)->first();

            if ($existing) {
                $existing->forceFill([
                    $platform => $handle,
                    'status' => 0,
                    'source' => 'conversion',
                ])->save();
            } else {
                SocialLinks::create([
                    'uuid' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'source' => 'conversion',
                    'status' => 0,
                    $platform => $handle,
                ]);
            }
        }

        /*
         * The verification row a creator signup writes.
         *
         * ⚠️ UPDATED, not inserted, when one exists. A gifter can already have a
         * `role = 0` row (written at the £500 card-verification gate), and a second
         * row would leave two rows disagreeing about the same account's state.
         */
        self::judgeConvertedAssets($user->fresh());

        UserVerificationStatus::updateOrCreate(
            ['user_id' => $user->id],
            [
                'role' => 1,
                'bio_status' => 1,
                'address_status' => 0,
                'social_status' => $handle !== null ? 0 : null,
            ],
        );
    }

    /**
     * Consequences. NOTHING here may throw — the account is already a creator and
     * the person is already looking at their dashboard.
     */
    private static function afterFlip(User $user, array $input): void
    {
        try {
            (new UserProfileService)->clearUserCaches($user->username, $user->id);
        } catch (\Throwable $e) {
            Log::warning('Conversion: profile caches not cleared', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        // Referral attribution, on exactly the signup rules: an active code, a real
        // creator behind it, never themselves, never a second row for one creator.
        try {
            self::attributeReferral($user, $input['referral'] ?? null);
        } catch (\Throwable $e) {
            Log::warning('Conversion: referral not attributed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        // Their e-mail may be an outreach lead we have been chasing. Linking it is
        // how the CRM records that the campaign converted.
        try {
            LinkUserToCrmCreator::dispatch($user->id, null);
        } catch (\Throwable $e) {
            Log::warning('Conversion: CRM link not dispatched', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        /*
         * 🚨 A ROLE CHANGE WITH NO TRAIL IS THE ONE WRITE NOBODY CAN RECONSTRUCT.
         * After the flip the row is indistinguishable from a creator signup, so
         * without this there is no record that the assets on the account were once
         * approved under the fan rules — which is the first thing a reviewer needs
         * to know about it.
         */
        try {
            ActivityLogger::log(
                // A literal, not a constant: the vocabulary class
                // (`AuditActions`) lives in the admin app, which is what RENDERS
                // the trail. Keep the string in step with the entry added there.
                'GIFTER_CONVERTED_TO_CREATOR',
                $user->uuid,
                [
                    'username' => $user->username,
                    'converted_at' => optional($user->creator_converted_at)->toIso8601String(),
                    'assets_reset_for_review' => ['avatar', 'bio', 'cover', 'social_links'],
                ],
                null,
                ['entity_type' => 'user', 'entity_id' => $user->uuid],
            );
        } catch (\Throwable $e) {
            Log::warning('Conversion: audit row not written', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        /*
         * One confirmation, and it is TRANSACTIONAL — `Mail::to()`, never
         * `EmailService::sendMarketingEmail`. It states what has just changed about
         * this person's own account, including that their photo and bio have gone
         * back for review, and a marketing opt-out must not silence that.
         *
         * ⚠️ QUEUED. This runs inside the conversion request; a slow mail server
         * must not be what the creator waits on to see their own dashboard.
         * **Needs `queue:work`** — without a worker the account is still converted
         * and correct, and only the e-mail is missing.
         */
        try {
            Mail::to($user->email)->queue(new CreatorAccountOpened(
                $user->id,
                $user->name ?: $user->username,
                // Whether they actually HAD a photo or bio, so the mail never
                // describes what happened to a picture they never uploaded.
                filled($user->avatar) || filled($user->bio),
            ));
        } catch (\Throwable $e) {
            Log::warning('Conversion: confirmation mail not queued', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        // Puts the journey payload in step with the columns just written, rather
        // than waiting for the next page load to notice.
        try {
            app(CreatorJourneyService::class)->syncStep($user);
        } catch (\Throwable $e) {
            Log::warning('Conversion: journey step not recorded', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }
    }

    private static function attributeReferral(User $user, ?string $code): void
    {
        if (blank($code)) {
            return;
        }

        $referralCode = ReferralCode::where('code', $code)->where('is_active', 1)->first();

        if (! $referralCode) {
            return;
        }

        $referrer = User::where('id', $referralCode->creator_id)->where('role', 1)->first();

        if (! $referrer || $referrer->id === $user->id) {
            return;
        }

        if (CreatorReferral::where('referred_creator_id', $user->id)->exists()) {
            return;
        }

        CreatorReferral::create([
            'referrer_creator_id' => $referrer->id,
            'referred_creator_id' => $user->id,
            'referral_code_id' => $referralCode->id,
            'lifetime_gmv' => 0,
            'status' => 'IN_PROGRESS',
        ]);
    }

    /**
     * Run the creator checks over what the fan already had, so conversion does not
     * park a clean profile at "not yet".
     *
     * ⚠️ Bio and handles are synchronous and approve here. The photo cannot be — it
     * needs the Rekognition round trip — so it is dispatched and approves (or holds)
     * when the scan returns, which is also when `activateIfComplete()` is asked again.
     * ⚠️ Never throws: a judging failure must not fail a conversion that has already
     * been written. The assets stay at 0 and are re-judged on the creator's next save.
     */
    private static function judgeConvertedAssets(User $user): void
    {
        try {
            if (filled($user->bio) && ProfileAutoApproval::judgeBio($user->bio) === null) {
                ProfileAutoApproval::markApproved($user, ProfileChangeRequest::ASSET_BIO);
            }

            $links = SocialLinks::where('user_id', $user->id)->first();

            if ($links) {
                $handles = Arr::only($links->getAttributes(), SocialLinks::ACCEPTED_PLATFORMS);

                if (ProfileAutoApproval::judgeSocials($handles, $user->id) === null) {
                    ProfileAutoApproval::markApproved($user, ProfileChangeRequest::ASSET_SOCIALS);
                }
            }

            if (filled($user->avatar)) {
                CheckMediaModeration::dispatch(
                    User::class,
                    $user->id,
                    $user->avatar,
                    ['avatar_approved' => 0],
                    'avatar',
                    ['avatar_approved' => 1]
                );
            }

            ProfileAutoApproval::activateIfComplete($user->fresh());
        } catch (\Throwable $e) {
            Log::warning('Conversion: could not auto-judge existing assets', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
