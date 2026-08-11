<?php

namespace App\Models\Concerns;

use App\Models\Currency;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Stamps every ledger row with its GBP value at the rate in force when the money moved.
 *
 * 🚨 The rate is written ONCE and never rewritten. Admin reporting used to convert
 * `gross_amount` at TODAY'S rate on every page load, so last quarter's revenue moved
 * every morning and no month-end figure could be reproduced two days running. Freezing
 * the rate on the row is what makes the history stop changing.
 *
 * `gbp_amount` DOES follow `gross_amount`, because `SyncFinancialTransactions` legitimately
 * corrects a gross on a resync — but it is always recomputed at the ORIGINAL rate, never
 * at today's. That is the difference between fixing a figure and re-costing history.
 *
 * ⚠️ An unknown currency leaves BOTH columns NULL rather than falling back to 1:1. Treating
 * 1,000 JPY as £1,000 inflates revenue silently, which is worse than a row the reports can
 * count and report as unconverted.
 *
 * ⚠️ This trait is duplicated verbatim in admin.spennypiggy.co. The two apps share this
 * table but not their code, and both write to it — keep them identical.
 */
trait FreezesLedgerFx
{
    /** @var array<string, float>|null */
    private static ?array $ledgerFxRates = null;

    private static ?bool $ledgerFxColumnsExist = null;

    public static function bootFreezesLedgerFx(): void
    {
        static::saving(function ($model) {
            if (! static::ledgerFxColumnsExist()) {
                return;
            }

            $currency = strtoupper((string) ($model->currency ?: 'GBP'));

            if ($model->gbp_rate === null) {
                $rate = static::ledgerFxRate($currency);

                if ($rate === null) {
                    // Nothing to freeze. Reporting counts these separately rather
                    // than guessing at a rate that would understate or inflate.
                    return;
                }

                $model->gbp_rate = $rate;
            }

            $rate = (float) $model->gbp_rate;

            if ($rate > 0 && $model->gross_amount !== null) {
                $model->gbp_amount = round((float) $model->gross_amount / $rate, 2);
            }
        });
    }

    /**
     * Units of $currency per 1 GBP, or null when the currency is unknown.
     */
    public static function ledgerFxRate(string $currency): ?float
    {
        $currency = strtoupper($currency ?: 'GBP');

        if ($currency === 'GBP') {
            return 1.0;
        }

        if (self::$ledgerFxRates === null) {
            try {
                self::$ledgerFxRates = Currency::rates()
                    ->map(fn ($r) => (float) $r)
                    ->toArray();
            } catch (\Throwable $e) {
                Log::warning('FreezesLedgerFx: could not load currency rates', ['error' => $e->getMessage()]);
                self::$ledgerFxRates = [];
            }
        }

        $rate = self::$ledgerFxRates[$currency] ?? null;

        return ($rate !== null && $rate > 0) ? $rate : null;
    }

    /** Test seam — the rate map is request-scoped and would otherwise leak across tests. */
    public static function clearLedgerFxCache(): void
    {
        self::$ledgerFxRates = null;
        self::$ledgerFxColumnsExist = null;
    }

    private static function ledgerFxColumnsExist(): bool
    {
        if (self::$ledgerFxColumnsExist === null) {
            try {
                self::$ledgerFxColumnsExist = Schema::hasColumn((new static)->getTable(), 'gbp_amount');
            } catch (\Throwable) {
                self::$ledgerFxColumnsExist = false;
            }
        }

        return self::$ledgerFxColumnsExist;
    }
}
