<?php

namespace App\Support;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\WishItem;

/**
 * The ONE definition of a creator's sellable catalogue.
 *
 * A creator sells six different things and every one of them lived on its own screen,
 * with its own idea of what "live" means. Answering "what is on sale right now, and
 * what is stuck?" meant opening six pages and holding six vocabularies in your head:
 *
 *   shop        approved + status + is_suspended
 *   wish        is_approved + is_suspended
 *   task        is_approved + is_suspended + status (string)
 *   bill        approved + status + is_suspended
 *   membership  approved + is_suspended
 *   piggy pot   status (enum) + deadline
 *
 * Adding a seventh sellable type is a row in TYPES — not an edit in a controller, a
 * service and a React file, which is how the six above drifted apart in the first place.
 *
 * ⚠️ This registry describes columns and routes ONLY. It never resolves entitlement,
 * never touches pricing, and never exposes `reward_body` — that is the paid deliverable,
 * and a catalogue row is an overview of what a creator sells, not a delivery surface.
 */
class CatalogueRegistry
{
    /**
     * Every sellable type, in the order a creator's own screens present them.
     *
     * - `owner`        the column holding the creator's id. ⚠️ Task uses `creator_id`,
     *                  every other type uses `user_id`. Getting this wrong returns
     *                  another creator's catalogue, so it is declared, never guessed.
     * - `image_is_url` Task and Piggy Pot store a FULL CDN url; the other four store a
     *                  bare Uploadcare uuid. Same trap `ItemShareService` documents —
     *                  getting it backwards yields `ucarecdn.com/https://ucarecdn.com/…`
     *                  and a dead thumbnail on every row.
     * - `optional`     columns that exist on every deployed database but are NOT
     *                  declared by any migration, so a database built from migrations
     *                  alone does not have them (`shops.status`, `memberships.status`).
     *                  Read through CatalogueService, which checks once per request.
     * - `suspend`      ⚠️ NULL for Piggy Pot. `2026_05_08_175853_add_is_suspended_to_items_tables`
     *                  predates `piggy_pots` and was never extended to it, so selecting
     *                  `is_suspended` there is a SQL error, not a false.
     */
    public const TYPES = [
        'wish' => [
            'label' => 'Wish',
            'plural' => 'Wishes',
            'model' => WishItem::class,
            'table' => 'wish_items',
            'owner' => 'user_id',
            'title' => 'wishname',
            'image' => 'thumbnail',
            'image_is_url' => false,
            'approval' => 'is_approved',
            'suspend' => 'is_suspended',
            'active' => null,
            'extra' => ['price', 'currency', 'subscription', 'subscription_period', 'is_pin'],
            'optional' => [],
            'manage_page' => 'wishes',
            'pausable' => false,
            'funnel' => false,
        ],
        'shop' => [
            'label' => 'Shop item',
            'plural' => 'Shop',
            'model' => Shop::class,
            'table' => 'shops',
            'owner' => 'user_id',
            'title' => 'name',
            'image' => 'image',
            'image_is_url' => false,
            'approval' => 'approved',
            'suspend' => 'is_suspended',
            'active' => 'status',
            'extra' => ['price', 'currency', 'slot_limitation', 'quantity_allow', 'type'],
            // `shops.status` has no migration. Several call sites already guard it with
            // Schema::hasColumn precisely because it is absent on a fresh database.
            'optional' => ['status'],
            'manage_page' => 'shop',
            'pausable' => true,
            'funnel' => true,
        ],
        'task' => [
            'label' => 'Paid request',
            'plural' => 'Paid requests',
            'model' => Task::class,
            'table' => 'tasks',
            // ⚠️ Not user_id.
            'owner' => 'creator_id',
            'title' => 'title',
            'image' => 'media_url',
            'image_is_url' => true,
            'approval' => 'is_approved',
            'suspend' => 'is_suspended',
            'active' => null,
            'extra' => ['price', 'type', 'status', 'sla_hours'],
            'optional' => [],
            'manage_page' => 'tasks',
            'pausable' => false,
            'funnel' => true,
        ],
        'piggy_pot' => [
            'label' => 'Piggy Pot',
            'plural' => 'Piggy Pots',
            'model' => PiggyPot::class,
            'table' => 'piggy_pots',
            'owner' => 'user_id',
            'title' => 'title',
            'image' => 'cover_media',
            'image_is_url' => true,
            // A pot has no boolean approval column — `status = moderation_hold` is the
            // held state, resolved by PiggyPotStatusService.
            'approval' => null,
            // No is_suspended column on piggy_pots.
            'suspend' => null,
            'active' => null,
            'extra' => ['target_amount', 'currency', 'deadline', 'is_pinned', 'status'],
            'optional' => [],
            'manage_page' => 'piggy-pots',
            'pausable' => false,
            'funnel' => false,
        ],
        'bill' => [
            'label' => 'Subscription',
            'plural' => 'Subscriptions',
            'model' => Bills::class,
            'table' => 'bills',
            'owner' => 'user_id',
            'title' => 'name',
            'image' => 'thumbnail',
            'image_is_url' => false,
            'approval' => 'approved',
            'suspend' => 'is_suspended',
            'active' => 'status',
            'extra' => ['price', 'currency', 'period'],
            'optional' => [],
            'manage_page' => 'bills',
            'pausable' => false,
            'funnel' => false,
        ],
        'membership' => [
            'label' => 'Membership',
            'plural' => 'Memberships',
            'model' => Membership::class,
            'table' => 'memberships',
            'owner' => 'user_id',
            'title' => 'level',
            'image' => 'thumbnail',
            'image_is_url' => false,
            'approval' => 'approved',
            'suspend' => 'is_suspended',
            'active' => 'status',
            'extra' => ['price', 'currency'],
            // `memberships.status` is in the model's $fillable but no migration
            // declares it — same gap as shops.status.
            'optional' => ['status'],
            'manage_page' => 'memberships',
            'pausable' => false,
            'funnel' => false,
        ],
    ];

