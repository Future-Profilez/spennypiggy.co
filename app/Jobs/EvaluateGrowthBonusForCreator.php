<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\GrowthBonusService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Re-evaluate ONE creator's Growth Bonus, right after a sale lands on the ledger.
 *
 * 🚨 THE DAILY COMMAND IS STILL THE SOURCE OF TRUTH; THIS IS AN ACCELERATOR.
 * `growth-bonus:evaluate` (09:20) walks every creator in the programme and is
 * what guarantees nobody is missed. This job exists because a creator who
 * crosses £100 at lunchtime should not be told about it the next morning — the
 * money moved, the ledger already knows, and the one screen that says how they
 * are doing was a day behind.
 *
 * ⚠️ It cannot replace the daily pass, and must not be made to. Two outcomes
 * are driven by TIME rather than by a sale — the activation window closing and
 * the 12-month expiry — and no payment arrives to trigger those. A creator who
 * stops selling entirely is exactly the one whose window closes.
 *
 * 🚨 UNIQUE PER CREATOR FOR `uniqueFor` SECONDS. A basket spanning five items
 * writes five ledger rows within a second of each other, and each one would
 * otherwise queue a full recompute of the same creator's whole history. The
 * lock is released when the job runs, so a later sale still gets its own pass.
 *
 * ⚠️ Delayed deliberately. Ledger rows for one checkout are written across a
 * few seconds (the webhook's module fan-out), so evaluating on the FIRST row
 * would read a half-written basket, and the second rung of a two-rung purchase
 * would wait for the daily run anyway.
 */
class EvaluateGrowthBonusForCreator implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Long enough to cover one checkout's fan-out, short enough that a second sale is not swallowed. */
    public int $uniqueFor = 120;

    public function __construct(public int $creatorId) {}

    public function uniqueId(): string
    {
        return (string) $this->creatorId;
    }

    public function handle(GrowthBonusService $service): void
    {
        if (! $service->enabled()) {
            return;
        }

        try {
            $creator = User::find($this->creatorId);

            if (! $creator) {
                return;
            }

            $service->evaluateCreator($creator);
        } catch (\Throwable $e) {
            /*
             * ⚠️ Never rethrown. The daily pass will pick this creator up, so a
             * failure here costs freshness and nothing else — and a job that
             * fills `failed_jobs` on every bad ledger row would bury the ones
             * that matter.
             */
            Log::warning('Growth Bonus: instant evaluation failed', [
                'creator_id' => $this->creatorId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
