<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\CreatorFeeOverride;
use App\Models\MembershipPayment;
use App\Models\User;
use App\Models\WishItemSubscription;
use App\Services\Pricing\CreatorFeeResolver;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Move existing subscribers onto a creator's reduced platform rate.
 *
 * Client decision (3 Aug 2026):
 *   - A rate DECREASE reaches existing subscribers at their next renewal — they
 *     pay less, which needs no notice and is a straightforward benefit.
 *   - A rate INCREASE applies to NEW subscribers only. Existing subscribers stay
 *     on the rate they signed up at until they cancel and resubscribe.
 *
 * 🚨 The second rule is enforced STRUCTURALLY, not by policy: this command
 * refuses to raise any charge. Raising someone's recurring payment without
 * advance notice is a consumer-law problem and a chargeback risk, so the code
 * that could do it does not exist rather than being guarded by a config flag.
 *
 * A sweep rather than a model hook: a rate changes because an admin ended one
 * agreement and opened another, and the subscriptions affected are spread across
 * three tables and Stripe.
 */
class RepriceSubscriptionsOnFeeChange extends Command
{
    protected $signature = 'subscriptions:reprice-on-fee-change
        {--user= : Limit to one creator (id or username)}
        {--max=0 : Stop after this many subscriptions repriced (0 = no limit)}
        {--dry-run : Report what would change without touching Stripe or the database}';

    protected $description = 'Move existing subscribers onto a creator\'s reduced platform rate (never onto a higher one)';

    /**
     * Recurring products, and how to reach the creator who owns each one.
     *
     * ⚠️ Recurring checkout is card-only on this platform, so every row here is
     * priced on the 'card' profile. If bank is ever enabled for recurring, this
     * has to read the row's own fee_profile instead.
     */
    private const SOURCES = [
        [
            'model' => BillPayment::class,
            'label' => 'bill',
            'join' => ['bills', 'bills.id', 'bill_payments.bills_id'],
            'table' => 'bill_payments',
        ],
        [
            'model' => MembershipPayment::class,
            'label' => 'membership',
            'join' => ['memberships', 'memberships.id', 'membership_payments.membership_id'],
            'table' => 'membership_payments',
        ],
        [
            'model' => WishItemSubscription::class,
            'label' => 'wish',
            'join' => ['wish_items', 'wish_items.id', 'wish_item_subscriptions.wish_item_id'],
            'table' => 'wish_item_subscriptions',
        ],
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = (int) $this->option('max');

        $creators = $this->creators();

        if ($creators->isEmpty()) {
            $this->info('No creators on a bespoke rate — nothing to reprice.');

            return self::SUCCESS;
        }

        $repriced = 0;
        $grandfathered = 0;
        $unchanged = 0;
        $failed = 0;

        foreach ($creators as $creator) {
            CreatorFeeResolver::flushCache();

            $currentRate = (float) (CreatorFeeResolver::profileFor($creator->id, 'card')['platform_rate'] ?? 0);
            $standardRate = (float) config('payments.fee_profiles.card.platform_rate', 17);

            foreach (self::SOURCES as $source) {
                foreach ($this->liveSubscriptions($source, $creator) as $row) {
                    if ($max > 0 && $repriced >= $max) {
                        $this->info("Reached --max={$max}; re-run to continue.");
                        $this->report($repriced, $grandfathered, $unchanged, $failed, $dryRun);

                        return self::SUCCESS;
                    }

                    // A row written before these columns existed was priced at the
                    // standard rate, which is what NULL correctly means here.
                    $storedRate = $row->platform_fee_rate === null
                        ? $standardRate
                        : (float) $row->platform_fee_rate;

                    if ($currentRate > $storedRate) {
                        // 🚨 The rate went UP. Leave this supporter exactly as they are.
                        $grandfathered++;

                        continue;
                    }

                    if ($currentRate == $storedRate) {
                        $unchanged++;

                        continue;
                    }

                    if ($this->reprice($row, $source, $creator, $currentRate, $storedRate, $dryRun)) {
                        $repriced++;
                    } else {
                        $failed++;
                    }
                }
            }
        }

        $this->report($repriced, $grandfathered, $unchanged, $failed, $dryRun);

        return self::SUCCESS;
    }