    /**
     * Where a completed sale is counted, per type.
     *
     * ⚠️ Wish is the odd one out and is joined, not queried directly. A wish sale writes
     * a `stripe_payment_items` row in BOTH flows — the cart checkout and
     * `StripeController::createStripePaymentForSubscription` — so that table is the one
     * row per wish sale. Counting `wish_item_subscriptions` as well would double every
     * recurring wish.
     */
    public const SALES = [
        'wish' => ['table' => 'stripe_payment_items', 'key' => 'wish_item_id', 'join' => 'stripe_payment_details', 'status' => 'payment_status', 'nullable_status' => true],
        'shop' => ['table' => 'shop_payments', 'key' => 'shop_id', 'join' => null, 'status' => 'payment_status', 'nullable_status' => true],
        'task' => ['table' => 'task_purchases', 'key' => 'task_id', 'join' => null, 'status' => 'status', 'nullable_status' => false],
        'piggy_pot' => ['table' => 'piggy_pot_contributions', 'key' => 'piggy_pot_id', 'join' => null, 'status' => 'status', 'nullable_status' => false],
        'bill' => ['table' => 'bill_payments', 'key' => 'bills_id', 'join' => null, 'status' => 'status', 'nullable_status' => false],
        'membership' => ['table' => 'membership_payments', 'key' => 'membership_id', 'join' => null, 'status' => 'status', 'nullable_status' => false],
    ];

    /**
     * Statuses that mean the money never arrived.
     *
     * Mirrors `ItemFunnelService::NOT_PAID` deliberately: a positive "paid" list would
     * have to be kept in step with every status any of six modules ever adds, and the
     * day one is missed a real sale silently stops being counted. The failure set is
     * small and stable.
     */
    public const NOT_PAID = ['initiated', 'pending', 'unpaid', 'created', 'failed', 'cancelled', 'canceled', 'refunded', 'processing'];

