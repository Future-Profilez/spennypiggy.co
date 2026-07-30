<?php

namespace App\Services;

use App\Mail\StockBackInStock;
use App\Models\Shop;
use App\Models\StockWaitlist;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Sold-out waitlist.
 *
 * A limited-stock listing that sells out goes dead — "Sold out", button disabled, and
 * every later visitor simply leaves. The creator never learns the demand existed, so
 * they never restock. This captures that demand and closes the loop in both directions:
 * the buyer gets told when it returns, and the creator sees how many are waiting.
 *
 * ⚠️ **Restock is detected by SWEEPING, not by a model event.** Both paths that put stock
 * back bypass Eloquent entirely — the refund handler uses `Shop::where(...)->increment()`
 * and the creator edit uses `Shop::where(...)->update()`, neither of which fires `updated`.
 * A third path has no PHP at all: the admin app shares this database and can change stock
 * with none of this code running. An observer would therefore have sat there doing nothing.
 * `checkRestock()` is called from the two known sites for immediacy; the scheduled sweep
 * is what actually guarantees delivery.
 */
class StockWaitlistService
{
    /** Most people notified per restock, mirroring CreatorEventNotifier's fan-out cap. */
    public const MAX_PER_RESTOCK = 5000;

    /**
     * Waiting counts at which the creator is told about demand.
     *
     * NOT every join. A listing that attracts fifty people would otherwise send the
     * creator fifty pushes, and a creator who mutes this feature after the third one
     * never sees the fiftieth — which is the one that was worth acting on. The first
     * joiner is the signal that demand exists; the rest are the signal that it is
     * growing, and that only needs saying occasionally.
     */
    public const DEMAND_MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500];

    /**
     * Add someone to an item's waitlist.
     *
     * @return array{ok: bool, message: string}
     */
    public function join(Shop $shop, ?User $user, ?string $email = null): array
    {
        if (! $this->tracksStock($shop)) {
            return ['ok' => false, 'message' => 'This item does not have limited stock.'];
        }

        if ((int) $shop->slot_limitation > 0) {
            return ['ok' => false, 'message' => 'This item is available right now.'];
        }

        // A creator waiting for their own stock is noise, and would let them test the
        // notice on themselves rather than on a real buyer.
        if ($user && (int) $user->id === (int) $shop->user_id) {
            return ['ok' => false, 'message' => 'This is your own listing.'];
        }

        $email = $user?->email ?: trim((string) $email);

        if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['ok' => false, 'message' => 'Enter a valid email address so we can tell you.'];
        }

        // Same guard for a guest typing the creator's own address.
        if (! $user && $shop->user && strcasecmp($email, (string) $shop->user->email) === 0) {
            return ['ok' => false, 'message' => 'This is your own listing.'];
        }

        $existing = $this->entryFor($shop, $user, $email);

        if ($existing) {
            // Re-joining after being told is legitimate — it sold out again and they
            // still want it. Re-open the same row instead of refusing.
            if ($existing->notified_at) {
                $existing->update(['notified_at' => null, 'notified_stock' => null]);

                // Re-opening is a person joining the queue again, so it counts towards
                // demand exactly like a first-time join.
                $this->notifyCreatorOfDemand($shop);

                return ['ok' => true, 'message' => "We'll email you when it's back."];
            }

            return ['ok' => true, 'message' => "You're already on the list."];
        }

        try {
            StockWaitlist::create([
                'shop_id' => $shop->id,
                'creator_id' => $shop->user_id,
                'user_id' => $user?->id,
                // Store the address for a guest only. For an account holder the email
                // is read from the user at send time, so a later address change still
                // reaches them.
                'email' => $user ? null : $email,
            ]);
        } catch (\Throwable $e) {
            // Unique-key collision from a double submit is a success, not an error.
            if ($this->entryFor($shop, $user, $email)) {
                return ['ok' => true, 'message' => "You're already on the list."];
            }

            Log::warning('StockWaitlist: join failed', ['shop_id' => $shop->id, 'error' => $e->getMessage()]);

            return ['ok' => false, 'message' => 'Could not add you to the list. Please try again.'];
        }

        $this->notifyCreatorOfDemand($shop);

        return ['ok' => true, 'message' => "We'll email you when it's back."];
    }

    /**
     * Tell the creator that people are waiting for this item.
     *
     * This is the whole point of the waitlist on the supply side — a creator who does
     * not know the demand exists has no reason to restock. It fires on the milestones
     * above rather than on every join, so a popular item cannot bury them.
     *
     * Never throws: a join must not fail because a notification did.
     */
    public function notifyCreatorOfDemand(Shop $shop): bool
    {
        try {
            $count = $this->waitingCount($shop->id);

            if (! in_array($count, self::DEMAND_MILESTONES, true)) {
                return false;
            }

            $creator = $shop->user;

            if (! $creator) {
                return false;
            }

            // The claim is the insert, so two people joining at the same instant cannot
            // both push the same milestone.
            if (! NotificationDispatcher::claim($creator->id, 'waitlist_demand', "shop:{$shop->id}:{$count}")) {
                return false;
            }

            $body = $count === 1
                ? "Someone is waiting for {$shop->name} to come back in stock."
                : "{$count} people are now waiting for {$shop->name} to come back in stock.";

            NotificationDispatcher::queue(
                $creator,
                'waitlist_demand',
                [
                    'title' => $count === 1 ? 'Someone is waiting' : "{$count} people are waiting",
                    'body' => $body.' Raise the stock limit and they will all be told.',
                    'url' => url('/shop'),
                    'module' => 'shop',
                    'target_id' => $shop->id,
                ],
                // Bell + push only. This is operational information about the creator's
                // own listing, not something to add to their inbox — and there is no
                // mailable here, so the email channel would be a no-op anyway.
                [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH],
                // Their own sales data. Not marketing, so no consent flag applies.
                false
            );

            return true;
        } catch (\Throwable $e) {
            Log::warning('StockWaitlist: creator demand notification failed', [
                'shop_id' => $shop->id, 'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Remove someone from an item's waitlist.
     *
     * `$email` is for internal/guest-link use only. The HTTP endpoint never passes a
     * caller-supplied address — see StockWaitlistController::leave for why.
     */
    public function leave(Shop $shop, ?User $user, ?string $email = null): bool
    {
        $entry = $this->entryFor($shop, $user, $user?->email ?: $email);

        return $entry ? (bool) $entry->delete() : false;
    }

    public function entryFor(Shop $shop, ?User $user, ?string $email = null): ?StockWaitlist
    {
        $query = StockWaitlist::where('shop_id', $shop->id);

        if ($user) {
            return $query->where('user_id', $user->id)->first();
        }

        return $email ? $query->whereNull('user_id')->where('email', $email)->first() : null;
    }

    public function isWaiting(Shop $shop, ?User $user, ?string $email = null): bool
    {
        $entry = $this->entryFor($shop, $user, $email);

        return $entry && ! $entry->notified_at;
    }

    /** How many people are waiting on an item. Shown to the creator. */
    public function waitingCount(int $shopId): int
    {
        return StockWaitlist::where('shop_id', $shopId)->waiting()->count();
    }

    /** Waiting counts for a set of items in ONE query — for a listing page. */
    public function waitingCounts(array $shopIds): array
    {
        if (empty($shopIds)) {
            return [];
        }

        return StockWaitlist::whereIn('shop_id', $shopIds)
            ->waiting()
            ->selectRaw('shop_id, COUNT(*) as total')
            ->groupBy('shop_id')
            ->pluck('total', 'shop_id')
            ->all();
    }

    /**
     * Immediate restock check for a single item.
     *
     * Called right after the two known code paths that put stock back. It is an
     * optimisation, not the guarantee — the scheduled sweep covers every other path,
     * including a stock change made by the admin app, which runs none of this code.
     * Never throws: it sits next to a refund handler and a listing save.
     */
    public function checkRestock(?int $shopId): int
    {
        try {
            $shop = $shopId ? Shop::find($shopId) : null;

            return $shop ? $this->notifyRestock($shop) : 0;
        } catch (\Throwable $e) {
            Log::warning('StockWaitlist: restock check failed', [
                'shop_id' => $shopId, 'error' => $e->getMessage(),
            ]);

            return 0;
        }
    }

    /**
     * Tell everyone waiting that the item is back.
     *
     * Idempotent: the claim IS the update on each row, so a concurrent sweep and an
     * immediate check cannot both notify the same person.
     */
    public function notifyRestock(Shop $shop, bool $dryRun = false): int
    {
        if (! $this->buyable($shop)) {
            return 0;
        }

        $stock = (int) $shop->slot_limitation;

        $entries = StockWaitlist::where('shop_id', $shop->id)
            ->waiting()
            ->orderBy('id')
            ->limit(self::MAX_PER_RESTOCK)
            ->get();

        if ($entries->isEmpty()) {
            return 0;
        }

        if ($dryRun) {
            return $entries->count();
        }

        $sent = 0;

        foreach ($entries as $entry) {
            // Atomic claim. Only one process can move this row out of "waiting".
            $claimed = StockWaitlist::where('id', $entry->id)
                ->whereNull('notified_at')
                ->update(['notified_at' => now(), 'notified_stock' => $stock, 'updated_at' => now()]);

            if (! $claimed) {
                continue;
            }

            try {
                $this->deliver($entry, $shop, $stock);
                $sent++;
            } catch (\Throwable $e) {
                // Hand the entry back so the next sweep retries it.
                StockWaitlist::where('id', $entry->id)
                    ->update(['notified_at' => null, 'notified_stock' => null]);

                Log::error('StockWaitlist: failed to notify', [
                    'entry_id' => $entry->id, 'shop_id' => $shop->id, 'error' => $e->getMessage(),
                ]);
            }
        }

        if ($sent > 0) {
            Log::info('StockWaitlist: restock notified', [
                'shop_id' => $shop->id, 'notified' => $sent, 'stock' => $stock,
            ]);
        }

        return $sent;
    }

    /** Bell + push + email for an account holder; a single email for a guest. */
    private function deliver(StockWaitlist $entry, Shop $shop, int $stock): void
    {
        $creator = $shop->user;
        $creatorName = $creator?->name ?: ($creator?->username ?? 'the creator');

        $mailArgs = [
            'shopUuid' => (string) $shop->uuid,
            'itemName' => (string) $shop->name,
            'creatorName' => $creatorName,
            'creatorUsername' => $creator?->username,
            'stock' => $stock,
            'userId' => $entry->user_id,
            'waitlistId' => $entry->id,
        ];

        $user = $entry->user && $entry->user->email ? $entry->user : null;

        if ($user) {
            // They asked to be told, so this is not marketing — but the category flag
            // still decides whether the EMAIL half goes, because someone can want the
            // bell without the inbox.
            $channels = [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH];

            if ($user->restock_emails_enabled ?? true) {
                $channels[] = NotificationDispatcher::CHANNEL_EMAIL;
            }

            NotificationDispatcher::queue(
                $user,
                'stock_restock',
                [
                    'title' => 'Back in stock',
                    'body' => "{$shop->name} from {$creatorName} is available again.",
                    'url' => url('/'.($creator?->username ?? '').'?page=shop'),
                    'module' => 'shop',
                    'target_id' => $shop->id,
                    'mailable' => StockBackInStock::class,
                    'mailable_args' => $mailArgs,
                ],
                $channels,
                false
            );

            return;
        }

        // Queued, not sent inline: this loop can run over thousands of entries in a
        // single scheduled sweep, and a synchronous SMTP call per guest would hold the
        // scheduler for as long as the mail server takes.
        Mail::to($entry->email)->queue(new StockBackInStock(...$mailArgs));
    }

    /** Does this listing track stock at all? A null limit means unlimited. */
    public function tracksStock(Shop $shop): bool
    {
        return $shop->slot_limitation !== null;
    }

    /** Is the item sold out right now — i.e. is the waitlist button relevant? */
    public function isSoldOut(Shop $shop): bool
    {
        return $this->tracksStock($shop) && (int) $shop->slot_limitation <= 0;
    }

    /**
     * Can somebody actually buy this right now?
     *
     * Stock alone is not enough — an unapproved, suspended or unsellable listing would
     * send people to a page that refuses them, which is worse than saying nothing.
     */
    public function buyable(Shop $shop): bool
    {
        if (! $this->tracksStock($shop) || (int) $shop->slot_limitation <= 0) {
            return false;
        }

        // Read each publication flag only when the row actually carries it. `shops`
        // differs between a freshly migrated database and the deployed one (`status`
        // has no migration at all), and a column that is simply absent is not evidence
        // that the listing is unpublished — treating it as `0` would make every item
        // permanently unbuyable and silence the whole feature.
        $attributes = $shop->getAttributes();

        foreach (['approved', 'status'] as $flag) {
            if (array_key_exists($flag, $attributes) && ! (int) $attributes[$flag]) {
                return false;
            }
        }

        if (! empty($attributes['is_suspended'])) {
            return false;
        }

        $creator = $shop->user;

        return $creator && ! ($creator->suspended_account ?? 0) && ! empty($creator->account_id);
    }
}
