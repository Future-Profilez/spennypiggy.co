<?php

namespace App\Support;

use App\Models\ProfileChangeRequest;
use App\Models\SocialLinks;
use App\Models\User;
use Illuminate\Support\Arr;

/**
 * What a creator can fix themselves, said to them before a reviewer says it.
 *
 * 🚨 THE PROBLEM THIS CLOSES. The admin console has run
 * `CreatorReviewAdvisor` for a while: it reads the submitted bio, photo and
 * handles and tells a reviewer "Suggests reject — Wording we cannot publish. The
 * bio contains \"gifting\"." The creator was told none of it. They submitted, waited
 * days, and got a rejection naming a word they could have changed in ten seconds
 * — and the website's own bio field had no content rule at all
 * (`'bio' => ['nullable','string','max:255']`), so nothing stopped it on the way in.
 *
 * 🚨 THIS IS NOT A VERDICT, AND ITS WORDING MUST NEVER READ AS ONE. A reviewer can
 * and does overrule every line of this. Copy says "needs attention" and "will hold
 * up your review"; it never says rejected, never says we will reject, and never
 * promises approval for a profile with nothing flagged. The moment a creator reads
 * this as the decision, an admin's real decision becomes the platform contradicting
 * itself.
 *
 * ⚠️ ONLY ACTIONABLE FINDINGS. The advisor also produces wording for things the
 * creator cannot act on — an intro video's "nothing here has watched it" is advice
 * to the REVIEWER, and its `message` is a draft rejection an admin may never send.
 * Surfacing that would tell every creator their video failed before anyone opened
 * it. Intro is deliberately absent below.
 *
 * ⚠️ Judges what is BEING SUBMITTED, not what is published — same rule as the
 * advisor. When an edit is waiting, the live bio is one an admin already approved,
 * and warning about it would ask the creator to fix something that is already fine.
 */
final class ProfileSelfCheck
{
    /** Submitting this will hold the review up — it breaks a rule we enforce. */
    public const BLOCKING = 'blocking';

    /** A reviewer will probably ask about it. Worth a look, not a refusal. */
    public const ATTENTION = 'attention';

    /**
     * Contact details in a bio.
     *
     * A supporter who takes the conversation off-platform is a supporter the
     * creator is no longer paid for, and the creator is the one who loses. It is a
     * judgement call rather than a refusal, so it raises `attention`.
     *
     * ⚠️ Mirrors `CreatorReviewAdvisor`'s patterns in the admin app.
     */
    private const EMAIL_PATTERN = '/[\w.+-]+@[\w-]+\.[\w.]{2,}/i';

    private const PHONE_PATTERN = '/(?:\+\d[\d\s().-]{7,}\d)/';

    private const URL_PATTERN = '#(?:https?://|www\.)\S+#i';

    /** Link shorteners hide the destination from moderation and the supporter. */
    private const SHORTENERS = [
        'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly',
        'is.gd', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 'linktr.ee',
    ];

    private const MIN_BIO_LENGTH = 15;

    /**
     * Everything worth telling this creator, newest concern first.
     *
     * @return array<int, array{asset: string, label: string, severity: string, message: string}>
     */
    public static function for(User $user, ?SocialLinks $links = null): array
    {
        // Only creators are reviewed this way; a gifter's `profile_status_lock`
        // means something else entirely (see User::needsCardVerification).
        if ((int) $user->role !== 1) {
            return [];
        }

        // ⚠️ ONE query for all four, not one per asset. This runs on every load of
        // the creator's own dashboard.
        $changes = ProfileChangeRequest::openForAssets($user->id, ProfileChangeRequest::ASSETS);

        return array_values(array_filter([
            self::bio($user, $changes[ProfileChangeRequest::ASSET_BIO] ?? null),
            self::media($user, ProfileChangeRequest::ASSET_AVATAR, 'Profile photo', $changes[ProfileChangeRequest::ASSET_AVATAR] ?? null),
            self::media($user, ProfileChangeRequest::ASSET_COVER, 'Cover banner', $changes[ProfileChangeRequest::ASSET_COVER] ?? null),
            self::socials($links, $changes[ProfileChangeRequest::ASSET_SOCIALS] ?? null),
        ]));
    }

    /* -------------------------------------------------------------- bio -- */

