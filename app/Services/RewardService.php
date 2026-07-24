<?php

namespace App\Services;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\TipGoal;
use App\Models\WishItem;
use App\Rules\NoExpenseOrBrandName;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * The single definition of "what does the supporter get?".
 *
 * Before this, each module answered that question in its own shape — wish read
 * `content_file`, shop read `success_page_type`/`success_page_value`, task read
 * `deliverable_content_type`, bills and memberships had no answer at all — and
 * every display surface (checkout, thank-you page, purchases hub, history feed)
 * re-implemented the branching. That is why the same purchase could describe
 * itself three different ways.
 *
 * Everything now goes through for(): it prefers the unified reward_* columns
 * and falls back to each module's legacy columns, so nothing had to be
 * migrated for existing listings to render correctly.
 */
class RewardService
{
    /** Recurring products deliver an ongoing bundle, not a single artefact. */
    public const RECURRING_MODULES = ['bill', 'membership'];

    private const MODULES = [
        WishItem::class => 'wish',
        Shop::class => 'shop',
        Task::class => 'task',
        PiggyPot::class => 'piggy_pot',
        TipGoal::class => 'tip',
        Bills::class => 'bill',
        Membership::class => 'membership',
    ];

    /**
     * Normalise any sellable item into the reward contract.
     *
     * `type` describes what the supporter receives immediately. Recurring
     * products carry the same instant reward (their welcome) PLUS an ongoing
     * perks list and members-only post access, flagged by `is_recurring` —
     * there is no separate "bundle" type, because a bundle is a one-off reward
     * with more attached, not a different kind of thing.
     *
     * @return array{module:?string,title:string,type:string,description:?string,
     *               media:?array,text:?string,link:?string,perks:array,
     *               is_recurring:bool,post_access:bool,post_access_label:?string,
     *               is_instant:bool}
     */
    public static function for(?Model $item): array
    {
        if (! $item) {
            return self::empty();
        }

        $module = self::moduleFor($item);
        $recurring = in_array($module, self::RECURRING_MODULES, true);

        $reward = [
            'module' => $module,
            'title' => self::title($item),
            'type' => null,
            'description' => self::clean($item->reward_description ?? null),
            'media' => null,
            'text' => null,
            'link' => null,
            'perks' => $recurring ? self::perks($item) : [],
            'is_recurring' => $recurring,
            'post_access' => $recurring,
            // A Bill grants subscriber-only posts, a Membership member-only
            // ones. Without this every recurring purchase read "Members-only
            // posts", including the product that has no members.
            'post_access_label' => $module === 'bill' ? 'Subscriber-only posts' : 'Members-only posts',
            'is_instant' => false,
        ];

        // The unified columns win when the creator has filled them in; legacy
        // listings fall through to the module's original fields.
        $type = self::clean($item->reward_type ?? null);
        $body = self::clean(self::rawAttribute($item, 'reward_body'));

        // A body with no declared type predates the type column — it can only
        // have been written as a message.
        if ($type === null && $body !== null) {
            $type = 'message';
        }

        if ($type === 'message' && $body !== null) {
            $reward['type'] = 'message';
            $reward['text'] = $body;
        } elseif ($type === 'link' && $body !== null) {
            $reward['type'] = 'link';
            $reward['link'] = $body;
        } else {
            $reward = self::withLegacy($reward, $item, $module);
        }

        $reward['type'] ??= match (true) {
            (bool) $reward['media'] => 'file',
            (bool) $reward['link'] => 'link',
            default => 'message',
        };

        $reward['is_instant'] = (bool) ($reward['media'] || $reward['text'] || $reward['link']);

        return $reward;
    }

    /**
     * Validation rules shared by every add/edit item endpoint, so a module
     * cannot quietly accept a weaker reward than the others.
     */
    public static function validationRules(bool $required = true, ?string $requiredRule = null): array
    {
        $types = config('rewards.types');

        return [
            'reward_title' => [
                $required ? ($requiredRule ?? 'required') : 'nullable',
                'string',
                'max:'.config('rewards.title_max'),
                new NoExpenseOrBrandName,
            ],
            'reward_type' => ['nullable', 'string', Rule::in($types)],
            'reward_body' => [
                'nullable',
                'string',
                'max:'.config('rewards.message_max'),
                'required_if:reward_type,message',
                'required_if:reward_type,link',
            ],
            'reward_description' => ['nullable', 'string', 'max:'.config('rewards.description_max')],
        ];
    }

    /**
     * Rule for the module's own file column. The file is only mandatory when
     * the reward is delivered as a file — a message or link reward has no
     * upload. A request that omits reward_type entirely is treated as a file
     * reward, which is how every listing behaved before this contract existed.
     */
    public static function fileRule(bool $required = true): array
    {
        return array_filter([
            'nullable',
            'string',
            $required ? 'required_unless:reward_type,message,link' : null,
        ]);
    }

