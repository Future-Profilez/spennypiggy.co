<?php

namespace App\Services;

use App\Models\Bills;
use App\Models\CreatorBioLink;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Support\BioLinkPlatforms;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Builds the `/{username}/bio` page.
 *
 * 🚨 THE INTERNAL BUTTONS ARE DERIVED, NOT STORED. `availability()` asks what
 * the creator actually has live right now; `linksFor()` turns that into
 * buttons and lets rows in `creator_bio_links` override the result. So a pot
 * held for moderation, a suspended shop item or a deleted wishlist takes its
 * own button off the page with no editing and no cron, and a module the creator
 * adds next month appears without anyone opening the editor.
 *
 * ⚠️ Availability uses the SAME approval filters as the profile
 * (`approved`/`is_approved` = 1, `is_suspended` = 0, pots `status = active`).
 * A looser filter here would advertise, from the creator's most-shared link, an
 * item a visitor then cannot buy — worse than not showing it at all.
 */
class BioPageService
{
    /** Availability is re-read often and changes rarely. */
    private const AVAILABILITY_TTL = 60;

    /**
     * Which internal sections this creator has something live in.
     *
     * ⚠️ Every check is an indexed EXISTS, never a count and never a fetch —
     * this runs on a public page whose whole purpose is to load instantly, and
     * nothing here needs to know HOW MANY.
     */
    public function availability(User $user): array
    {
        $key = "bio_avail_{$user->id}";

        $compute = fn () => [
            'wishes' => WishItem::where('user_id', $user->id)
                ->where('is_approved', 1)->where('is_suspended', 0)->exists(),

            'shop' => Shop::where('user_id', $user->id)
                ->where('approved', 1)->where('is_suspended', 0)->exists(),

            'piggyPots' => PiggyPot::where('user_id', $user->id)
                ->where('status', 'active')->exists(),

            'memberships' => Membership::where('user_id', $user->id)
                ->where('approved', 1)->where('is_suspended', 0)->exists(),

            'bills' => Bills::where('user_id', $user->id)
                ->where('approved', 1)->where('is_suspended', 0)->exists(),

            'tasks' => Task::where('creator_id', $user->id)
                ->where('is_approved', 1)->where('is_suspended', 0)->exists(),

            'feed' => Post::where('user_id', $user->id)->exists(),

            // Not a listing — a widget the creator can switch off. It is on by
            // default, so an unselected or absent column must read as visible
            // or every creator loses the button.
            'piggyBank' => (bool) ($user->show_piggy_bank ?? true),
        ];

        // Signed-in viewers skip the cache, matching UserProfileService: an
        // owner editing their page must see the effect immediately.
        if (auth()->check()) {
            return $compute();
        }

        return Cache::remember($key, self::AVAILABILITY_TTL, $compute);
    }

