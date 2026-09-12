<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Which historically-rejected creators may be let back in, and which need a person.
 *
 * 🚨 CLIENT D6, CONFIRMED 11 Sep 2026, quoted in full because every branch below is one
 * clause of it:
 *
 *   *"Use the three-tier release: automatically release submitted/undecided, no-reason
 *   rejections and social-handle/asset-quality rejections; hold written policy judgements
 *   for manual review; **never auto-release suspended or serious fraud/policy/compliance
 *   flags.** Send production counts before the release runs and notify released creators
 *   by email."*
 *
 * 🚨 THE DEFAULT IS `MANUAL`, NOT `AUTO`. A reason this class does not recognise is a
 * reason nobody has read, and letting it through is how a creator an admin deliberately
 * turned down comes back with nobody deciding it. Auto-release has to be *earned* by
 * matching a known-benign shape; everything else waits for a person. Being wrong in that
 * direction costs somebody five minutes; the other direction cannot be undone quietly.
 */
final class ProfileReleaseTiers
{
    /** Released by the command. */
    public const TIER_AUTO = 'auto';

    /** A person decides. */
    public const TIER_MANUAL = 'manual';

    /** Never released by anything automatic. */
    public const TIER_NEVER = 'never';

    /**
     * Rejections that are about the creator not having finished, or the asset being poor.
     *
     * ⚠️ These are judgements about a FILE or a FIELD, not about the person — which is
     * exactly the line D6 draws. Matched as substrings against a lower-cased reason.
     */
    public const BENIGN_PATTERNS = [
        'social media handle',
        'social handle',
        'add a social',
        'social link',
        'profile picture',
        'profile photo',
        'better photo',
        'clearer photo',
        'blurry',
        'low quality',
        'low resolution',
        'too small',
        'incomplete',
        'not complete',
        'complete your profile',
        'add a bio',
        'write a bio',
        'bio is too short',
        'more detail',
    ];

    /**
     * Wording that means a person judged the PERSON, or judged content against policy.
     *
     * 🚨 ANY HIT HERE IS `NEVER`, even if a benign pattern also matched. A reason reading
     * "blurry photo, and this looks like a stolen identity" is not an asset-quality
     * rejection — the worst thing said about a creator is what decides their tier.
     */
    public const SERIOUS_PATTERNS = [
        'fraud',
        'scam',
        'stolen',
        'impersonat',
        'not a legitimate',
        'not legitimate',
        'fake',
        'underage',
        'under 18',
        'minor',
        'adult content',
        'explicit',
        'nudity',
        'porn',
        'sexual',
        'illegal',
        'drugs',
        'weapon',
        'hate',
        'abuse',
        'chargeback',
        'stolen card',
        'money launder',
        'terror',
        'copyright',
        'trademark',
        'banned',
        'permanently',
    ];

    /**
     * Decide a creator's tier.
     *
     * @return array{tier: string, why: string}
     */
    public static function classify(User $user): array
    {
        /*
         * 🚨 SUSPENSION FIRST, WHATEVER THE REASON SAYS. A suspended account is a decision
         * somebody took about the person, and D6 names it as never-auto explicitly.
         */
        if ((int) ($user->suspended_account ?? 0) === 1) {
            return ['tier' => self::TIER_NEVER, 'why' => 'account is suspended'];
        }

        /*
         * ⚠️ `critical` and `warning` are the two severities `user_flags` actually
         * carries alongside `info` — checked against the live column, not assumed.
         * A CRITICAL flag is D6's "serious fraud/policy/compliance" case and can never
         * be released automatically; a WARNING is something the platform noticed and
         * nobody has judged, so it goes to a person rather than to either extreme.
         */
        $flag = self::openFlagSeverity($user);

        if ($flag === 'critical') {
            return ['tier' => self::TIER_NEVER, 'why' => 'an open critical account flag'];
        }

        if ($flag === 'warning') {
            return ['tier' => self::TIER_MANUAL, 'why' => 'an open account flag a person should read'];
        }

        $reason = strtolower(trim((string) ($user->profile_reject_reason ?? '')));

        foreach (self::SERIOUS_PATTERNS as $pattern) {
            if ($reason !== '' && str_contains($reason, $pattern)) {
                return ['tier' => self::TIER_NEVER, 'why' => 'the reason names a policy or fraud judgement'];
            }
        }

        // "Submitted and undecided" — nobody ever wrote anything. D6's first category.
        if ($reason === '') {
            return ['tier' => self::TIER_AUTO, 'why' => 'no reason was ever recorded'];
        }

        /*
         * ⚠️ A "REASON" NOBODY COULD READ IS A NO-REASON REJECTION. Live data carries
         * `sdfsdfsfsd` and `sdfsdfsdfsdfsdffsdf` — keyboard mash typed to get past a
         * required field. Treating those as written policy judgements would park real
         * creators in a manual queue for ever over a string that says nothing.
         *
         * ⚠️ Deliberately narrow: ONE word, no spaces, and no vowel-bearing structure is
         * not a sentence. A short REAL reason ("too blurry") has a space and is matched
         * by the benign list instead.
         */
        if (! str_contains($reason, ' ') && strlen($reason) <= 40) {
            return ['tier' => self::TIER_AUTO, 'why' => 'the recorded reason is not readable text'];
        }

        foreach (self::BENIGN_PATTERNS as $pattern) {
            if (str_contains($reason, $pattern)) {
                return ['tier' => self::TIER_AUTO, 'why' => 'an asset-quality or missing-detail rejection'];
            }
        }

        return ['tier' => self::TIER_MANUAL, 'why' => 'a written judgement a person must read'];
    }

    /**
     * The worst open flag on this account, or null.
     *
     * ⚠️ Guarded on the table existing: `user_flags` is created by this app's own
     * migration, and a database built without it must not make this class throw. When we
     * cannot tell, the answer is "no flag" — suspension and the reason patterns are the
     * checks carrying the weight, and a flag lookup failing must not release anybody it
     * would otherwise have stopped, nor block everybody it would not.
     */
    private static function openFlagSeverity(User $user): ?string
    {
        try {
            if (! Schema::hasTable('user_flags')) {
                return null;
            }

            $severities = DB::table('user_flags')
                ->where('user_id', $user->id)
                ->whereNull('resolved_at')
                ->pluck('severity')
                ->map(fn ($s) => strtolower(trim((string) $s)))
                ->all();

            if (in_array('critical', $severities, true)) {
                return 'critical';
            }

            return in_array('warning', $severities, true) ? 'warning' : null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
