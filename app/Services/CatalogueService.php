<?php

namespace App\Services;

use App\Models\User;
use App\Support\CatalogueRegistry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

/**
 * A creator's whole catalogue, in one list.
 *
 * The six sellable types each had their own screen, so "what am I selling, and what is
 * stuck?" could only be answered by opening six pages and comparing by eye. The two
 * findings that matter most are invisible that way: a listing rejected in review three
 * weeks ago, and a Piggy Pot whose deadline passed and which is therefore no longer on
 * the creator's own profile.
 *
 * Everything here is batched. One query per type for the listings, one per type for the
 * lifetime sale counts, and the (already batched) funnel for the two types that have
 * view data. Never one query per row — six models between them append `perma_link`,
 * `real_category`, `total_sold` and `content_file_url`, several of which query per row,
 * which is why nothing in this file returns a model to the caller.
 *
 * ⚠️ Owner-only, always. Every query is constrained on the type's own owner column, and
 * `reward_body` is never selected — it is the paid deliverable, not catalogue metadata.
 */
class CatalogueService
{
    /**
     * Rows fetched per type before merging.
     *
     * The merged list cannot be paginated in SQL (it spans six tables), so it is sliced
     * in PHP — the same approach the admin Content Review console takes. Without a cap a
     * creator with a large catalogue would pull every listing of every type on every
     * page load.
     */
    public const PER_TYPE_LIMIT = 200;

    /** Listings shown per page. */
    public const PER_PAGE = 24;

    /** Funnel reporting window, in days. Matches ItemFunnelService's own default. */
    public const FUNNEL_DAYS = ItemFunnelService::WINDOW_DAYS;

    /**
     * Optional-column existence, resolved once per request.
     *
     * `shops.status` and `memberships.status` exist on every deployed database and are
     * declared by no migration, so a database built from migrations alone does not have
     * them. Checking per row would be a query per row; checking per request is two.
     *
     * @var array<string,bool>
     */
    private array $columnCache = [];

    public function __construct(private ItemFunnelService $funnels) {}