    /**
     * The ordered buttons for the page.
     *
     * @param  bool  $isOwner  Owners additionally see what they have switched
     *                         off, so the editor and the live page agree.
     */
    public function linksFor(User $user, bool $isOwner = false): array
    {
        $availability = $this->availability($user);

        $overrides = CreatorBioLink::where('user_id', $user->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $internalOverrides = $overrides->where('kind', BioLinkPlatforms::KIND_INTERNAL)
            ->keyBy('target_type');

        $links = [];

        foreach (BioLinkPlatforms::DEFAULT_ORDER as $index => $targetKey) {
            $target = BioLinkPlatforms::internalTarget($targetKey);

            if ($target === null || ! ($availability[$target['requires']] ?? false)) {
                continue;
            }

            $override = $internalOverrides->get($targetKey);

            if ($override && ! $override->is_active && ! $isOwner) {
                continue;
            }

            $links[] = [
                'uuid' => $override?->uuid,
                'kind' => BioLinkPlatforms::KIND_INTERNAL,
                'target_type' => $targetKey,
                'platform' => null,
                'label' => $override?->displayLabel() ?? $target['label'],
                'url' => BioLinkPlatforms::internalUrl($targetKey, $user->username),
                'sort_order' => $override->sort_order ?? $index,
                'is_active' => $override ? $override->is_active : true,
                'click_count' => $override->click_count ?? 0,
            ];
        }

        foreach ($overrides->where('kind', BioLinkPlatforms::KIND_EXTERNAL) as $link) {
            if (! $link->is_active && ! $isOwner) {
                continue;
            }

            $url = $link->resolvedUrl();

            // A platform withdrawn from the whitelist leaves rows behind. They
            // are kept — removing a creator's link because we narrowed a list
            // is not ours to do silently — but they are never rendered as a
            // button, because there is no destination to send anyone to.
            if ($url === null) {
                continue;
            }

            $links[] = [
                'uuid' => $link->uuid,
                'kind' => BioLinkPlatforms::KIND_EXTERNAL,
                'target_type' => null,
                'platform' => $link->platform,
                'label' => $link->displayLabel(),
                // The button href is always the counting redirect; the real
                // destination is resolved server-side at click time.
                'url' => route('bio.go', ['link' => $link->uuid]),
                'sort_order' => $link->sort_order,
                'is_active' => $link->is_active,
                'click_count' => $link->click_count,
            ];
        }

        usort($links, fn ($a, $b) => $a['sort_order'] <=> $b['sort_order']);

        return $links;
    }

    /**
     * The one item pinned to the top of the page, with its live progress.
     *
     * A plain link converts worse than a thing with a picture and a number
     * moving on it, and the pot is the only product on this platform that
     * carries public progress — so it is the only candidate.
     *
     * ⚠️ Reuses PiggyPotStatusService::scopePubliclyVisible, the ONE definition
     * of a pot being open. A status filter alone is not enough: `expired` is
     * written by an hourly sweep, so a pot that closed at midnight still reads
     * `active` until it runs, and pinning that to the top of the creator's
     * most-shared page sends every visitor to "no longer available".
     *
     * ⚠️ The target is progress CONTEXT, never a fundraising goal — the pot is a
     * content product and its deliverable is what is being bought. Same rule the
     * profile follows.
     */
    public function featured(User $user): ?array
    {
        $pot = PiggyPot::query()
            ->where('user_id', $user->id)
            ->withSum(['contributions as total_raised' => fn ($q) => $q->where('status', 'paid')], 'amount')
            ->select(['id', 'uuid', 'user_id', 'title', 'cover_media', 'target_amount', 'currency', 'is_pinned', 'status', 'deadline', 'publish_at'])
            ->tap(fn ($q) => PiggyPotStatusService::scopePubliclyVisible($q))
            // Pinned wins; otherwise the newest open pot, so a creator who has
            // not pinned anything still gets a tile rather than a bare list.
            ->orderByDesc('is_pinned')
            ->orderByDesc('id')
            ->first();

        if (! $pot) {
            return null;
        }

        $target = (float) ($pot->target_amount ?: 0);
        $raised = (float) ($pot->total_raised ?: 0);

        return [
            'uuid' => $pot->uuid,
            'title' => $pot->title,
            'image' => $pot->cover_media,
            'currency' => $pot->currency,
            'raised' => $raised,
            'target' => $target,
            // NULL, never 0, when there is no target — "no goal set" and "nobody
            // has bought yet" are different things and a 0% bar states the second.
            'percent' => $target > 0 ? min(100, (int) round(($raised / $target) * 100)) : null,
            'url' => route('user.show', ['username' => $user->username, 'page' => 'piggy-pots']),
        ];
    }

    /**
     * Materialise a row for every derived internal button so the creator can
     * reorder, rename and hide them.
     *
     * 🚨 Called from the EDITOR only, never from the public page. Writing rows
     * on an anonymous GET would turn every crawler sweeping bio links into a
     * write storm across the whole creator base, on a page built to be linked
     * from every social profile the platform has.
     */
    public function ensureEditableRows(User $user): void
    {
        $availability = $this->availability($user);

        foreach (BioLinkPlatforms::DEFAULT_ORDER as $index => $targetKey) {
            $target = BioLinkPlatforms::internalTarget($targetKey);

            if ($target === null || ! ($availability[$target['requires']] ?? false)) {
                continue;
            }

            try {
                CreatorBioLink::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'kind' => BioLinkPlatforms::KIND_INTERNAL,
                        'target_type' => $targetKey,
                        'platform' => null,
                    ],
                    [
                        'sort_order' => $index,
                        'is_active' => true,
                    ]
                );
            } catch (QueryException $e) {
                // ⚠️ `firstOrCreate` is check-then-act, and two editor loads in
                // the same moment both reach the insert. The unique index on
                // `target_key` now genuinely enforces this, so the loser lands
                // here — and its row exists, written by the winner. Rethrow
                // anything that is not that.
                if (($e->errorInfo[1] ?? null) !== 1062 && $e->getCode() !== '23000') {
                    throw $e;
                }
            }
        }
    }

    /**
     * Count a view, at most once per visitor per window.
     *
     * ⚠️ The creator's own visits are not counted. A creator checks their own
     * page constantly while setting it up, and a number they inflated
     * themselves is worse than no number — they will read it as reach.
     */
    public function recordView(User $user, ?int $viewerId, string $fingerprint): void
    {
        if ($viewerId !== null && $viewerId === $user->id) {
            return;
        }

        $key = 'bio_view_'.$user->id.'_'.sha1($fingerprint);

        if (Cache::has($key)) {
            return;
        }

        Cache::put($key, true, now()->addMinutes(30));

        try {
            // Atomic: two visitors landing together must not read the same
            // value and write it back twice.
            User::whereKey($user->id)->update([
                'bio_page_views' => DB::raw('bio_page_views + 1'),
            ]);
        } catch (\Throwable $e) {
            // A vanity counter must never be why the page fails to render.
            Log::warning('Bio page view counter failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /** Count a click. Same rule: never the reason a redirect fails. */
    public function recordClick(CreatorBioLink $link): void
    {
        try {
            CreatorBioLink::whereKey($link->id)->update([
                'click_count' => DB::raw('click_count + 1'),
                'last_clicked_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Bio link click counter failed', [
                'link_id' => $link->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function forgetCaches(User $user): void
    {
        Cache::forget("bio_avail_{$user->id}");
    }
}
