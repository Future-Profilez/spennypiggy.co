<?php

namespace App\Services;

use App\Models\User;
use App\Uploadcare;
use Illuminate\Support\Facades\Log;

/**
 * Renders a creator's profile URL to a transparent PNG and stores it on
 * Uploadcare, so App\Support\MediaUrl can stamp it onto public preview images
 * with `-/overlay/`.
 *
 * ⚠️ A generated PNG, not Uploadcare's `-/text/` operation. Text overlay is
 * disabled by default on every Uploadcare project and needs their sales team to
 * switch it on — an external dependency with no timeline that would have
 * blocked the whole feature. This route works today and gives us the font.
 */
class CreatorWatermarkService
{
    /** Uploadcare rejects an empty upload; a handle this short is not real. */
    private const MIN_USERNAME = 1;

    /**
     * Does this creator need a watermark rendered (or re-rendered)?
     *
     * The PNG prints the profile URL, so a rename does not make it stale — it
     * makes it WRONG, pointing supporters at a handle that no longer resolves.
     */
    public function needsGeneration(User $user): bool
    {
        $username = $this->usernameOf($user);

        if ($username === null) {
            return false;
        }

        if (empty($user->watermark_uuid)) {
            return true;
        }

        return ! hash_equals((string) $user->watermark_for_username, $username);
    }

    /**
     * Render + upload, returning the new uuid (or null on any failure).
     *
     * Never throws: this runs from a queued job and from a backfill sweep, and
     * a creator without a watermark simply serves unwatermarked images.
     */
    public function generate(User $user): ?string
    {
        $username = $this->usernameOf($user);

        if ($username === null) {
            return null;
        }

        try {
            $png = $this->render($this->label($username));

            if ($png === null) {
                return null;
            }

            $uuid = Uploadcare::getApiObj()
                ->uploader()
                ->fromContent($png, 'image/png', 'watermark-'.$username.'.png')
                ->getUuid();

            if (! is_string($uuid) || $uuid === '') {
                return null;
            }

            // saveQuietly: this is a derived asset, and touching updated_at here
            // would bump UserProfileService's data-derived cache version for
            // every creator the backfill walks.
            $user->forceFill([
                'watermark_uuid' => $uuid,
                'watermark_for_username' => $username,
            ])->saveQuietly();

            return $uuid;
        } catch (\Throwable $e) {
            Log::warning('Creator watermark generation failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * The text printed on the watermark — the creator's public profile URL.
     */
    public function label(string $username): string
    {
        return rtrim((string) config('media.watermark.host', 'spennypiggy.co'), '/').'/'.$username;
    }

    /**
     * Draw the label as a transparent PNG.
     *
     * White text with a soft dark shadow: the overlay lands on photographs we
     * have never seen, so it has to stay legible on a white background and on a
     * black one without knowing which it got.
     */
    private function render(string $text): ?string
    {
        $font = (string) config('media.watermark.font');

        if ($font === '' || ! is_readable($font)) {
            Log::warning('Creator watermark font missing', ['font' => $font]);

            return null;
        }

        if (! function_exists('imagettftext')) {
            Log::warning('Creator watermark needs GD with FreeType support');

            return null;
        }

        $size = (int) config('media.watermark.font_size', 44);
        $pad = (int) config('media.watermark.padding', 22);

        $box = imagettfbbox($size, 0, $font, $text);

        if ($box === false) {
            return null;
        }

        $textWidth = (int) abs($box[2] - $box[0]);
        $textHeight = (int) abs($box[7] - $box[1]);

        $width = $textWidth + ($pad * 2);
        $height = $textHeight + ($pad * 2);

        if ($width < 1 || $height < 1) {
            return null;
        }

        $canvas = imagecreatetruecolor($width, $height);

        if ($canvas === false) {
            return null;
        }

        try {
            imagesavealpha($canvas, true);
            imagealphablending($canvas, false);
            imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas, 0, 0, 0, 127));
            imagealphablending($canvas, true);

            $shadow = imagecolorallocatealpha($canvas, 0, 0, 0, 70);
            $ink = imagecolorallocatealpha($canvas, 255, 255, 255, 15);

            $x = $pad;
            $y = $height - $pad;

            imagettftext($canvas, $size, 0, $x + 2, $y + 2, $shadow, $font, $text);
            imagettftext($canvas, $size, 0, $x, $y, $ink, $font, $text);

            ob_start();
            imagepng($canvas, null, 9);
            $png = ob_get_clean();

            return is_string($png) && $png !== '' ? $png : null;
        } finally {
            imagedestroy($canvas);
        }
    }

    /**
     * The handle to print, or null when this account should not get one.
     */
    private function usernameOf(User $user): ?string
    {
        $username = trim((string) ($user->username ?? ''));

        if (mb_strlen($username) < self::MIN_USERNAME) {
            return null;
        }

        // Creators only — a supporter has no public creator page for the
        // watermark to point at, and nothing of theirs is publicly previewed.
        if ((int) $user->role !== 1) {
            return null;
        }

        return $username;
    }
}