    /**
     * Stripe compliance: a recurring content subscription must deliver content
     * on this platform. Accepts the perk list in any of the shapes the forms
     * and legacy rows use (array, JSON, comma-separated string).
     */
    public static function hasOnPlatformPerk($rewards): bool
    {
        if (is_string($rewards)) {
            $decoded = json_decode($rewards, true);
            $rewards = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $rewards)));
        }

        if (! is_array($rewards)) {
            return false;
        }

        $normalised = array_map(fn ($perk) => trim((string) $perk), $rewards);

        return count(array_intersect($normalised, config('rewards.on_platform_perks', []))) > 0;
    }

    /**
     * Reward columns plus the module's own file columns, for the modules whose
     * file lives in `content_file` (wish, bill, membership, piggy pot).
     *
     * The file columns are cleared when the reward is not a file, so switching
     * a listing from a download to a written message cannot leave the old file
     * attached and deliver both.
     *
     * @return array<string, mixed>
     */
    public static function columnsWithFile(array $input): array
    {
        $isFile = (self::clean($input['reward_type'] ?? null) ?? 'file') === 'file';

        return self::columnsFrom($input) + [
            'content_file' => $isFile ? (self::clean($input['content_file'] ?? null)) : null,
            'content_file_type' => $isFile ? (self::clean($input['content_file_type'] ?? null)) : null,
            'content_file_name' => $isFile ? (self::clean($input['content_file_name'] ?? null)) : null,
            'content_file_size' => $isFile ? (int) ($input['content_file_size'] ?? 0) ?: null : null,
        ];
    }

    /**
     * The link error for a submitted reward, or null when the submission is
     * not a link at all. Controllers call this after validation because a
     * shortener check does not belong in a validation string.
     */
    public static function submittedLinkError(array $input): ?string
    {
        if (self::clean($input['reward_type'] ?? null) !== 'link') {
            return null;
        }

        return self::linkError(self::normaliseLink(self::clean($input['reward_body'] ?? null) ?? ''));
    }

    /**
     * Columns to persist, given the submitted reward fields. A link is
     * normalised and checked here rather than in each controller.
     *
     * @return array{reward_title:string,reward_type:?string,reward_body:?string,reward_description:?string}
     */
    public static function columnsFrom(array $input): array
    {
        $type = self::clean($input['reward_type'] ?? null);
        $body = self::clean($input['reward_body'] ?? null);

        if ($type === 'link' && $body !== null) {
            $body = self::normaliseLink($body);
        }

        // A file reward carries no body — the file lives in the module's own
        // column, and leaving a stale message behind would render both.
        if ($type === 'file') {
            $body = null;
        }

        return [
            'reward_title' => self::clean($input['reward_title'] ?? null) ?? config('rewards.default_title'),
            'reward_type' => $type,
            'reward_body' => $body,
            'reward_description' => self::clean($input['reward_description'] ?? null),
        ];
    }

    /**
     * Why a submitted link is unacceptable, or null when it is fine. Shorteners
     * hide the destination from both moderation and the supporter.
     */
    public static function linkError(?string $url): ?string
    {
        $url = self::clean($url);

        if ($url === null) {
            return 'Add the link supporters will receive.';
        }

        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = strtolower($parts['host'] ?? '');

        if ($host === '') {
            return 'That does not look like a valid link.';
        }

        if (config('rewards.link.require_https') && $scheme !== 'https') {
            return 'Links must start with https:// so the content is delivered securely.';
        }

        $host = Str::of($host)->after('www.')->toString();

        foreach (config('rewards.link.blocked_hosts', []) as $blocked) {
            if ($host === $blocked || str_ends_with($host, '.'.$blocked)) {
                return 'Shortened links are not accepted — paste the full destination link instead.';
            }
        }

        return null;
    }

    /** Build a display URL + kind for a stored file reference. */
    public static function media(?string $reference, ?string $mime = null, ?string $name = null, $size = null): ?array
    {
        $reference = self::clean($reference);

        if ($reference === null) {
            return null;
        }

        $url = Str::startsWith($reference, ['http://', 'https://'])
            ? $reference
            : 'https://ucarecdn.com/'.trim($reference, '/').'/';

        return [
            'url' => $url,
            'uuid' => Str::startsWith($reference, ['http://', 'https://']) ? null : trim($reference, '/'),
            'kind' => self::kind($mime, $name ?: $url),
            'mime' => $mime,
            'name' => $name,
            'size' => $size !== null ? (int) $size : null,
        ];
    }

    /** image | video | audio | pdf | document | archive | file */
    public static function kind(?string $mime, ?string $nameOrUrl = null): string
    {
        $mime = strtolower(trim((string) $mime));

        if ($mime !== '') {
            foreach (['image', 'video', 'audio'] as $prefix) {
                if (str_starts_with($mime, $prefix.'/')) {
                    return $prefix;
                }
            }

            if ($mime === 'application/pdf') {
                return 'pdf';
            }
        }

        $extension = strtolower(pathinfo(parse_url((string) $nameOrUrl, PHP_URL_PATH) ?: (string) $nameOrUrl, PATHINFO_EXTENSION));

        if ($extension !== '') {
            foreach (config('rewards.kind_extensions', []) as $kind => $extensions) {
                if (in_array($extension, $extensions, true)) {
                    return $kind;
                }
            }
        }

        return 'file';
    }

    public static function moduleFor(Model $item): string
    {
        foreach (self::MODULES as $class => $module) {
            if ($item instanceof $class) {
                return $module;
            }
        }

        return Str::snake(class_basename($item));
    }

    /** Perk values → display rows, dropping anything no longer offered. */
    public static function perks($item): array
    {
        $raw = $item->rewards ?? null;

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $raw)));
        }

        if (! is_array($raw)) {
            return [];
        }

        $catalogue = config('rewards.perks', []);
        $onPlatform = config('rewards.on_platform_perks', []);
        $perks = [];

        foreach ($raw as $value) {
            $value = trim((string) $value);

            if ($value === '' || ! isset($catalogue[$value])) {
                continue;
            }

            $perks[] = [
                'value' => $value,
                'label' => $catalogue[$value],
                'is_on_platform' => in_array($value, $onPlatform, true),
            ];
        }

        return $perks;
    }

    private static function withLegacy(array $reward, Model $item, string $module): array
    {
        switch ($module) {
            case 'wish':
                $reward['media'] = self::media(
                    $item->content_file,
                    $item->content_file_type,
                    $item->content_file_name,
                    $item->content_file_size,
                );
                $reward['type'] = $reward['media'] ? 'file' : null;

                if (! $reward['media'] && self::clean($item->reward)) {
                    $reward['type'] = 'message';
                    $reward['text'] = self::clean($item->reward);
                }
                break;

            case 'shop':
                $legacyType = self::clean($item->success_page_type);
                $legacyValue = self::clean(self::rawAttribute($item, 'success_page_value'));
                $file = self::rawAttribute($item, 'reward_file');

                if ($file) {
                    $reward['media'] = self::media($file, $item->reward_file_type);
                    $reward['type'] = 'file';
                } elseif ($legacyType === 'url' && $legacyValue) {
                    $reward['type'] = 'link';
                    $reward['link'] = $legacyValue;
                } elseif ($legacyValue) {
                    $reward['type'] = 'message';
                    $reward['text'] = $legacyValue;
                }
                break;

            case 'task':
                $content = self::clean($item->deliverable_content);
                $reward['description'] ??= self::clean($item->deliverable_note);

                if ($content && self::clean($item->deliverable_content_type) === 'text') {
                    $reward['type'] = 'message';
                    $reward['text'] = $content;
                } elseif ($content) {
                    // Task stores 'voice' for audio; the MIME is unknown, so the
                    // declared type seeds the kind and the URL refines it.
                    $declared = self::clean($item->deliverable_content_type);
                    $reward['media'] = self::media($content);
                    $reward['media']['kind'] = $reward['media']['kind'] === 'file' && $declared
                        ? ($declared === 'voice' ? 'audio' : $declared)
                        : $reward['media']['kind'];
                    $reward['type'] = 'file';
                }
                break;

            case 'piggy_pot':
                $reward['media'] = self::media($item->content_file);
                $reward['description'] ??= self::clean($item->content_description);
                $reward['type'] = $reward['media'] ? 'file' : null;
                break;

            case 'bill':
            case 'membership':
                $reward['media'] = self::media(
                    $item->content_file,
                    $item->content_file_type ?? null,
                    $item->content_file_name ?? null,
                    $item->content_file_size ?? null,
                );
                break;

            case 'tip':
            default:
                break;
        }

        return $reward;
    }

    /**
     * Read a column that the model hides from serialisation. $hidden only
     * affects toArray(), so a direct attribute read is correct here — this is
     * the entitlement-checked path, not a public payload.
     */
    private static function rawAttribute(Model $item, string $column)
    {
        return $item->getAttribute($column);
    }

    private static function title(Model $item): string
    {
        $title = self::clean($item->reward_title ?? null);

        return $title ?? config('rewards.default_title');
    }

    private static function normaliseLink(string $url): string
    {
        return preg_match('#^https?://#i', $url) ? $url : 'https://'.ltrim($url, '/');
    }

    private static function clean($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private static function empty(): array
    {
        return [
            'module' => null,
            'title' => config('rewards.default_title'),
            'type' => 'message',
            'description' => null,
            'media' => null,
            'text' => null,
            'link' => null,
            'perks' => [],
            'is_recurring' => false,
            'post_access' => false,
            'post_access_label' => null,
            'is_instant' => false,
        ];
    }
}
