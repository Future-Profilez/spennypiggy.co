<?php

namespace App\Services\Discovery;

use App\Models\DiscoveryEvent;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Services\VisitTracker;
use App\Support\DiscoverySources;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Discovery Phase 1 — recording where a supporter came from.
 *
 * 🚨 EVERY NUMBER LATER PHASES SHOW IS DERIVED FROM WHAT THIS CLASS WRITES.
 * The dashboard banner, the marketing proof point and the whole "we show you
 * what Discovery is worth" argument are this table, summed. If a surface is not
 * tagged, its contribution is invisible for ever — there is no backfill for a
 * visit nobody recorded.
 *
 * ⚠️ IT MUST NEVER BREAK A PAGE OR A PURCHASE. Same rule `VisitTracker` follows,
 * and it matters more here: this code runs on the profile route and inside the
 * checkout path. Every public entry point is wrapped, and a failure logs and
 * returns rather than propagating. A supporter must never lose a purchase
 * because analytics threw.
 *
 * ── How a purchase gets attributed ──────────────────────────────────────────
 *
 *  1. A tagged link (`?sp_d=trending`) lands on a creator's profile.
 *  2. `recordVisit()` writes a `visit` row and stamps the `sp_disc` cookie with
 *     `{creator_id: source}`, for `DiscoverySources::WINDOW_DAYS` (30).
 *  3. The supporter buys — maybe now, maybe three weeks later.
 *  4. `attributeTransaction()` reads the cookie for THAT creator, writes the
 *     source onto the ledger row and adds a `purchase` event.
 *
 * ⚠️ THE COOKIE IS KEYED PER CREATOR, not one source for the whole session. A
 * supporter can arrive at creator A from Trending and creator B from their own
 * bio link in the same browser; one global "last source" would credit Discovery
 * with the second sale.
 *
 * ⚠️ LAST-TOUCH WITHIN THE WINDOW, deliberately — the opposite of
 * `VisitTracker`'s first-touch landing cookie. First-touch answers "which advert
 * recruited this creator", a question asked once. This answers "what made this
 * purchase happen", where the most recent nudge is the honest answer, and it is
 * the one that keeps working when a supporter returns through a different
 * collection weeks later.
 *
 * ── How a purchase with NO BROWSER gets attributed ───────────────────────────
 *
 * 🚨 A LEDGER ROW WRITTEN BY A STRIPE WEBHOOK HAS NO COOKIE TO READ. Bank
 * payments (SEPA/ACH) settle asynchronously — the supporter closed the tab days
 * ago — so the cookie path above can never see them, and they are exactly the
 * payments this platform most wants attributed.
 *
 * The source therefore travels WITH THE PAYMENT, in its Stripe metadata:
 *
 *  1. `Helpers::buildStripeMetadata()` reads the cookie at checkout time (the
 *     one moment a browser is present) and stamps `sp_discovery_source`.
 *  2. Stripe hands that metadata straight back on every later event.
 *  3. `StripeWebhookController::handle()` remembers the event's metadata for the
 *     duration of the request (`rememberPaymentMetadata()`), the way
 *     `NotificationContext` carries the payment a message belongs to.
 *  4. The `FinancialTransaction::created` hook falls back to
 *     `attributeTransactionFromMetadata()` when there is no cookie.
 *
 * ⚠️ THE METADATA'S `creator_id` MUST MATCH THE LEDGER ROW'S CREATOR. One Stripe
 * event can produce several ledger rows (a basket spanning creators), and a
 * source key only ever meant the creator whose cookie entry it came from —
 * crediting Discovery for the wrong creator's sale is the exact failure this
 * whole system exists to make impossible.
 *
 * ── How a purchase with NO BROWSER AND NO EVENT gets attributed ──────────────
 *
 * 🚨 SHOP, TASK, BILL, MEMBERSHIP AND WISH LEDGER ROWS ARE WRITTEN BY A QUEUED
 * COMMAND, not by the checkout and not by the webhook. `finance:sync-transactions`
 * runs every 30 minutes in a worker with neither of the two things above, and the
 * ambient metadata is deliberately NOT propagated across the queue: that command
 * rebuilds EVERY row belonging to a creator in one pass, so one payment's source
 * would leak onto all of them.
 *
 * So the source is persisted PER PAYMENT, on the payment row itself:
 *
 *  1. `sourceForCreator()` resolves it at purchase time — cookie first, then the
 *     payment's own Stripe metadata — and every payment-row creation site writes
 *     it to `discovery_source` (migration `2026_08_20_200000`). The same call
 *     backs `Helpers::buildStripeMetadata()`, so the two can never disagree.
 *  2. A subscription RENEWAL copies the column forward from the row before it,
 *     exactly as the fee rates are grandfathered: there is no browser on month 2,
 *     and the surface that introduced the supporter earned the whole stream.
 *  3. `SyncFinancialTransactions::attributeDiscovery()` reads it back after every
 *     `updateOrCreate` and calls `attributeTransactionFromSource()`.
 */