    private function creators()
    {
        // Only a creator with a LIVE agreement can have a rate below what any of
        // their subscribers were charged — standard pricing is the ceiling.
        $query = User::query()->whereIn(
            'id',
            CreatorFeeOverride::query()->live()->select('user_id')
        );

        if ($user = $this->option('user')) {
            // Only compare against `id` when the option actually looks like one —
            // MySQL casts a non-numeric string in an integer comparison and can
            // match id 0, quietly repricing the wrong creator's subscribers.
            $query->where(function ($q) use ($user) {
                if (ctype_digit((string) $user)) {
                    $q->where('id', (int) $user);
                }

                $q->orWhere('username', $user);
            });
        }

        return $query->get();
    }

    private function liveSubscriptions(array $source, User $creator)
    {
        [$itemTable, $itemKey, $foreignKey] = $source['join'];
        $table = $source['table'];

        return $source['model']::query()
            ->join($itemTable, $itemKey, '=', $foreignKey)
            ->where("{$itemTable}.user_id", $creator->id)
            ->where("{$table}.status", 'paid')
            ->where("{$table}.recurring_for", 'continue')
            ->whereNotNull("{$table}.stripe_id")
            // Stripe subscription ids start with sub_; a one-off payment intent id
            // in this column is not something that can be repriced.
            ->where("{$table}.stripe_id", 'like', 'sub_%')
            ->where(function ($q) use ($table) {
                $q->whereNull("{$table}.end")->orWhere("{$table}.end", '>', now());
            })
            ->select("{$table}.*")
            ->cursor();
    }

    private function reprice($row, array $source, User $creator, float $currentRate, float $storedRate, bool $dryRun): bool
    {
        $currency = strtoupper($row->currency ?? $creator->default_currency ?? 'GBP');
        $listed = (float) $row->amount + (float) ($row->vat_tax_amount ?? $row->vat_amount ?? 0);

        $breakdown = Helpers::calculateStripeDirectChargeFlow($listed, $currency, 0, 'card', $creator->id);
        $newTotal = (float) $breakdown['total_supporter_pays'];
        $oldTotal = (float) ($row->total_paid ?? 0);

        // Belt and braces against the one outcome this command must never produce.
        if ($oldTotal > 0 && $newTotal > $oldTotal) {
            Log::warning('RepriceSubscriptions: refusing to raise a live subscription', [
                'source' => $source['label'],
                'row_id' => $row->id,
                'old_total' => $oldTotal,
                'new_total' => $newTotal,
            ]);

            return false;
        }

        $line = sprintf(
            '%s #%d — %s%s → %s (platform %s%% → %s%%)',
            $source['label'],
            $row->id,
            $currency,
            number_format($oldTotal, 2),
            number_format($newTotal, 2),
            rtrim(rtrim(number_format($storedRate, 2), '0'), '.'),
            rtrim(rtrim(number_format($currentRate, 2), '0'), '.')
        );

        if ($dryRun) {
            $this->line('  [dry-run] '.$line);

            return true;
        }

        try {
            $applicationFeePercent = $newTotal > 0
                ? ((float) $breakdown['application_fee'] / $newTotal) * 100
                : null;

            StripeControl::repriceSubscription(
                $row->stripe_id,
                $newTotal,
                $currency,
                null,
                $applicationFeePercent,
                $creator->account_id,
                // Keyed on the rate as well as the row: a second reduction later
                // must be allowed through, while a re-run of THIS one must not
                // create a second price.
                'reprice_'.$source['label'].'_'.$row->id.'_'.str_replace('.', '_', (string) $currentRate)
            );
        } catch (\Throwable $e) {
            $this->error('  failed: '.$line.' — '.$e->getMessage());
            Log::error('RepriceSubscriptions: Stripe update failed', [
                'source' => $source['label'],
                'row_id' => $row->id,
                'stripe_id' => $row->stripe_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        // Only written after Stripe has accepted the change: a local row claiming a
        // rate Stripe is not charging is worse than one that lags by a run.
        $row->forceFill(array_merge(
            Helpers::feeRateColumns($breakdown),
            ['total_paid' => $newTotal]
        ))->save();

        $this->line('  '.$line);

        return true;
    }

    private function report(int $repriced, int $grandfathered, int $unchanged, int $failed, bool $dryRun): void
    {
        $this->info(sprintf(
            '%sRepriced %d · grandfathered %d · unchanged %d · failed %d',
            $dryRun ? '[dry-run] ' : '',
            $repriced,
            $grandfathered,
            $unchanged,
            $failed
        ));

        if ($grandfathered > 0) {
            $this->line('Grandfathered = the rate went up; those supporters keep the rate they signed up at.');
        }
    }
}
