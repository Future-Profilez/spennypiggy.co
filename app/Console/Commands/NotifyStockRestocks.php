<?php

namespace App\Console\Commands;

use App\Models\Shop;
use App\Models\StockWaitlist;
use App\Services\StockWaitlistService;
use Illuminate\Console\Command;

/**
 * Tells everyone waiting that a sold-out item is back.
 *
 * ⚠️ **This sweep is the guarantee, not a backstop.** Every path that puts stock back
 * bypasses Eloquent model events:
 *   - the refund handler uses `Shop::where(...)->increment()`
 *   - the creator's listing edit uses `Shop::where(...)->update()`
 *   - the ADMIN APP shares this database and runs none of this code at all
 * so a model observer would have sat there firing on nothing. `checkRestock()` is called
 * from the first two sites for immediacy; this is what actually catches every case.
 *
 * Runs every ten minutes. Cheap: one grouped query finds the items that have anyone
 * waiting, and only those are examined.
 */
class NotifyStockRestocks extends Command
{
    protected $signature = 'waitlist:notify-restock
        {--max=200 : Maximum items to examine in one run}
        {--dry-run : Report only, notify nobody}';

    protected $description = 'Notify waitlisted buyers when a sold-out shop item is back in stock';

    public function handle(StockWaitlistService $service): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));

        // Only items somebody is actually waiting for, and that are currently in stock.
        // Selecting only in-stock items avoids starvation where old, permanently sold-out
        // items occupy the entire limit and prevent checking newly restocked ones.
        $shopIds = StockWaitlist::waiting()
            ->whereHas('shop', function ($query) {
                $query->whereNotNull('slot_limitation')
                      ->where('slot_limitation', '>', 0);
            })
            ->select('shop_id')
            ->distinct()
            ->limit($max)
            ->pluck('shop_id');

        if ($shopIds->isEmpty()) {
            $this->info('Nobody is waiting on any item.');

            return self::SUCCESS;
        }

        $notified = 0;
        $items = 0;

        foreach (Shop::whereIn('id', $shopIds)->with('user')->get() as $shop) {
            // buyable() covers stock AND the listing being sellable at all — sending
            // people to an unapproved or suspended listing is worse than saying nothing.
            if (! $service->buyable($shop)) {
                continue;
            }

            $count = $service->notifyRestock($shop, $dryRun);

            if ($count > 0) {
                $items++;
                $notified += $count;

                $this->line(sprintf(
                    '%s%s — %d waiting notified (%d in stock)',
                    $dryRun ? '[dry-run] ' : '',
                    $shop->name,
                    $count,
                    (int) $shop->slot_limitation
                ));
            }
        }

        $this->info(sprintf(
            '%sItems back in stock: %d · people notified: %d',
            $dryRun ? '[dry-run] ' : '',
            $items,
            $notified
        ));

        return self::SUCCESS;
    }
}
