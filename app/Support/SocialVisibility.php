<?php

namespace App\Support;

use App\Models\SocialLinks;

/**
 * "Which of this creator's social handles may a stranger see?"
 *
 * 🚨 THE ONE DEFINITION. Three surfaces ask it — the profile payload, the owner's own
 * editor, and the visibility save — and a fourth answer written out by hand is how the
 * handle a creator hid reappears on one page and not another.
 *
 * A handle is public only when ALL THREE hold:
 *   1. the creator listed that platform in `social_links.public_platforms`,
 *   2. the row is APPROVED (`status = 1`), and
 *   3. the column actually carries a value.
 *
 * ⚠️ (2) is not redundant. Turning a platform on is a display choice and never a
 * re-submission, so a creator can tick a handle that is still pending — and a pending
 * handle is one nobody has checked. Publishing it because it was ticked would put an
 * unreviewed link on a public page, which is what the review exists to stop.
 *
 * 🚨 NULL / EMPTY MEANS HIDDEN, FOR EVERY ROW THAT ALREADY EXISTS (6 Sep 2026, client
 * direction). Nothing here may ever read an absent value as "show everything" — that is
 * the pre-change behaviour, and it is the case this class was written to end.
 */
class SocialVisibility
{
    /**
     * ⚠️ `ProfileAssetVisibility::HANDLE_COLUMNS`, never `SocialLinks::ACCEPTED_PLATFORMS`.
     * A creator verified on a platform that has since been retired still has a handle
     * rendering on their profile, and it must be hideable too — the whole point is that
     * nothing is published without being chosen.
     */
    public static function platforms(): array
    {
        return ProfileAssetVisibility::HANDLE_COLUMNS;
    }

    /**
     * The platform keys the creator has chosen to show, as stored.
     *
     * ⚠️ Says nothing about approval or about whether the handle exists — it is the raw
     * choice, which is what the OWNER's editor has to render (a toggle must stay on
     * while the handle it belongs to is in review). Use `isPublic()` for what a visitor
     * may see.
     */
    public static function chosen(?SocialLinks $links): array
    {
        if (! $links) {
            return [];
        }

        return self::sanitise($links->public_platforms);
    }

    /** Is this one platform visible to a stranger right now? */
    public static function isPublic(?SocialLinks $links, string $platform): bool
    {
        if (! $links || (int) $links->status !== SocialLinks::STATUS_APPROVED) {
            return false;
        }

        if (! in_array($platform, self::platforms(), true)) {
            return false;
        }

        return filled($links->{$platform}) && in_array($platform, self::chosen($links), true);
    }

    /** Does this creator show anything at all? */
    public static function hasAnyPublic(?SocialLinks $links): bool
    {
        foreach (self::platforms() as $platform) {
            if (self::isPublic($links, $platform)) {
                return true;
            }
        }

        return false;
    }

    /**
     * The row as a VISITOR may receive it, or null when there is nothing to show.
     *
     * 🚨 Returns an ARRAY, never the model. Handing back a model with its handle
     * attributes blanked is one `->save()` away from deleting the creator's handles for
     * real — and the caller sits in a profile payload that also writes caches.
     *
     * ⚠️ `null` for "nothing public" rather than a row of nulls: the profile payload
     * already treats null as "no socials", so every existing reader (`CoverIdentity`'s
     * `slinks?.[key]`) needs no change, and a stranger is told nothing about which
     * platforms exist. `status` and `reason` are dropped for the same reason — a
     * visitor has no business reading the state of somebody else's review.
     */
    public static function forVisitor(?SocialLinks $links): ?array
    {
        if (! self::hasAnyPublic($links)) {
            return null;
        }

        $public = [];

        foreach (self::platforms() as $platform) {
            if (self::isPublic($links, $platform)) {
                $public[$platform] = $links->{$platform};
            }
        }

        return $public + [
            'public_platforms' => array_keys($public),
            'has_any_handle' => true,
            'status' => SocialLinks::STATUS_APPROVED,
        ];
    }

    /**
     * A submitted list of platform keys, cleaned.
     *
     * ⚠️ An unknown key is DROPPED, not refused. This arrives from a form beside a
     * handle edit the creator does care about, and failing the whole save because the
     * payload named a platform this table has no column for would lose their real work.
     * Anything not on the list simply cannot be published, which is the safe direction.
     */
    public static function sanitise(mixed $input): array
    {
        if (is_string($input)) {
            $decoded = json_decode($input, true);
            $input = is_array($decoded) ? $decoded : [];
        }

        if (! is_array($input)) {
            return [];
        }

        $allowed = self::platforms();

        $clean = [];

        foreach ($input as $value) {
            if (! is_scalar($value)) {
                continue;
            }

            $key = strtolower(trim((string) $value));

            if (in_array($key, $allowed, true) && ! in_array($key, $clean, true)) {
                $clean[] = $key;
            }
        }

        return $clean;
    }

    /**
     * What to STORE for this save: the creator's choice, narrowed to platforms they are
     * actually submitting a handle for.
     *
     * ⚠️ Judged against `$handles` (what this save proposes), NOT against the stored
     * row — a creator types a handle and turns it on in the same submit, and reading the
     * old row would silently discard the toggle they just set.
     *
     * ⚠️ Clearing a handle therefore also clears its visibility. Otherwise a platform
     * re-added months later would come back already public, on the strength of a choice
     * made about a different account.
     *
     * @param  array<string, mixed>  $handles  platform column => proposed value
     */
    public static function forStorage(mixed $submitted, array $handles): array
    {
        return array_values(array_filter(
            self::sanitise($submitted),
            fn (string $platform) => filled($handles[$platform] ?? null),
        ));
    }
}
