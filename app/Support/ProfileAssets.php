<?php

namespace App\Support;

use App\Models\User;

/**
 * Which of the three profile assets a creator has not supplied yet.
 *
 * 🚨 THIS IS WHAT IS LEFT OF `App\Support\ReviewSubmission`, WHICH WAS DELETED ON
 * 11 Sep 2026. That class answered "has this creator submitted, and can an admin see
 * them" — a question about a Submit button and a review queue, neither of which exists
 * now. Profiles approve themselves (`ProfileAutoApproval`).
 *
 * What survived is the only part that was never about review: the plain list of missing
 * assets, and the sentence that reads it out. Two mails and a nudge command need it to
 * say "add a photo and a bio" — no more than that.
 *
 * ⚠️ PRESENCE, NOT APPROVAL. "You have not written a bio" and "your bio was turned
 * down" are different sentences to a creator. Approval state is `ProfileAutoApproval::holding()`.
 */
class ProfileAssets
{
    /** @return array<int, string> */
    public static function missing(User $user): array
    {
        $missing = [];

        if (blank($user->avatar)) {
            $missing[] = 'a profile photo';
        }

        if (blank($user->bio)) {
            $missing[] = 'a bio';
        }

        if (! ProfileAssetVisibility::hasAnyHandle($user->social_links)) {
            $missing[] = 'a social handle';
        }

        return $missing;
    }

    /** "a photo, a bio and a social handle" — for a sentence, not a list. */
    public static function readableList(array $items): string
    {
        if ($items === []) {
            return '';
        }

        if (count($items) === 1) {
            return $items[0];
        }

        $last = array_pop($items);

        return implode(', ', $items).' and '.$last;
    }
}