    /**
     * One vocabulary for six modules, ordered by how much it wants a creator's attention.
     *
     * The order IS the default sort. A flat newest-first list buries the rejected and
     * expired rows this screen exists to surface, which is exactly the problem six
     * separate module screens already had.
     */
    public const STATUSES = [
        'suspended' => ['rank' => 1, 'label' => 'Suspended', 'tone' => 'bad', 'attention' => true],
        'rejected' => ['rank' => 2, 'label' => 'Changes needed', 'tone' => 'bad', 'attention' => true],
        'expired' => ['rank' => 3, 'label' => 'Deadline passed', 'tone' => 'bad', 'attention' => true],
        'sold_out' => ['rank' => 4, 'label' => 'Sold out', 'tone' => 'warn', 'attention' => true],
        'in_review' => ['rank' => 5, 'label' => 'In review', 'tone' => 'warn', 'attention' => false],
        'paused' => ['rank' => 6, 'label' => 'Paused', 'tone' => 'warn', 'attention' => false],
        'not_featured' => ['rank' => 7, 'label' => 'Not featured', 'tone' => 'neutral', 'attention' => false],
        'completed' => ['rank' => 8, 'label' => 'Finished', 'tone' => 'neutral', 'attention' => false],
        'archived' => ['rank' => 9, 'label' => 'Archived', 'tone' => 'neutral', 'attention' => false],
        'live' => ['rank' => 10, 'label' => 'Live', 'tone' => 'good', 'attention' => false],
    ];

    /** @return array<string> */
    public static function typeKeys(): array
    {
        return array_keys(self::TYPES);
    }

    public static function supports(?string $type): bool
    {
        return $type !== null && array_key_exists($type, self::TYPES);
    }

    /** @return array<string,mixed>|null */
    public static function config(string $type): ?array
    {
        return self::TYPES[$type] ?? null;
    }

    public static function label(string $type): string
    {
        return self::TYPES[$type]['label'] ?? ucfirst(str_replace('_', ' ', $type));
    }

    /**
     * A status key that is not in STATUSES still renders, as itself, in a neutral tone.
     *
     * A screen that throws because a module grew a state nobody told it about is worse
     * than one that shows a word it does not recognise.
     */
    public static function statusMeta(string $status): array
    {
        return self::STATUSES[$status] ?? [
            'rank' => 99,
            'label' => ucfirst(str_replace('_', ' ', $status)),
            'tone' => 'neutral',
            'attention' => false,
        ];
    }

    /**
     * Columns to SELECT for a type.
     *
     * Explicit, never `select(*)`: the six models between them append `perma_link`,
     * `real_category`, `total_sold`, `content_file_url` and `reward_url`, several of
     * which issue a query PER ROW. That is the documented 206-query trap, and a
     * catalogue page is exactly where it would land hardest.
     *
     * @param  array<string>  $present  optional columns confirmed to exist
     * @return array<string>
     */
    public static function columns(string $type, array $present = []): array
    {
        $config = self::TYPES[$type] ?? null;

        if (! $config) {
            return [];
        }

        $columns = [
            'id',
            'uuid',
            $config['owner'],
            $config['title'],
            $config['image'],
            'moderation_reason',
            'moderation_asset',
            'reward_title',
            'created_at',
        ];

        if ($config['approval']) {
            $columns[] = $config['approval'];
        }

        if ($config['suspend']) {
            $columns[] = $config['suspend'];
        }

        // ⚠️ The active/paused column is NOT part of `extra` and has to be added here.
        // Left out, a paused shop item is selected without its own `status`, reads as
        // null, and is reported to the creator as live — the state they explicitly
        // turned off.
        if ($config['active'] && (! in_array($config['active'], $config['optional'], true) || in_array($config['active'], $present, true))) {
            $columns[] = $config['active'];
        }

        foreach ($config['extra'] as $column) {
            // An optional column is only selected once its existence is confirmed —
            // selecting an absent one is a SQL error that takes the whole page down.
            if (in_array($column, $config['optional'], true) && ! in_array($column, $present, true)) {
                continue;
            }

            $columns[] = $column;
        }

        return array_values(array_unique($columns));
    }
}
