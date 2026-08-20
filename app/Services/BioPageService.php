<?php

namespace App\Services;

use App\Models\Bills;
use App\Models\CreatorBioItem;
use App\Models\CreatorBioLink;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Support\BioLinkPlatforms;
use App\Support\BioSellableItems;
use App\Support\CatalogueRegistry;
use App\Support\MediaUrl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

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
     * The listings the creator has chosen to SELL from this page (B stream).
     *
     * 🚨 THE CARD IS RENDERED FROM THE LIVE LISTING, EVERY TIME. `creator_bio_items`
     * stores a type and an id and nothing else, so a price the creator edits, a pot
     * that closes, a listing an admin pulls for moderation and one that sells out all
     * change this page with no editing and no cron. A card that advertised a stored
     * price would eventually disagree with the checkout behind it, on the single page
     * the creator shares everywhere.
     *
     * 🚨 THE LIVE FILTER IS THE SAME ONE THE PROFILE USES — approval columns clear,
     * not suspended, pots publicly visible. This is what makes moderation apply here:
     * an item held by `CheckMediaModeration`, or refused in review, is simply not
     * selected by these queries, so it cannot be advertised from the creator's most
     * shared link. A looser filter would advertise something the visitor then cannot
     * buy, which is worse than not showing it.
     *
     * ⚠️ NOTHING HERE COMPUTES A SUPPORTER PRICE. The figure on a card is the LISTED
     * price the creator set, exactly as their own module card shows it. The grossed-up
     * amount a supporter actually pays is produced by
     * `Helpers::calculateStripeDirectChargeFlow` at the checkout the card links to,
     * per fee profile — and it must be produced there, once, or the page and the
     * checkout can print different numbers.
     *
     * ⚠️ One query per SELECTED type, never one per row. Six models between them append
     * `perma_link`, `total_sold`, `real_category` and `content_file_url`, several of
     * which query per row — the documented 206-query trap, and this is a public page
     * built to open instantly from an in-app browser. Models are never serialised out
     * of here for the same reason.
     *
     * @param  bool  $isOwner  Owners also see what they have hidden, so the editor and
     *                         the live page agree about what is on it.
     * @return array<int,array<string,mixed>>
     */
    public function items(User $user, bool $isOwner = false): array
    {
        $compute = fn () => $this->buildItems($user, $isOwner);

        // Same rule as availability(): a signed-in viewer skips the cache so an
        // owner sees an edit immediately, and the owner payload differs anyway.
        if (auth()->check()) {
            return $compute();
        }

        /*
         * 🚨 `$isOwner` IS PART OF THE KEY. The payload it produces is different
         * — an owner sees their inactive selections, a visitor must not — and
         * caching two shapes under one key means whichever call lands first wins
         * for everyone until the TTL expires.
         *
         * The `auth()->check()` branch above hides this in the live flow (the
         * owner is always signed in, so they never reach the cache), which is
         * exactly what makes it dangerous: the fault only appears the day
         * something calls this for an owner without a session — a queued job, an
         * artisan command, an SSR render — and then it serves the wrong payload
         * silently. Caught by `BioDirectSalesTest` on 20 Aug 2026.
         */
        return Cache::remember(
            "bio_items_{$user->id}_".($isOwner ? 'owner' : 'public'),
            self::AVAILABILITY_TTL,
            $compute
        );
    }

    /** @return array<int,array<string,mixed>> */
    private function buildItems(User $user, bool $isOwner): array
    {
        $selections = CreatorBioItem::where('user_id', $user->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        if ($selections->isEmpty()) {
            return [];
        }

        if (! $isOwner) {
            $selections = $selections->where('is_active', true);
        }

        $cards = [];

        foreach ($selections->groupBy('item_type') as $type => $rows) {
            if (! BioSellableItems::supports($type)) {
                // A type withdrawn from the registry leaves rows behind. They are
                // kept — removing a creator's selection because we changed a list is
                // not ours to do silently — but there is no card to draw.
                continue;
            }

            $listings = $this->liveListings($user, (string) $type, $rows->pluck('item_id')->all());

            foreach ($rows as $row) {
                $listing = $listings[(int) $row->item_id] ?? null;

                // Deleted, unapproved, suspended, closed or sold out: the card is
                // simply absent. It is NOT deleted from the table — a pot held for
                // review comes back on its own when an admin clears it.
                if ($listing === null) {
                    continue;
                }

                $card = $this->card($user, (string) $type, $row, $listing, $isOwner);

                if ($card !== null) {
                    $cards[] = $card;
                }
            }
        }

        usort($cards, fn ($a, $b) => $a['sort_order'] <=> $b['sort_order']);

        return $cards;
    }

    /**
     * The live listings of one type, keyed by id.
     *
     * ⚠️ Columns are named explicitly. `select(*)` on these six tables pulls
     * `reward_body` and `content_file` — the PAID deliverable — onto a public page,
     * which is the one thing a catalogue-shaped payload must never carry.
     *
     * @param  array<int>  $ids
     * @return array<int,Model>
     */
    private function liveListings(User $user, string $type, array $ids): array
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));

        if ($ids === []) {
            return [];
        }

        try {
            $query = match ($type) {
                'wish' => WishItem::query()
                    ->select(['id', 'uuid', 'user_id', 'wishname', 'thumbnail', 'price', 'currency', 'subscription', 'subscription_period'])
                    ->where('user_id', $user->id)
                    ->where('is_approved', 1)
                    ->where('is_suspended', 0),

                'shop' => Shop::query()
                    ->select(array_merge(
                        ['id', 'uuid', 'user_id', 'name', 'image', 'price', 'currency'],
                        // `shops.status` is declared by no migration; several call
                        // sites already guard on it for exactly this reason.
                        Schema::hasColumn('shops', 'status') ? ['status'] : []
                    ))
                    ->where('user_id', $user->id)
                    ->where('approved', 1)
                    ->where('is_suspended', 0)
                    // ⚠️ `buyShopItem` refuses anything without `status = 1`, so a
                    // card for one would be a button that always fails.
                    ->when(Schema::hasColumn('shops', 'status'), fn ($q) => $q->where('status', 1)),

                'task' => Task::query()
                    ->select(['id', 'uuid', 'creator_id', 'title', 'media_url', 'price', 'currency', 'status'])
                    ->where('creator_id', $user->id)
                    ->where('is_approved', 1)
                    ->where('is_suspended', 0)
                    ->whereNotIn('status', ['archived', 'draft']),

                'piggy_pot' => PiggyPot::query()
                    ->select(['id', 'uuid', 'user_id', 'title', 'cover_media', 'target_amount', 'currency', 'status', 'deadline', 'publish_at'])
                    ->withSum(['contributions as total_raised' => fn ($q) => $q->where('status', 'paid')], 'amount')
                    ->where('user_id', $user->id)
                    ->tap(fn ($q) => PiggyPotStatusService::scopePubliclyVisible($q)),

                'bill' => Bills::query()
                    ->select(['id', 'uuid', 'user_id', 'name', 'thumbnail', 'price', 'currency', 'period', 'status'])
                    ->where('user_id', $user->id)
                    ->where('approved', 1)
                    ->where('is_suspended', 0)
                    // `buyBill` refuses a bill whose status is falsy.
                    ->where('status', 1),

                'membership' => Membership::query()
                    ->select(['id', 'uuid', 'user_id', 'level', 'thumbnail', 'price', 'currency'])
                    ->where('user_id', $user->id)
                    ->where('approved', 1)
                    ->where('is_suspended', 0),

                default => null,
            };

            if ($query === null) {
                return [];
            }

            return $query->whereIn('id', $ids)->get()->keyBy(fn ($row) => (int) $row->id)->all();
        } catch (\Throwable $e) {
            // ⚠️ One type must never take the bio page down. Several columns these
            // tables carry are declared by no migration, so a database built from
            // migrations alone is genuinely missing them — and the creator's other
            // cards are still worth showing.
            Log::warning('Bio page: could not read '.$type.' selections', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * One card.
     *
     * ⚠️ A plain array, explicitly built. Returning a model here would serialise
     * whatever its `$appends` decide to add, which on these six models includes
     * accessors that query per row and, on two of them, the paid reward file.
     *
     * @return array<string,mixed>|null
     */
    private function card(User $user, string $type, CreatorBioItem $row, Model $listing, bool $isOwner = false): ?array
    {
        $url = BioSellableItems::checkoutUrl($type, $listing, $user);

        if ($url === null) {
            return null;
        }

        $config = CatalogueRegistry::config($type) ?? [];
        $title = trim((string) ($listing->{$config['title'] ?? 'title'} ?? ''));

        $card = [
            'uuid' => $row->uuid,
            'type' => $type,
            'type_label' => CatalogueRegistry::label($type),
            'title' => $title !== '' ? $title : 'Untitled',
            'image' => $this->cardImage($listing, $config),
            'currency' => strtoupper((string) ($listing->currency ?: $user->default_currency ?: 'GBP')),
            'cta' => BioSellableItems::cta($type),
            // A LABEL, never the gate. Each buy path refuses a guest itself; this
            // only stops a supporter tapping into a login screen unprepared.
            'requires_account' => BioSellableItems::requiresAccount($type),
            // 🚨 The counting redirect, never the checkout URL itself — it is what
            // records the click and stamps `bio-link` on the visitor before the
            // checkout reads it. See BioPageController::buy().
            'url' => route('bio.buy', ['item' => $row->uuid]),
            'sort_order' => (int) $row->sort_order,
            'is_active' => (bool) $row->is_active,
            // ⚠️ OWNER ONLY. The editor needs to know which catalogue entries are
            // already on the page, and that key carries the listing's internal id.
            // A public payload has no use for it, so it is not sent to one.
            'catalogue_key' => $isOwner ? $row->catalogueKey() : null,
            'clicks' => $isOwner ? (int) $row->click_count : null,
        ];

        if ($type === 'piggy_pot') {
            $target = (float) ($listing->target_amount ?: 0);
            $raised = (float) ($listing->total_raised ?: 0);

            // ⚠️ A pot has no price — any amount within the platform limits buys it,
            // and the target is progress CONTEXT, never a fundraising goal. NULL, not
            // 0, when no target is set: "no goal" and "nobody has bought yet" are
            // different things and a 0% bar states the second.
            $card['price'] = null;
            $card['price_note'] = null;
            $card['percent'] = $target > 0 ? min(100, (int) round(($raised / $target) * 100)) : null;

            return $card;
        }

        $card['price'] = $listing->price !== null ? (float) $listing->price : null;
        $card['percent'] = null;
        $card['price_note'] = match ($type) {
            'bill' => $this->periodNote((string) ($listing->period ?? '')),
            'membership' => 'a month',
            'wish' => (bool) ($listing->subscription ?? false) && filled($listing->subscription_period ?? null)
                ? $this->periodNote((string) $listing->subscription_period)
                : null,
            default => null,
        };

        return $card;
    }

    private function periodNote(string $period): ?string
    {
        return match (strtolower($period)) {
            'daily' => 'a day',
            'weekly' => 'a week',
            'monthly' => 'a month',
            'yearly', 'annually' => 'a year',
            default => null,
        };
    }

    /**
     * ⚠️ The uuid is extracted whatever the column holds. Task and Piggy Pot store a
     * full CDN url and the other four store a bare uuid — which can itself already
     * carry operations, so concatenating produced a chained crop and a dead image.
     * Same rule `ItemShareService` and `CatalogueService` both document.
     *
     * ⚠️ Capped through `MediaUrl`. A browser holds a decoded bitmap, not the file,
     * and this page draws a grid of them on a phone.
     *
     * @param  array<string,mixed>  $config
     */
    private function cardImage(Model $listing, array $config): ?string
    {
        $raw = trim((string) ($listing->{$config['image'] ?? 'image'} ?? ''));

        if ($raw !== '' && preg_match('/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i', $raw, $match)) {
            return MediaUrl::thumb($match[1], 640);
        }

        // A non-Uploadcare absolute url is used as-is; anything else is unusable and
        // the card draws its own placeholder rather than a broken image.
        if ($raw !== '' && ($config['image_is_url'] ?? false) && str_starts_with($raw, 'http')) {
            return $raw;
        }

        return null;
    }

    /**
     * The listing a bio-page card points at, re-checked at click time.
     *
     * 🚨 THE DESTINATION IS REBUILT FROM THE ROW, NEVER TAKEN FROM THE REQUEST —
     * the same rule `/bio/go/{uuid}` follows. The only input is a uuid; the checkout
     * URL comes from `BioSellableItems`, which knows only about routes that already
     * exist.
     *
     * ⚠️ It re-runs the LIVE filter rather than trusting the render. A card is drawn
     * from a payload that may be up to a minute stale, so a pot that closed or an
     * item pulled for moderation in that window must not still be sellable through
     * the redirect.
     */
    public function checkoutUrlFor(CreatorBioItem $row, User $creator): ?string
    {
        if (! BioSellableItems::supports($row->item_type)) {
            return null;
        }

        $listing = $this->liveListings($creator, (string) $row->item_type, [(int) $row->item_id])[(int) $row->item_id] ?? null;

        return $listing === null
            ? null
            : BioSellableItems::checkoutUrl((string) $row->item_type, $listing, $creator);
    }

    /** Count a card click. Same rule as a link: never the reason a redirect fails. */
    public function recordItemClick(CreatorBioItem $row): void
    {
        try {
            CreatorBioItem::whereKey($row->id)->update([
                'click_count' => DB::raw('click_count + 1'),
                'last_clicked_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Bio item click counter failed', [
                'item_id' => $row->id,
                'error' => $e->getMessage(),
            ]);
        }
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

        // ⚠️ BOTH VARIANTS. `items()` keys on the owner/public distinction
        // because the two payloads differ; forgetting only the bare key — as
        // this did when the suffix was added — would leave a stale public card
        // list serving every visitor until the TTL expired, which is precisely
        // the moment a creator has just changed what their page sells.
        Cache::forget("bio_items_{$user->id}_public");
        Cache::forget("bio_items_{$user->id}_owner");
    }
}