class AttributionService
{
    /**
     * The Stripe metadata key carrying the Discovery source through a payment.
     *
     * ⚠️ Prefixed `sp_` like the query parameter and the cookies: Stripe metadata
     * is a flat shared namespace that several features write into, and the
     * builder merges an `$extra` array over the top of it.
     */
    public const METADATA_KEY = 'sp_discovery_source';

    /**
     * Metadata for the payment currently being processed with no browser
     * attached. Set once per Stripe event / synced payment, read by the
     * `FinancialTransaction::created` hook however many rows that produces.
     *
     * ⚠️ Process-local and deliberately NOT propagated across the queue — a job
     * running minutes later would attribute whatever it happened to inherit.
     * Every consumer re-checks `creator_id` against the row it is stamping, so a
     * value left standing can only ever apply to the payment it came from.
     */
    private static array $ambientMetadata = [];

    /**
     * Record a profile visit, if it is attributable and not a repeat.
     *
     * @return bool whether a row was written
     */
    public function recordVisit(Request $request, User $creator): bool
    {
        try {
            $source = $this->resolveSource($request, $creator->id);

            if ($source === null) {
                return false;
            }

            $identity = $this->identity($request);

            if ($identity['user_id'] === null && $identity['visitor_id'] === null) {
                // Nothing to de-duplicate against, and nothing to attribute a
                // later purchase to. Counting it would inflate "people
                // introduced" with rows we can never connect to an outcome.
                return false;
            }

            // A supporter reloading a profile is one person, not five.
            if ($this->alreadySeenToday($creator->id, $identity)) {
                return false;
            }

            $this->write($creator->id, $source, DiscoveryEvent::TYPE_VISIT, $identity, [
                'is_new_to_creator' => $this->isNewToCreator($creator->id, $identity),
                'campaign' => $this->campaign($request),
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::warning('Discovery: recordVisit failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Stamp a completed purchase with the Discovery source that earned it.
     *
     * 🚨 CALLED AFTER THE LEDGER ROW EXISTS, never before. The source belongs on
     * `financial_transactions` (the brief: "Source stored on the transaction
     * record itself") and the event row points at it, so the money report never
     * has to guess which purchase a Discovery event refers to.
     */
    public function attributeTransaction(
        FinancialTransaction $transaction,
        ?Request $request = null
    ): ?string {
        try {
            $request ??= request();

            $source = $this->cookieSourceFor($request, (int) $transaction->user_id);

            if ($source === null) {
                return null;
            }

            return $this->stamp($transaction, $source, $this->identity($request));
        } catch (\Throwable $e) {
            Log::warning('Discovery: attributeTransaction failed', [
                'transaction' => $transaction->getKey(),
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Stamp a completed purchase from the payment's own Stripe metadata.
     *
     * 🚨 THIS IS HOW A WEBHOOK-CREATED ROW GETS ATTRIBUTED AT ALL. There is no
     * cookie in that context — the supporter's browser is not involved — so the
     * source has to have travelled with the payment. See the class docblock.
     *
     * ⚠️ Refuses unless the metadata names the SAME creator as the ledger row.
     * A single Stripe event can write several rows, and an unchecked source key
     * would credit Discovery with a sale it had nothing to do with.
     *
     * @param  array<string,mixed>  $metadata  the payment's Stripe metadata
     */
    public function attributeTransactionFromMetadata(
        FinancialTransaction $transaction,
        array $metadata
    ): ?string {
        try {
            $source = self::sourceFromMetadata($metadata);

            if ($source === null) {
                return null;
            }

            $creatorId = (int) $transaction->user_id;
            $metadataCreatorId = filter_var($metadata['creator_id'] ?? null, FILTER_VALIDATE_INT);

            if ($metadataCreatorId === false || $metadataCreatorId !== $creatorId) {
                return null;
            }

            // The supporter is the only identity a webhook has. A guest purchase
            // carries none, which is handled the same way a logged-out visit is.
            $identity = [
                'user_id' => $transaction->supporter_id !== null ? (int) $transaction->supporter_id : null,
                'visitor_id' => null,
            ];

            return $this->stamp($transaction, $source, $identity);
        } catch (\Throwable $e) {
            Log::warning('Discovery: attributeTransactionFromMetadata failed', [
                'transaction' => $transaction->getKey(),
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Stamp a completed purchase from a source the PAYMENT ROW already carries.
     *
     * 🚨 THIS IS HOW A QUEUED LEDGER WRITE GETS ATTRIBUTED. Shop, task, bill,
     * membership and wish ledger rows are written by `finance:sync-transactions`,
     * in a worker with neither cookie nor Stripe event metadata — and the ambient
     * metadata is deliberately NOT carried across the queue, because that command
     * rebuilds every row a creator has and one payment's source would leak onto
     * all of them. The source is read back per payment instead, from the
     * `discovery_source` column persisted at purchase time.
     *
     * ⚠️ No creator check is possible or needed here: the caller has the payment
     * row that produced THIS ledger row, so the pairing is structural rather than
     * inferred. That is exactly why it is safer than the metadata path.
     *
     * ⚠️ Routes through `stamp()` like every other path, so an already-attributed
     * row is never overwritten and a re-run adds no second purchase event.
     */
    public function attributeTransactionFromSource(
        FinancialTransaction $transaction,
        ?string $source
    ): ?string {
        try {
            $source = DiscoverySources::normalise($source);

            if ($source === null) {
                return null;
            }

            // The supporter is the only identity a queued run has; a guest
            // purchase carries none, handled as a logged-out visit is.
            $identity = [
                'user_id' => $transaction->supporter_id !== null ? (int) $transaction->supporter_id : null,
                'visitor_id' => null,
            ];

            return $this->stamp($transaction, $source, $identity);
        } catch (\Throwable $e) {
            Log::warning('Discovery: attributeTransactionFromSource failed', [
                'transaction' => $transaction->getKey(),
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * The source to PERSIST on a payment row being created for this creator.
     *
     * 🚨 ONE RESOLUTION, USED EVERYWHERE. `Helpers::buildStripeMetadata()` reads
     * this too, so the key stamped into Stripe's metadata and the key written to
     * the payment row can never disagree — a second implementation is how a bank
     * payment ends up attributed one way by the webhook and another by the sync.
     *
     * Cookie first (checkout: a browser is present), then the payment's own
     * Stripe metadata (a webhook-created renewal or a settled bank payment) —
     * the same order as the `FinancialTransaction::created` hook.
     *
     * ⚠️ Metadata is only trusted when its `creator_id` matches the creator being
     * asked about. One Stripe event can cover several creators, and a source key
     * only ever meant the one whose cookie entry produced it.
     *
     * ⚠️ Never throws and never returns a key `DiscoverySources::normalise()`
     * refuses. A payment must never fail because analytics could not resolve.
     *
     * ⚠️ `$creatorId` is deliberately UNTYPED. It is read straight off a model
     * attribute at nineteen call sites, all of them on a payment path — a
     * TypeError raised at the call boundary would land OUTSIDE the try below and
     * take the purchase down with it. Anything not a positive integer resolves
     * to null here instead.
     *
     * @param  mixed  $creatorId  the creator this payment pays
     * @param  mixed  $metadata  Stripe metadata (object or array), or null to
     *                           fall back to whatever the current event set
     */
    public static function sourceForCreator($creatorId, $metadata = null): ?string
    {
        try {
            $creatorId = filter_var($creatorId, FILTER_VALIDATE_INT);

            if ($creatorId === false || $creatorId <= 0) {
                return null;
            }

            /*
             * ⚠️ Deliberately NOT guarded on `runningInConsole()`, unlike the
             * `FinancialTransaction::created` hook. A console-synthesised request
             * simply carries no cookies, so the lookup returns null and falls
             * through — whereas the guard would also skip the check under
             * PHPUnit, where the request is bound explicitly and IS the thing
             * under test.
             */
            if (app()->bound('request')) {
                $request = request();

                if ($request instanceof Request && $request->cookies !== null) {
                    $cookieSource = app(self::class)->cookieSourceFor($request, $creatorId);

                    if ($cookieSource !== null) {
                        return $cookieSource;
                    }
                }
            }

            $metadata = $metadata === null
                ? self::$ambientMetadata
                : self::metadataToArray($metadata);

            if ($metadata === []) {
                return null;
            }

            $metadataCreatorId = filter_var($metadata['creator_id'] ?? null, FILTER_VALIDATE_INT);

            if ($metadataCreatorId === false || $metadataCreatorId !== $creatorId) {
                return null;
            }

            return self::sourceFromMetadata($metadata);
        } catch (\Throwable $e) {
            Log::warning('Discovery: sourceForCreator failed', [
                'creator' => $creatorId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /** The Discovery source a payment's Stripe metadata carries, if any. */
    public static function sourceFromMetadata(array $metadata): ?string
    {
        $raw = $metadata[self::METADATA_KEY] ?? null;

        return DiscoverySources::normalise(is_string($raw) ? $raw : null);
    }

    /**
     * Remember the metadata of the payment being processed right now.
     *
     * Called once per Stripe event rather than at each of the dozen places a
     * ledger row is written — the same reasoning as
     * `StripeWebhookController::openNotificationContext()`.
     *
     * @param  mixed  $metadata  a Stripe metadata object, an array, or null
     */
    public static function rememberPaymentMetadata($metadata): void
    {
        try {
            self::$ambientMetadata = self::metadataToArray($metadata);
        } catch (\Throwable $e) {
            self::$ambientMetadata = [];
        }
    }

    public static function forgetPaymentMetadata(): void
    {
        self::$ambientMetadata = [];
    }

    /** @return array<string,mixed> */
    public static function ambientMetadata(): array
    {
        return self::$ambientMetadata;
    }

    /**
     * ⚠️ NEVER `(array)` a Stripe object — that returns its internals
     * (`_values`, `_opts`, …) rather than the metadata keys, which reads as an
     * empty metadata set that silently attributes nothing. Same trap as
     * `StripeControl::capabilitiesMap()`.
     *
     * @return array<string,mixed>
     */
    private static function metadataToArray($metadata): array
    {
        if (is_array($metadata)) {
            return $metadata;
        }

        if (is_object($metadata) && method_exists($metadata, 'toArray')) {
            $array = $metadata->toArray();

            return is_array($array) ? $array : [];
        }

        // A plain stdClass — what `json_decode($metadata)` and the webhook's own
        // `(object)` casts hand around. Safe to cast because it has no internals;
        // the warning above is about Stripe objects specifically.
        if ($metadata instanceof \stdClass) {
            return get_object_vars($metadata);
        }

        return [];
    }

    /**
     * Write the source onto the ledger row and record the purchase event.
     *
     * 🚨 IDEMPOTENT, BY CLAIMING THE ROW. The update only matches a row that is
     * not attributed yet, so the first writer wins and a re-run — a retried
     * webhook, `finance:sync-transactions` half an hour later — changes nothing
     * and adds no second purchase event. An attributed row is never overwritten:
     * last-touch is decided at purchase time, not at replay time.
     */
    private function stamp(FinancialTransaction $transaction, string $source, array $identity): ?string
    {
        if (! empty($transaction->discovery_source)) {
            return null;
        }

        // ⚠️ Written with a targeted update, not save(): FinancialTransaction
        // carries an `updating` guard for the reserve columns, and a full
        // model save on a settled row is the kind of thing that trips it.
        $claimed = FinancialTransaction::whereKey($transaction->getKey())
            ->where(function ($q) {
                $q->whereNull('discovery_source')->orWhere('discovery_source', '');
            })
            ->update([
                'discovery_source' => $source,
                'discovery_class' => DiscoverySources::classFor($source),
            ]);

        if ($claimed === 0) {
            return null;
        }

        // Keep the in-memory model in step, so a caller that goes on to read it
        // (or a second hook on the same instance) sees the row as attributed.
        $transaction->setAttribute('discovery_source', $source);
        $transaction->setAttribute('discovery_class', DiscoverySources::classFor($source));
        $transaction->syncOriginalAttributes(['discovery_source', 'discovery_class']);

        // Belt to the claim's braces: a row stamped by an earlier run whose event
        // write failed must not gain a second purchase row now.
        $alreadyRecorded = DiscoveryEvent::query()
            ->where('financial_transaction_id', $transaction->getKey())
            ->where('event_type', DiscoveryEvent::TYPE_PURCHASE)
            ->exists();

        if ($alreadyRecorded) {
            return $source;
        }

        $creatorId = (int) $transaction->user_id;

        $this->write($creatorId, $source, DiscoveryEvent::TYPE_PURCHASE, $identity, [
            'financial_transaction_id' => $transaction->getKey(),
            'transactable_type' => $transaction->source_type,
            'transactable_id' => $transaction->source_id,
            'value_gbp' => $transaction->gbp_amount ?? $transaction->net_amount,
            'is_new_to_creator' => $this->isNewToCreator($creatorId, $identity, $transaction->getKey()),
        ]);

        return $source;
    }

    /** Record a follow that a Discovery surface produced. */
    public function recordFollow(Request $request, int $creatorId): bool
    {
        try {
            $source = $this->cookieSourceFor($request, $creatorId);

            if ($source === null) {
                return false;
            }

            $identity = $this->identity($request);

            $this->write($creatorId, $source, DiscoveryEvent::TYPE_FOLLOW, $identity, []);

            return true;
        } catch (\Throwable $e) {
            Log::warning('Discovery: recordFollow failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * The cookie value to set after a tagged visit: `{creator_id: source}`.
     *
     * Returned rather than written here because a cookie must be queued onto the
     * RESPONSE, which only the middleware holds.
     *
     * ⚠️ Capped at `MAX_TRACKED_CREATORS`. Without a cap a crawler walking every
     * profile grows this cookie until it exceeds the 4KB header limit, at which
     * point the browser silently drops it and attribution stops for everyone
     * affected. Oldest entries fall off first.
     */
    public const MAX_TRACKED_CREATORS = 20;

    public function withSource(Request $request, int $creatorId, string $source): array
    {
        $map = $this->cookieMap($request);

        // Re-inserting moves it to the end, so the cap evicts genuinely stale
        // creators rather than the one the supporter is looking at right now.
        unset($map[$creatorId]);
        $map[$creatorId] = $source;

        if (count($map) > self::MAX_TRACKED_CREATORS) {
            $map = array_slice($map, -self::MAX_TRACKED_CREATORS, null, true);
        }

        return $map;
    }

    /**
     * The source for this request: an explicit tag on the URL, else whatever the
     * cookie remembers for this creator.
     */
    public function resolveSource(Request $request, int $creatorId): ?string
    {
        $tagged = DiscoverySources::normalise($request->query(DiscoverySources::PARAM));

        return $tagged ?? $this->cookieSourceFor($request, $creatorId);
    }

    public function cookieSourceFor(Request $request, int $creatorId): ?string
    {
        return DiscoverySources::normalise($this->cookieMap($request)[$creatorId] ?? null);
    }

    /** @return array<int,string> creator id => source key */
    private function cookieMap(Request $request): array
    {
        $raw = $request->cookies->get(DiscoverySources::COOKIE);

        if (! is_string($raw) || $raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return [];
        }

        $map = [];

        foreach ($decoded as $creatorId => $source) {
            $key = DiscoverySources::normalise(is_string($source) ? $source : null);

            // A cookie is visitor-controlled input: anything not an integer id
            // pointing at a reserved key is discarded rather than trusted.
            if ($key !== null && ctype_digit((string) $creatorId)) {
                $map[(int) $creatorId] = $key;
            }
        }

        return $map;
    }

    /** @return array{user_id: int|null, visitor_id: string|null} */
    private function identity(Request $request): array
    {
        $visitor = $request->cookies->get(VisitTracker::VISITOR_COOKIE);

        return [
            'user_id' => $request->user()?->id,
            'visitor_id' => is_string($visitor) && $visitor !== '' ? $visitor : null,
        ];
    }

    private function campaign(Request $request): ?string
    {
        $campaign = $request->query('sp_c');

        return is_string($campaign) && $campaign !== ''
            ? substr(strip_tags($campaign), 0, 60)
            : null;
    }

    /**
     * Has this visitor already been counted for this creator today?
     *
     * The published figure is "people discovered your profile", so a person who
     * opens the same profile six times is one, not six.
     */
    private function alreadySeenToday(int $creatorId, array $identity): bool
    {
        return DiscoveryEvent::query()
            ->where('creator_id', $creatorId)
            ->where('event_type', DiscoveryEvent::TYPE_VISIT)
            ->where('occurred_at', '>=', Carbon::now()->startOfDay())
            ->where(function ($q) use ($identity) {
                if ($identity['user_id'] !== null) {
                    $q->orWhere('user_id', $identity['user_id']);
                }
                if ($identity['visitor_id'] !== null) {
                    $q->orWhere('visitor_id', $identity['visitor_id']);
                }
            })
            ->exists();
    }

    /**
     * The brief's definition: no prior follow, support or transaction.
     *
     * ⚠️ A logged-out visitor cannot be checked against follows or purchases —
     * there is no identity to check. They are treated as new, which is correct
     * for the question being asked ("did SP introduce this person to you"): an
     * anonymous browser we have not seen buy from this creator is, as far as
     * anything can tell, someone new.
     *
     * @param  int|null  $exceptTransactionId  the purchase being attributed right
     *                                         now, which must not count as prior
     */
    private function isNewToCreator(int $creatorId, array $identity, ?int $exceptTransactionId = null): bool
    {
        $userId = $identity['user_id'];

        // ⚠️ A guest purchase settled by a webhook has neither identity. Without
        // this the visitor query below becomes `visitor_id IS NULL`, which
        // matches every other anonymous row and reports the first such supporter
        // as new and all the rest as returning — a figure derived from nothing.
        if ($userId === null && $identity['visitor_id'] === null) {
            return true;
        }

        if ($userId === null) {
            return ! DiscoveryEvent::query()
                ->where('creator_id', $creatorId)
                ->where('visitor_id', $identity['visitor_id'])
                ->where('event_type', DiscoveryEvent::TYPE_PURCHASE)
                ->exists();
        }

        $hasFollowed = DB::table('follows')
            ->where('follower_id', $userId)
            ->where('followed_id', $creatorId)
            ->exists();

        if ($hasFollowed) {
            return false;
        }

        $hasBought = FinancialTransaction::query()
            ->where('user_id', $creatorId)
            ->where('supporter_id', $userId)
            ->when($exceptTransactionId !== null, fn ($q) => $q->whereKeyNot($exceptTransactionId))
            ->exists();

        return ! $hasBought;
    }

    private function write(int $creatorId, string $source, string $type, array $identity, array $extra): void
    {
        DiscoveryEvent::create(array_merge([
            'creator_id' => $creatorId,
            'source' => $source,
            'traffic_class' => DiscoverySources::classFor($source),
            'user_id' => $identity['user_id'],
            'visitor_id' => $identity['visitor_id'],
            'event_type' => $type,
            'occurred_at' => Carbon::now(),
        ], $extra));
    }
}