    /** @return array{asset: string, label: string, severity: string, message: string}|null */
    private static function bio(User $user, ?ProfileChangeRequest $change): ?array
    {
        $bio = trim((string) ($change
            ? ($change->proposed['bio'] ?? '')
            : $user->bio));

        // Nothing written yet is not something to correct — the checklist step
        // already says the bio is outstanding.
        if ($bio === '') {
            return null;
        }

        // Settled and published. Warning about an approved bio would ask the
        // creator to fix something a person has already said is fine.
        if (! $change && (int) $user->bio_approved === 1) {
            return null;
        }

        // 🚨 The SAME list the bio field itself now refuses on submit, so the
        // screen and the form cannot disagree. A bio already in the queue from
        // before that rule existed still gets told here.
        $match = ContentWording::firstMatch($bio);

        if ($match !== null) {
            return self::finding(
                ProfileChangeRequest::ASSET_BIO,
                'Bio',
                self::BLOCKING,
                'Your bio uses "'.$match['term'].'". We can only describe what you sell as content, '
                .'a membership or a creator service — say what supporters get from you.'
            );
        }

        if (preg_match(self::EMAIL_PATTERN, $bio)) {
            return self::finding(
                ProfileChangeRequest::ASSET_BIO,
                'Bio',
                self::ATTENTION,
                'Your bio contains an email address. Supporters should be able to reach you through '
                .'Spenny Piggy, so everything you sell stays covered by the platform.'
            );
        }

        if (preg_match(self::PHONE_PATTERN, $bio)) {
            return self::finding(
                ProfileChangeRequest::ASSET_BIO,
                'Bio',
                self::ATTENTION,
                'Your bio looks like it contains a phone number. Supporters should be able to reach you '
                .'through Spenny Piggy, so everything you sell stays covered by the platform.'
            );
        }

        if (preg_match(self::URL_PATTERN, $bio)) {
            return self::finding(
                ProfileChangeRequest::ASSET_BIO,
                'Bio',
                self::ATTENTION,
                'Your bio links out to another site. Add your profiles under social links instead, '
                .'where we can check them.'
            );
        }

        if (mb_strlen($bio) < self::MIN_BIO_LENGTH) {
            return self::finding(
                ProfileChangeRequest::ASSET_BIO,
                'Bio',
                self::ATTENTION,
                'Your bio is very short. Write a line or two about what you make and what supporters '
                .'get from you — there may not be enough here to review.'
            );
        }

        return null;
    }

    /* ------------------------------------------------------------ media -- */

    /**
     * The automatic media scan's own verdict, which the creator has never seen.
     *
     * 🚨 NEVER the raw scan label. The stored `moderation_reason` is the soft,
     * category-only wording the scan writes for exactly this purpose — the same
     * rule the held-listing cards follow. A probabilistic label reads as an
     * accusation when it is wrong, and it is wrong often enough to matter.
     *
     * ⚠️ A pending EDIT carries its own verdict on its own row. `users.moderation_reason`
     * describes the image that is still published, so reading it for an asset with an
     * open change request would warn about a photo an admin already approved.
     *
     * @return array{asset: string, label: string, severity: string, message: string}|null
     */
    private static function media(User $user, string $asset, string $label, ?ProfileChangeRequest $change): ?array
    {
        $reason = $change
            ? ($change->moderation_reason ?: null)
            : ($user->moderation_asset === $asset ? ($user->moderation_reason ?: null) : null);

        if (! $reason) {
            return null;
        }

        return self::finding(
            $asset,
            $label,
            self::ATTENTION,
            $reason.' Uploading a different image is usually quicker than waiting for a review.'
        );
    }

    /* ---------------------------------------------------------- socials -- */

    /** @return array{asset: string, label: string, severity: string, message: string}|null */
    private static function socials(?SocialLinks $links, ?ProfileChangeRequest $change): ?array
    {
        if ($change) {
            $handles = Arr::only($change->proposed ?? [], ProfileChangeRequest::SOCIAL_FIELDS);
        } elseif ($links) {
            // Already approved handles are settled; nothing to fix.
            if ((int) $links->status === 1) {
                return null;
            }

            $handles = Arr::only($links->getAttributes(), ProfileChangeRequest::SOCIAL_FIELDS);
        } else {
            return null;
        }

        $handles = array_filter($handles, static fn ($value) => filled($value));

        // No handles yet is a checklist step, not a fault.
        if (! $handles) {
            return null;
        }

        foreach ($handles as $network => $value) {
            foreach (self::SHORTENERS as $shortener) {
                if (str_contains(strtolower((string) $value), $shortener)) {
                    return self::finding(
                        ProfileChangeRequest::ASSET_SOCIALS,
                        'Social handles',
                        self::ATTENTION,
                        'Your '.$network.' link uses a shortened address, which hides where it goes. '
                        .'Please paste the full address of your profile so we can check it.'
                    );
                }
            }

            // http:// is not https://. A bare handle is fine and common.
            if (preg_match('#^http://#i', (string) $value)) {
                return self::finding(
                    ProfileChangeRequest::ASSET_SOCIALS,
                    'Social handles',
                    self::ATTENTION,
                    'Your '.$network.' link is an http:// address. Please update it to https:// — '
                    .'we cannot check a link that is not secure.'
                );
            }
        }

        return null;
    }

    /* ------------------------------------------------------------ shape -- */

    /** @return array{asset: string, label: string, severity: string, message: string} */
    private static function finding(string $asset, string $label, string $severity, string $message): array
    {
        return [
            'asset' => $asset,
            'label' => $label,
            'severity' => $severity,
            'message' => $message,
        ];
    }
}