    /**
     * The catalogue.
     *
     * @param  array{type?:string|null,status?:string|null,q?:string|null,sort?:string|null,page?:int}  $filters
     * @return array<string,mixed>
     */
    public function for(User $creator, array $filters = []): array
    {
        $type = CatalogueRegistry::supports($filters['type'] ?? null) ? $filters['type'] : null;
        $status = $filters['status'] ?? null;
        $search = trim((string) ($filters['q'] ?? ''));
        $sort = in_array($filters['sort'] ?? '', ['attention', 'newest', 'sales'], true) ? $filters['sort'] : 'attention';
        $page = max(1, (int) ($filters['page'] ?? 1));

        // 🚨 EVERY type is fetched, even when one is selected. The chips are the
        // screen's navigation, and a count that only becomes true once you press it is
        // useless for deciding what to press — filtering the FETCH made every unselected
        // chip read 0, so the catalogue looked empty apart from the tab already open.
        //
        // It costs nothing extra in the common case: the unfiltered view already reads
        // all six tables, and each is one capped query.
        $rows = [];
        $truncated = false;

        foreach (CatalogueRegistry::typeKeys() as $key) {
            try {
                [$typeRows, $capped] = $this->rowsForType($creator, $key, $search);
            } catch (Throwable $e) {
                // ⚠️ One type must never take the whole catalogue down. Several columns
                // these six tables carry are declared by no migration (memberships.level
                // and .status, shops.status), so a database built from migrations alone
                // is genuinely missing them — and the creator's other five types are
                // still worth showing.
                Log::error('Catalogue: could not read '.$key, ['error' => $e->getMessage()]);

                continue;
            }

            $truncated = $truncated || $capped;
            $rows = array_merge($rows, $typeRows);
        }

        // Counts describe the whole catalogue (within the search, which is a narrowing
        // of what the catalogue IS rather than a view of it). When a type hit its cap
        // the page says so — a headline number that does not match the list behind it
        // is worse than no number.
        $counts = $this->counts($rows);

        if ($type !== null) {
            $rows = array_values(array_filter($rows, fn (array $row) => $row['type'] === $type));
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $rows = array_values(array_filter(
                $rows,
                $status === 'attention'
                    ? fn (array $row) => $row['needs_attention']
                    : fn (array $row) => $row['status'] === $status
            ));
        }

        $rows = $this->sort($rows, $sort);

        $paginator = new LengthAwarePaginator(
            array_slice($rows, ($page - 1) * self::PER_PAGE, self::PER_PAGE),
            count($rows),
            self::PER_PAGE,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return [
            'listings' => [
                'data' => array_values($paginator->items()),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
            'counts' => $counts,
            'filters' => [
                'type' => $type,
                'status' => $status,
                'q' => $search,
                'sort' => $sort,
            ],
            'types' => $this->typeMeta(),
            'statuses' => CatalogueRegistry::STATUSES,
            'window_days' => self::FUNNEL_DAYS,
            'counts_are_floor' => $truncated,
            'per_type_limit' => self::PER_TYPE_LIMIT,
        ];
    }

    /**
     * One type's rows.
     *
     * @return array{0:array<int,array<string,mixed>>,1:bool} rows, and whether the cap was hit
     */
    private function rowsForType(User $creator, string $type, string $search): array
    {
        $config = CatalogueRegistry::config($type);

        if (! $config) {
            return [[], false];
        }

        $present = $this->presentOptionalColumns($config);

        /** @var Model $model */
        $model = $config['model'];

        // ⚠️ withScheduled(): this screen is the creator's own catalogue, and a listing
        // they scheduled is exactly the one they want to see and edit. The global scope
        // is for the public; it must not hide a creator's work from themselves.
        $query = $model::withScheduled()
            ->where($config['owner'], $creator->id)
            ->select(CatalogueRegistry::columns($type, $present));

        if ($search !== '') {
            // Only the public title is searched. A creator looking for "hoodie" means
            // the listing called hoodie; matching the reward or description as well
            // returns rows whose visible title has nothing to do with what was typed.
            $query->where($config['title'], 'like', '%'.str_replace('%', '\%', $search).'%');
        }

        $items = $query->latest('id')->limit(self::PER_TYPE_LIMIT + 1)->get();

        $capped = $items->count() > self::PER_TYPE_LIMIT;
        $items = $items->take(self::PER_TYPE_LIMIT);

        if ($items->isEmpty()) {
            return [[], false];
        }

        $ids = $items->pluck('id')->map(fn ($id) => (int) $id)->all();

        $sales = $this->salesFor($type, $ids);
        $funnels = $config['funnel'] ? $this->funnels->forItems($type, $ids, self::FUNNEL_DAYS) : [];

        // Only resolved when there are pots to describe — the featured slot is one
        // query, and it says nothing about any other type.
        $featuredPotId = $type === 'piggy_pot' ? PiggyPotStatusService::featuredPotId($creator->id) : null;

        $rows = [];

        foreach ($items as $item) {
            $rows[] = $this->row($item, $type, $config, $creator, [
                'sales' => (int) ($sales[(int) $item->id] ?? 0),
                'funnel' => $funnels[(int) $item->id] ?? null,
                'featured_pot_id' => $featuredPotId,
                'present' => $present,
            ]);
        }

        return [$rows, $capped];
    }

    /**
     * One catalogue row.
     *
     * A plain array, never a model: the six models append accessors that query per row,
     * and several hide columns this screen legitimately shows. Building the payload
     * explicitly is also what guarantees `reward_body` cannot reach the browser.
     *
     * @param  array<string,mixed>  $context
     * @return array<string,mixed>
     */
    private function row(Model $item, string $type, array $config, User $creator, array $context): array
    {
        $status = $this->status($item, $type, $config, $context);
        $meta = CatalogueRegistry::statusMeta($status);

        $title = trim((string) ($item->{$config['title']} ?? ''));
        $title = $title !== '' ? $title : 'Untitled';
        $publicUrl = $this->publicUrl($type, $item, $creator, $status);

        return [
            'key' => $type.':'.$item->id,
            'id' => (int) $item->id,
            'uuid' => (string) ($item->uuid ?? ''),
            'type' => $type,
            'type_label' => $config['label'],
            'title' => $title,
            'thumbnail' => $this->thumbnail($item->{$config['image']} ?? null, (bool) $config['image_is_url']),
            'price' => $this->price($item, $type),
            'currency' => strtoupper((string) ($item->currency ?? $creator->default_currency ?? 'GBP')),
            'status' => $status,
            'status_label' => $meta['label'],
            'status_tone' => $meta['tone'],
            'needs_attention' => (bool) $meta['attention'],
            // The only thing that tells a creator WHY an item is stuck. Each module
            // already shows it on its own card; a catalogue that omitted it would send
            // them back to the six screens this page replaces.
            'moderation_reason' => $item->moderation_reason ?: null,
            'moderation_asset' => $item->moderation_asset ?: null,
            'reward_title' => $item->reward_title ?: null,
            'sales' => (int) $context['sales'],
            'funnel' => $context['funnel'],
            'stock' => $this->stock($item, $type),
            'manage_url' => $this->manageUrl($type, $item, $creator),
            'public_url' => $publicUrl,
            // Shape ShareButton already takes. The link carries `creator_share` so the
            // traffic a creator sends is attributable instead of landing in the funnels
            // as `direct` — the whole reason that utm source exists.
            'share' => $publicUrl === null ? null : [
                'url' => $publicUrl.(str_contains($publicUrl, '?') ? '&' : '?').'utm_source='.ItemShareService::SHARE_SOURCE,
                'title' => $title,
                'caption' => $title,
            ],
            'pausable' => $this->pausable($config, $context['present']),
            'publish_at' => $this->has($item, 'publish_at') ? optional($item->publish_at)->toIso8601String() : null,
            'created_at' => optional($item->created_at)->toIso8601String(),
        ];
    }

    /**
     * One vocabulary from six different sets of columns.
     *
     * ⚠️ Piggy Pot delegates to PiggyPotStatusService — it is the ONE definition, and a
     * pot's real state is not readable from `status` alone (the hourly expiry sweep
     * lags, so a pot that closed at midnight still reads `active` until it runs).
     *
     * @param  array<string,mixed>  $context
     */
    private function status(Model $item, string $type, array $config, array $context): string
    {
        if ($config['suspend'] && (int) ($item->{$config['suspend']} ?? 0) === 1) {
            return 'suspended';
        }

        if ($type === 'piggy_pot') {
            return match (PiggyPotStatusService::visibility($item, $context['featured_pot_id'])['code']) {
                'moderation_hold' => $item->moderation_reason ? 'rejected' : 'in_review',
                'deadline_passed' => 'expired',
                'completed' => 'completed',
                'archived' => 'archived',
                'not_featured' => 'not_featured',
                default => 'live',
            };
        }

        if ($config['approval'] && (int) ($item->{$config['approval']} ?? 0) !== 1) {
            // "Waiting on us" and "waiting on you" are opposite instructions. A held
            // item with a reason has been looked at and refused; one without has not
            // been reached yet, and telling that creator to fix something is wrong.
            return $item->moderation_reason ? 'rejected' : 'in_review';
        }

        if ($type === 'task' && in_array((string) ($item->status ?? ''), ['archived', 'draft'], true)) {
            return (string) $item->status === 'draft' ? 'in_review' : 'archived';
        }

        // Only read when the column is actually present — see presentOptionalColumns().
        if ($config['active'] && $this->has($item, $config['active']) && (int) $item->{$config['active']} === 0) {
            return 'paused';
        }

        if ($type === 'shop' && $this->soldOut($item)) {
            return 'sold_out';
        }

        // ⚠️ Checked LAST, after every reason the listing might not be sellable at all.
        // A scheduled listing that is also rejected is a rejected listing — telling its
        // creator it goes live on Friday would be false.
        if ($this->has($item, 'publish_at') && $item->publish_at !== null && $item->publish_at->isFuture()) {
            return 'scheduled';
        }

        return 'live';
    }

    /**
     * Lifetime completed sales per listing — one query per type.
     *
     * @param  array<int>  $ids
     * @return array<int,int>
     */
    private function salesFor(string $type, array $ids): array
    {
        $config = CatalogueRegistry::SALES[$type] ?? null;

        if (! $config || empty($ids)) {
            return [];
        }

        $table = $config['table'];
        $key = $config['key'];

        $query = DB::table($table)->whereIn($table.'.'.$key, $ids);

        if ($config['join']) {
            // A wish sale's status lives on the parent payment row, not on the line item.
            $query->join($config['join'], $config['join'].'.id', '=', $table.'.stripe_payment_detail_id')
                ->whereNotNull($config['join'].'.'.$config['status'])
                ->whereNotIn($config['join'].'.'.$config['status'], CatalogueRegistry::NOT_PAID);
        } else {
            if ($config['nullable_status']) {
                // A NULL status is a checkout that was started, not one that completed.
                $query->whereNotNull($table.'.'.$config['status']);
            }

            $query->whereNotIn($table.'.'.$config['status'], CatalogueRegistry::NOT_PAID);
        }

        if (Schema::hasColumn($table, 'deleted_at')) {
            $query->whereNull($table.'.deleted_at');
        }

        return $query->select($table.'.'.$key.' as item_id', DB::raw('COUNT(*) as total'))
            ->groupBy($table.'.'.$key)
            ->pluck('total', 'item_id')
            ->mapWithKeys(fn ($total, $id) => [(int) $id => (int) $total])
            ->all();
    }

    /**
     * Which optional columns this database actually has.
     *
     * @param  array<string,mixed>  $config
     * @return array<string>
     */
    private function presentOptionalColumns(array $config): array
    {
        $present = [];

        foreach ($config['optional'] as $column) {
            $cacheKey = $config['table'].'.'.$column;

            if (! array_key_exists($cacheKey, $this->columnCache)) {
                $this->columnCache[$cacheKey] = Schema::hasColumn($config['table'], $column);
            }

            if ($this->columnCache[$cacheKey]) {
                $present[] = $column;
            }
        }

        return $present;
    }

    /**
     * Pause is offered only where an endpoint exists to honour it.
     *
     * Shop is the only type with one (`deactivate-shop`), and even there only when the
     * undeclared `shops.status` column is present. A button that cannot do anything is
     * worse than no button.
     *
     * @param  array<string,mixed>  $config
     * @param  array<string>  $present
     */
    private function pausable(array $config, array $present): bool
    {
        if (! $config['pausable']) {
            return false;
        }

        return $config['active'] === null || ! in_array($config['active'], $config['optional'], true)
            || in_array($config['active'], $present, true);
    }

    /** Remaining stock, when the listing tracks it at all. */
    private function stock(Model $item, string $type): ?int
    {
        if ($type !== 'shop' || ! $this->has($item, 'slot_limitation')) {
            return null;
        }

        $raw = $item->slot_limitation;

        // NULL / '' means stock is not tracked, which is not the same as zero left.
        return ($raw === null || $raw === '') ? null : max(0, (int) $raw);
    }

    private function soldOut(Model $item): bool
    {
        $stock = $this->stock($item, 'shop');

        return $stock !== null && $stock <= 0;
    }

    /** A pot has no fixed price — it takes contributions towards a target. */
    private function price(Model $item, string $type): ?float
    {
        if ($type === 'piggy_pot') {
            return $this->has($item, 'target_amount') && $item->target_amount !== null
                ? (float) $item->target_amount
                : null;
        }

        return $this->has($item, 'price') && $item->price !== null ? (float) $item->price : null;
    }

    /**
     * A square thumbnail, whatever shape the column holds.
     *
     * ⚠️ The uuid is extracted first in every case. Task and Piggy Pot store a full CDN
     * url, Shop stores a bare uuid — and a Shop image can also arrive with operations
     * already appended, so concatenating produced a chained crop and a dead image. Same
     * rule as ItemShareService.
     *
     * ⚠️ `-/quality/smart/`, never `-/quality/85/` — the numeric form is not a valid
     * Uploadcare operation and the CDN answers 400.
     */
    private function thumbnail(?string $raw, bool $isUrl): ?string
    {
        $raw = trim((string) $raw);

        if ($raw === '') {
            return null;
        }

        if (preg_match('/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i', $raw, $match)) {
            return "https://ucarecdn.com/{$match[1]}/-/scale_crop/240x240/center/-/format/jpeg/-/quality/smart/";
        }

        // A non-Uploadcare absolute url is used as-is; anything else is unusable.
        return $isUrl && str_starts_with($raw, 'http') ? $raw : null;
    }

    /**
     * Where the creator manages this listing.
     *
     * Only Paid Requests have a dedicated edit page. The other five are edited from
     * their own module screen, so that is where a row sends you — the catalogue is an
     * overview and a jump-off point, deliberately not a seventh place to edit from.
     */
    private function manageUrl(string $type, Model $item, User $creator): string
    {
        return match ($type) {
            'task' => route('task.edit', ['uuid' => $item->uuid]),
            'shop' => route('shop-list', ['username' => $creator->username]),
            'piggy_pot' => route('piggy-pots.index'),
            default => route('user.show', ['username' => $creator->username, 'page' => CatalogueRegistry::config($type)['manage_page']]),
        };
    }

    /**
     * The public page, when the listing has one a supporter can actually reach.
     *
     * Null for anything not live — sending a creator to their own 404 to "check how it
     * looks" is the opposite of useful.
     */
    private function publicUrl(string $type, Model $item, User $creator, string $status): ?string
    {
        if ($status !== 'live') {
            return null;
        }

        return match ($type) {
            'shop' => route('single-shop-list', [
                'slug' => Str::slug((string) $item->name) ?: 'item',
                'uuid' => $item->uuid,
            ]),
            'task' => route('task.show', ['uuid' => $item->uuid]),
            default => route('user.show', [
                'username' => $creator->username,
                'page' => CatalogueRegistry::config($type)['manage_page'],
            ]),
        };
    }

    /**
     * Per-type and per-status counts.
     *
     * ⚠️ The type chip set is FIXED and a type is never hidden at zero. These chips
     * stand in for the six screens they replace, and a chip that vanishes when empty
     * reads as the feature being broken rather than as nothing waiting. A zero is
     * information.
     *
     * @param  array<int,array<string,mixed>>  $rows
     * @return array<string,mixed>
     */
    private function counts(array $rows): array
    {
        $byType = array_fill_keys(CatalogueRegistry::typeKeys(), 0);
        $byStatus = array_fill_keys(array_keys(CatalogueRegistry::STATUSES), 0);
        $attention = 0;

        foreach ($rows as $row) {
            $byType[$row['type']] = ($byType[$row['type']] ?? 0) + 1;
            $byStatus[$row['status']] = ($byStatus[$row['status']] ?? 0) + 1;

            if ($row['needs_attention']) {
                $attention++;
            }
        }

        return [
            'all' => count($rows),
            'attention' => $attention,
            'by_type' => $byType,
            'by_status' => $byStatus,
        ];
    }

    /**
     * @param  array<int,array<string,mixed>>  $rows
     * @return array<int,array<string,mixed>>
     */
    private function sort(array $rows, string $sort): array
    {
        usort($rows, function (array $a, array $b) use ($sort) {
            if ($sort === 'sales') {
                return [$b['sales'], $b['created_at']] <=> [$a['sales'], $a['created_at']];
            }

            if ($sort === 'newest') {
                return $b['created_at'] <=> $a['created_at'];
            }

            // Default. The rank IS the point of this screen: a rejected listing three
            // weeks old must outrank a healthy one published this morning.
            $rankA = CatalogueRegistry::statusMeta($a['status'])['rank'];
            $rankB = CatalogueRegistry::statusMeta($b['status'])['rank'];

            return [$rankA, $b['created_at']] <=> [$rankB, $a['created_at']];
        });

        return $rows;
    }

    /** @return array<int,array<string,string>> */
    private function typeMeta(): array
    {
        $out = [];

        foreach (CatalogueRegistry::TYPES as $key => $config) {
            $out[] = ['key' => $key, 'label' => $config['label'], 'plural' => $config['plural']];
        }

        return $out;
    }

    /**
     * Was this column actually selected?
     *
     * A column that was not selected is absent from the attribute bag, and reading it
     * returns null — indistinguishable from a real null. Checking the bag keeps
     * "not asked for" and "genuinely empty" apart.
     */
    private function has(Model $item, string $column): bool
    {
        return array_key_exists($column, $item->getAttributes());
    }
}
