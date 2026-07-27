<?php

namespace App\Services;

use App\Helpers;

/**
 * Stripe compliance: every upload surface (posts, wish/bill/shop content files) must pass
 * moderation — PG-13 only, no adult content. This service is the single seam through which
 * all moderation runs:
 *   - Text is screened now via the existing blocked-word/emoji list (Helpers::checkBlockText).
 *   - Media (image/video) AI adult-content classification is stubbed (returns "pass") and is
 *     intended to be wired to an AI provider later — callers do not change when it is added.
 *
 * Result shape: ['flagged' => bool, 'reason' => ?string, 'needs_review' => bool].
 */
class ModerationService
{
    /**
     * Screen a piece of user content before it is published / charged for.
     *
     * @param  string  $text  Free text to screen (title, description, message)
     * @param  string|null  $mediaUrl  Optional media URL to classify (image/video)
     */
    public function classify(string $text = '', ?string $mediaUrl = null): array
    {
        // 1. Text blocklist (active today).
        $blocked = Helpers::checkBlockText($text);
        if ($blocked !== false) {
            return [
                'flagged' => true,
                'reason' => "Blocked term: {$blocked}",
                'needs_review' => false, // hard block, not a review case
            ];
        }

        // 2. Media adult-content / PG-13 classification.
        //    SEAM: integrate an AI image/video classifier here. Until then it passes,
        //    so flagged media is caught only by manual moderation + the text blocklist.
        $mediaVerdict = $this->classifyMedia($mediaUrl);
        if ($mediaVerdict['flagged']) {
            return $mediaVerdict;
        }

        return ['flagged' => false, 'reason' => null, 'needs_review' => false];
    }

    /**
     * AI media classification seam. Returns a pass today; replace the body with a real
     * provider call (e.g. image moderation API) returning flagged=true + needs_review
     * when adult / non-PG-13 content is detected.
     */
    protected function classifyMedia(?string $mediaUrl): array
    {
        if (empty($mediaUrl)) {
            return ['flagged' => false, 'reason' => null, 'needs_review' => false];
        }

        // TODO(ai-moderation): call AI classifier; flag + route to manual review on adult content.
        return ['flagged' => false, 'reason' => null, 'needs_review' => false];
    }
}
