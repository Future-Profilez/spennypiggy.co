<?php

namespace App\Services;

use App\Helpers;
use App\Jobs\CheckMediaModeration;
use App\Models\User;
use App\Support\ModerationNotice;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * The text half of the SFW gate.
 *
 * The image scan has always been the whole gate, but a reward can BE text — the
 * unified reward contract lets a creator sell a written message or a link, and
 * the title and description are shown on the card and the receipt either way.
 * None of it was screened, so a listing whose images were clean went live with
 * whatever was typed into it, and the review queue had no way to say "the text
 * is the problem".
 *
 * The blocked-word list is `Helpers::checkBlockText` — the same one that already
 * screens supporter messages. Reusing it means a term banned in a message
 * cannot be sold as a reward, and there is one list to maintain.
 *
 * Unlike the image scan this runs synchronously at save time: it is a string
 * comparison, and there is nothing to wait for.
 */
class ItemTextModeration
{
    /** The asset key written to `moderation_asset` for a text hold. */
    public const ASSET = 'reward_text';

    /**
     * Screen an item's text and hold it if anything is blocked.
     *
     * @param  array  $fields  Columns to read, in the order they should be checked.
     * @param  array  $flagOnViolation  Attributes marking the item held (e.g. ['approved' => 0]).
     * @return bool Whether the item was held.
     */
    public static function apply(?Model $item, array $fields, array $flagOnViolation): bool
    {
        if (! $item || empty($flagOnViolation)) {
            return false;
        }

        [$field, $blocked] = self::firstBlocked($item, $fields);

        if ($blocked === null) {
            return false;
        }

        try {
            $reason = self::reason($field, $blocked);
            $attributes = $flagOnViolation;

            if (Schema::hasColumn($item->getTable(), 'moderation_reason')) {
                $attributes['moderation_reason'] = $reason;
            }

            if (Schema::hasColumn($item->getTable(), 'moderation_asset')) {
                $attributes['moderation_asset'] = self::ASSET;
            }

            $item->forceFill($attributes)->save();

            Log::warning('Content held by text moderation', [
                'model' => $item::class,
                'id' => $item->getKey(),
                'field' => $field,
                'term' => $blocked,
            ]);

            self::notifyCreator($item, $reason);

            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to flag text-moderated content: '.$e->getMessage());

            return false;
        }
    }

    /**
     * The first blocked term found, and the field it came from.
     *
     * @return array{0: ?string, 1: ?string}
     */
    private static function firstBlocked(Model $item, array $fields): array
    {
        foreach ($fields as $field) {
            // A hidden column (reward_body is $hidden by contract) still reads
            // fine through getAttribute — $hidden only affects serialisation.
            $value = $item->getAttribute($field);

            if (! is_string($value) || trim($value) === '') {
                continue;
            }

            $blocked = Helpers::checkBlockText($value);

            if ($blocked !== false) {
                return [$field, $blocked];
            }
        }

        return [null, null];
    }

    /**
     * Creator-facing reason.
     *
     * The blocked term IS quoted here, unlike an image flag. An image label is a
     * probabilistic guess that can be wrong and reads as an accusation; a
     * blocked word is something the creator typed, so naming it is the only way
     * they can find and fix it.
     */
    private static function reason(?string $field, string $blocked): string
    {
        $where = match ($field) {
            'reward_title' => 'the reward title',
            'reward_body' => 'the reward message',
            'reward_description' => 'the reward detail',
            'description', 'content_description' => 'the description',
            default => 'the text on this listing',
        };

        return "Held because {$where} contains \"{$blocked}\". Edit the wording to make it live, or contact support if you think this is a mistake.";
    }

    /** Same bell notification the image scan sends, so a hold always reaches the creator. */
    private static function notifyCreator(Model $item, string $reason): void
    {
        try {
            $creatorId = $item->getAttribute('user_id') ?? $item->getAttribute('creator_id');
            $creator = $creatorId ? User::find($creatorId) : null;

            if (! $creator) {
                return;
            }

            $label = CheckMediaModeration::FEATURE_LABELS[class_basename($item)] ?? 'item';
            $title = trim((string) ($item->getAttribute('title') ?? $item->getAttribute('name') ?? ''));

            ModerationNotice::send($creator, $label, $title, $reason);
        } catch (\Throwable $e) {
            Log::warning('Text moderation notify failed: '.$e->getMessage());
        }
    }
}
