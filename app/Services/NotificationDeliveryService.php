<?php

namespace App\Services;

use App\Models\FinancialTransaction;
use App\Models\NotificationLog;
use App\Models\StripePaymentItems;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * "Were you told about this?" — the delivery status of one person's own
 * notifications, resolved for a page of ledger rows at a time.
 *
 * 🚨 SCOPED TO THE VIEWER, ALWAYS. Every query here filters on
 * `recipient_user_id`, never on the transaction alone. A creator must not be
 * able to see whether their supporter's receipt arrived: that is the supporter's
 * relationship with the platform, and this platform never hands a creator
 * anything about a supporter beyond the purchase itself. The same rule the other
 * way — a buyer has no business knowing what the creator was sent.
 *
 * Admin is the only place both sides are visible, and it reads the table
 * directly rather than going through this.
 */
class NotificationDeliveryService
{
    /**
     * Delivery status for a page of ledger rows, keyed by financial transaction
     * id. ONE query for the whole page.
     *
     * Returns `null` for a row we cannot speak to — either nothing was recorded,
     * or the purchase predates delivery logging. The caller renders those
     * differently, because "we did not tell you" and "we were not recording yet"
     * are not the same statement to make to somebody about their own money.
     */
    public function forLedgerRows(?int $viewerId, Collection $rows): array
    {
        if (! $viewerId || $rows->isEmpty()) {
            return [];
        }

        try {
            if (! Schema::hasTable('notification_logs')) {
                return [];
            }

            // Batched, because the caller may not have eager-loaded these — and
            // reading `$row->source` per row would be an N+1 on a page of
            // twenty transactions.
            $rows->loadMissing('source');
            $rows->loadMorph('source', [
                StripePaymentItems::class => ['payment'],
            ]);

            $sessionByTx = [];
            $sessions = [];

            foreach ($rows as $row) {
                $sessionId = $this->sessionIdFor($row);

                if (! $sessionId) {
                    continue;
                }

                $sessionByTx[$row->id] = $sessionId;
                $sessions[$sessionId] = true;
            }

            if ($sessions === []) {
                return [];
            }

            $bySession = $this->deliveryBySession($viewerId, array_keys($sessions));

            $out = [];

            foreach ($sessionByTx as $txId => $sessionId) {
                if (isset($bySession[$sessionId])) {
                    $out[$txId] = $bySession[$sessionId];
                }
            }

            return $out;
        } catch (\Throwable $e) {
            Log::warning('NotificationDeliveryService: lookup failed', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * Delivery status keyed by Stripe session id directly, for surfaces that
     * don't have a `FinancialTransaction` row to hand in — the Purchase Hub
     * assembles its list from seven separate payment tables, several of which
     * predate the ledger sync for some rows.
     */
    public function forSessionIds(?int $viewerId, array $sessionIds): array
    {
        if (! $viewerId || $sessionIds === []) {
            return [];
        }

        try {
            if (! Schema::hasTable('notification_logs')) {
                return [];
            }

            return $this->deliveryBySession($viewerId, $sessionIds);
        } catch (\Throwable $e) {
            Log::warning('NotificationDeliveryService: session lookup failed', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /** @return array<string, array{email:?string,push:?string,bell:?string,at:?string}> */
    private function deliveryBySession(int $viewerId, array $sessionIds): array
    {
        $logs = NotificationLog::query()
            ->where('recipient_user_id', $viewerId)
            ->whereIn('stripe_session_id', $sessionIds)
            ->get(['channel', 'status', 'stripe_session_id', 'sent_at', 'created_at']);

        if ($logs->isEmpty()) {
            return [];
        }

        $bySession = [];

        foreach ($logs as $log) {
            $key = (string) $log->stripe_session_id;

            $bySession[$key] = $bySession[$key] ?? [
                'email' => null,
                'push' => null,
                'bell' => null,
                'at' => null,
            ];

            // Best outcome per channel wins: a retry that succeeded after a
            // failure means the person DID hear from us, and reporting the
            // failure would be telling them otherwise.
            $bySession[$key][$log->channel] = $this->betterStatus(
                $bySession[$key][$log->channel] ?? null,
                (string) $log->status,
            );

            $stamp = $log->sent_at ?? $log->created_at;

            if ($stamp && (! $bySession[$key]['at'] || $stamp->gt($bySession[$key]['at']))) {
                $bySession[$key]['at'] = $stamp;
            }
        }

        foreach ($bySession as &$entry) {
            $entry['at'] = $entry['at']?->toIso8601String();
        }
        unset($entry);

        return $bySession;
    }

    /**
     * The Stripe checkout session behind a ledger row.
     *
     * Each payment table names it differently, and a couple do not carry one at
     * all — a row with no session simply gets no delivery status rather than
     * being matched against something it does not own.
     */
    private function sessionIdFor(FinancialTransaction $row): ?string
    {
        $source = $row->source ?? null;

        if (! $source) {
            return null;
        }

        foreach (['session_id', 'stripe_session_id'] as $column) {
            if (! empty($source->{$column})) {
                return (string) $source->{$column};
            }
        }

        // Wish/cart line items hang off a parent payment record, which is where
        // the session lives.
        $parent = $source->payment ?? null;

        if ($parent && ! empty($parent->session_id)) {
            return (string) $parent->session_id;
        }

        return null;
    }

    /** sent > queued > failed > skipped — the strongest thing we can honestly say. */
    private function betterStatus(?string $current, string $candidate): string
    {
        $rank = [
            NotificationLog::STATUS_SKIPPED => 0,
            NotificationLog::STATUS_FAILED => 1,
            NotificationLog::STATUS_QUEUED => 2,
            NotificationLog::STATUS_SENT => 3,
        ];

        if ($current === null) {
            return $candidate;
        }

        return ($rank[$candidate] ?? 0) > ($rank[$current] ?? 0) ? $candidate : $current;
    }
}
