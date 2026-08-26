<?php

namespace App;

use App\Support\StripeRequirementLabels;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Stripe\Account;
use Stripe\Account\LoginLink;
use Stripe\AccountLink;
use Stripe\Balance;
use Stripe\Checkout\Session;
use Stripe\Collection;
use Stripe\Customer;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\OAuth\InvalidRequestException;
use Stripe\Exception\PermissionException;
use Stripe\Exception\RateLimitException;
use Stripe\PaymentIntent;
use Stripe\Payout;
use Stripe\Price;
use Stripe\Product;
use Stripe\SearchResult;
use Stripe\StripeClient;
use Stripe\Subscription;
use Stripe\Transfer;

class StripeControl
{
    /**
     * Subscription Periods
     *
     * @var array
     */
    public static $periods = [
        'daily' => 'day',
        'weekly' => 'week',
        'monthly' => 'month',
        'yearly' => 'year',
    ];

    /**
     * Stripe Clients
     *
     * @var StripeClient
     */
    private static $client;

    private static $clientUs;

    /**
     * Check and set as well as return the client
     *
     * @return void
     */
    public static function setClient()
    {
        try {
            if (empty(self::$client)) {
                $apiKey = config('services.stripe.secret');

                if (empty($apiKey) || ! is_string($apiKey)) {
                    Log::error('Stripe UK API key configuration issue');
                    throw new Exception('Stripe UK API key is not properly configured.');
                }

                self::$client = new StripeClient($apiKey);
            }

            if (empty(self::$clientUs)) {
                $apiKeyUs = config('services.stripe.secret_us') ?? config('services.stripe.secret');

                if (empty($apiKeyUs) || ! is_string($apiKeyUs)) {
                    Log::error('Stripe US API key configuration issue');
                    // Fallback to UK client if US key is missing
                    self::$clientUs = self::$client;
                } else {
                    self::$clientUs = new StripeClient($apiKeyUs);
                }
            }
        } catch (Exception $e) {
            throw new Exception('Stripe Initialization Error: '.$e->getMessage());
        }
    }

    /**
     * Get the appropriate client based on currency
     */
    public static function getClientForCurrency(?string $currency = 'GBP'): StripeClient
    {
        self::setClient();
        $currency = strtoupper($currency ?? 'GBP');

        if ($currency === 'USD') {
            return self::$clientUs;
        }

        return self::$client;
    }

    /**
     * Get the appropriate client based on account ID
     * (Currently defaults to currency-based logic or manual override)
     */
    public static function getClientForAccount(?string $accountId = null): StripeClient
    {
        self::setClient();

        return self::$client;
    }

    public static function getClient()
    {
        self::setClient();

        return self::$client;
    }

    /**
     * Create a Customer
     *
     * @param  array  $payload  User Payload
     * @return throwable||\Stripe\Customer
     */
    public static function createCustomer(array $payload, string $connectedAccountId)
    {
        self::setClient();
        try {
            if (! $connectedAccountId) {
                // If no connected account ID is provided, create the customer directly
                return self::$client->customers->create($payload);
            }

            return self::$client->customers->create(
                $payload,
                ['stripe_account' => $connectedAccountId]
            );
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Fetch a platform customer.
     *
     * Returns null when the customer does not exist on this Stripe account; a
     * returned object may still carry deleted=true, which Checkout rejects.
     *
     * @param  string  $customer_id  Stripe Customer Id
     * @return Customer|null
     */
    /**
     * Point a customer at the card their subscriptions should collect against.
     *
     * Needed only by the setup-mode flow: when Checkout creates the subscription
     * itself Stripe attaches the card, but a card saved by a SetupIntent is not
     * anyone's default until it is made one.
     *
     * @return Throwable|Customer
     */
    public static function setDefaultPaymentMethod(string $customerId, string $paymentMethodId)
    {
        self::setClient();
        try {
            return self::$client->customers->update($customerId, [
                'invoice_settings' => ['default_payment_method' => $paymentMethodId],
            ]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function retrieveCustomer($customer_id)
    {
        self::setClient();
        try {
            return self::$client->customers->retrieve($customer_id, []);
        } catch (InvalidRequestException $e) {
            return null;
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Delete an Account
     *
     * @param  string  $account_id  Stripe Account Id
     * @return mixed
     */
    public static function deleteAccount($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->delete($account_id, []);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Everything needed to check that a creator actually received the listed
     * price: what was charged, what Stripe really took, what the platform took,
     * and which fee profile the supporter price was built from.
     *
     * One retrieve instead of several, because the caller walks a whole window
     * of payments. Returns null when the charge cannot be read — never a zeroed
     * array, which a caller would mistake for "Stripe took nothing".
     *
     * @return array{amount_minor:int,fee_minor:int,application_fee_minor:int,fee_profile:string,currency:string}|null
     */
    public static function getChargeFactsForPaymentIntent(string $paymentIntentId, ?string $connectedAccountId = null): ?array
    {
        self::setClient();

        try {
            $opts = [];
            if (! empty($connectedAccountId)) {
                $opts['stripe_account'] = $connectedAccountId;
            }

            $pi = self::$client->paymentIntents->retrieve(
                $paymentIntentId,
                ['expand' => ['charges.data.balance_transaction']],
                $opts
            );

            $charge = $pi->charges->data[0] ?? null;

            if (! $charge) {
                return null;
            }

            $balanceTx = $charge->balance_transaction ?? null;

            if (is_string($balanceTx)) {
                $balanceTx = self::$client->balanceTransactions->retrieve($balanceTx, [], $opts);
            }

            if (! $balanceTx || ! isset($balanceTx->fee)) {
                return null;
            }

            // The profile is recorded on the intent's metadata at checkout, and
            // is the only reliable statement of which rates produced this
            // supporter price — the risk-ledger `payments` table has no such
            // column, so assuming "card" would silently mis-check every bank
            // payment.
            $profile = (string) ($pi->metadata->fee_profile ?? $charge->metadata->fee_profile ?? 'card');

            return [
                'amount_minor' => (int) ($charge->amount ?? 0),
                'fee_minor' => (int) $balanceTx->fee,
                'application_fee_minor' => (int) ($pi->application_fee_amount ?? 0),
                'fee_profile' => $profile !== '' ? $profile : 'card',
                'currency' => strtoupper((string) ($charge->currency ?? 'gbp')),
            ];
        } catch (\Throwable $e) {
            Log::error('Failed to fetch charge facts for payment intent', [
                'payment_intent_id' => $paymentIntentId,
                'connected_account_id' => $connectedAccountId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public static function getStripeFeeMinorForPaymentIntent(string $paymentIntentId, ?string $connectedAccountId = null): int
    {
        self::setClient();
        try {
            $params = [
                'expand' => ['charges.data.balance_transaction'],
            ];
            $opts = [];
            if (! empty($connectedAccountId)) {
                $opts['stripe_account'] = $connectedAccountId;
            }

            $pi = self::$client->paymentIntents->retrieve($paymentIntentId, $params, $opts);
            $charge = $pi->charges->data[0] ?? null;
            if (! $charge) {
                return 0;
            }

            $balanceTx = $charge->balance_transaction ?? null;
            if (! $balanceTx) {
                return 0;
            }

            if (is_string($balanceTx)) {
                $balanceTx = self::$client->balanceTransactions->retrieve($balanceTx, [], $opts);
            }

            $fee = $balanceTx->fee ?? 0;

            return is_numeric($fee) ? (int) $fee : 0;
        } catch (\Throwable $e) {
            Log::error('Failed to fetch Stripe fee for payment intent', [
                'payment_intent_id' => $paymentIntentId,
                'connected_account_id' => $connectedAccountId,
                'error' => $e->getMessage(),
            ]);

            return 0;
        }
    }

    /**
     * Check if connected account has card_payments capability active
     * This determines whether the account can accept direct charges
     *
     * @param  string|null  $accountId  Stripe Connected Account ID
     * @return bool True if account can accept direct charges, false otherwise
     */
    public static function hasCardPaymentsCapability(?string $accountId): bool
    {
        // Nullable + fail closed: listings created before creators were gated on
        // account_id still exist, and a TypeError here surfaced to the supporter
        // as a 500 rather than a "creator isn't set up for payments" message.
        if (empty($accountId)) {
            Log::warning('Card capability check skipped — creator has no connected account');

            return false;
        }

        // Use cache to avoid repeated API calls for the same account
        // Removed caching to ensure real-time accuracy for critical payment capability checks
        // $cacheKey = "stripe_card_payments_capability_{$accountId}";

        // return \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($accountId) {
        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);
            $hasCardPayments = ($account->capabilities->card_payments ?? null) === 'active';

            Log::info('Stripe capability check completed', [
                'account_id' => $accountId,
                'card_payments_capability' => $account->capabilities->card_payments ?? 'missing',
                'has_card_payments' => $hasCardPayments,
                'service_agreement' => $account->tos_acceptance->service_agreement ?? 'unknown',
            ]);

            return $hasCardPayments;
        } catch (Exception $e) {
            Log::error('Failed to check card_payments capability: '.$e->getMessage(), [
                'account_id' => $accountId,
            ]);

            // Default to true to maintain existing behavior for API failures
            return true;
        }
        // });
    }

    /**
     * Bank capabilities a connected account can hold, by account country.
     * Requesting one the account isn't eligible for makes Stripe error, so this
     * is the allow-list used at onboarding and by the backfill command.
     */
    public static function bankCapabilitiesForCountry(?string $country): array
    {
        $country = strtoupper((string) $country);

        // Pay by Bank (open banking) — Stripe supports UK/FI, plus FR/DE.
        $payByBank = ['GB', 'FI', 'FR', 'DE'];
        // SEPA Direct Debit — Eurozone/SEPA scheme.
        $sepa = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'];

        $caps = [];
        if (in_array($country, $payByBank, true)) {
            $caps[] = 'pay_by_bank_payments';
        }
        if (in_array($country, $sepa, true)) {
            $caps[] = 'sepa_debit_payments';
        }
        if ($country === 'US') {
            $caps[] = 'us_bank_account_ach_payments';
        }

        return $caps;
    }

    /**
     * Normalise a Stripe account's capabilities to a plain [name => status] map.
     * A raw `(array)` cast on a StripeObject yields its internal properties
     * (_values, _opts, …), not the capability names — so always go through
     * toArray() when it's available.
     */
    public static function capabilitiesMap($account): array
    {
        $caps = $account->capabilities ?? null;

        if ($caps === null) {
            return [];
        }

        if (is_object($caps) && method_exists($caps, 'toArray')) {
            return $caps->toArray();
        }

        return is_array($caps) ? $caps : [];
    }

    /**
     * Request the bank payment capabilities this account's country supports.
     * Stripe's dashboard "on by default" only covers accounts with Dashboard
     * access, so Express/Custom connected accounts must have these requested
     * explicitly — otherwise checkout refuses bank with
     * "not available for this creator yet".
     *
     * Each capability is requested independently so one ineligible/errored
     * capability doesn't block the others. Returns the ones now requested.
     */
    public static function requestBankCapabilities(string $accountId, ?string $country = null): array
    {
        self::setClient();

        if ($country === null) {
            try {
                $country = self::$client->accounts->retrieve($accountId)->country ?? null;
            } catch (\Throwable $e) {
                Log::error('requestBankCapabilities: could not retrieve account', [
                    'account_id' => $accountId,
                    'error' => $e->getMessage(),
                ]);

                return [];
            }
        }

        $granted = [];
        foreach (self::bankCapabilitiesForCountry($country) as $capability) {
            try {
                self::$client->accounts->updateCapability($accountId, $capability, ['requested' => true]);
                $granted[] = $capability;
            } catch (\Throwable $e) {
                Log::warning('requestBankCapabilities: capability not requestable', [
                    'account_id' => $accountId,
                    'capability' => $capability,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $granted;
    }

    /**
     * Generic connected-account capability check for bank payment methods.
     * $capabilities e.g. ['pay_by_bank_payments', 'sepa_debit_payments'].
     * Returns the subset of Stripe payment_method_types whose capability is
     * active on the account (fails open like hasCardPaymentsCapability).
     */
    public static function activeBankMethodTypes(string $accountId, array $methodTypes): array
    {
        if (empty($methodTypes)) {
            return [];
        }

        $capabilityMap = [
            'pay_by_bank' => 'pay_by_bank_payments',
            'sepa_debit' => 'sepa_debit_payments',
            'us_bank_account' => 'us_bank_account_ach_payments',
        ];

        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);

            return array_values(array_filter($methodTypes, function ($type) use ($account, $capabilityMap) {
                $capability = $capabilityMap[$type] ?? null;

                return $capability && ($account->capabilities->{$capability} ?? null) === 'active';
            }));
        } catch (Exception $e) {
            Log::error('Failed to check bank payment capabilities: '.$e->getMessage(), [
                'account_id' => $accountId,
            ]);

            // Fail CLOSED: unlike the card check (where card is the baseline and
            // Stripe would reject at create time), assuming an unconfirmed bank
            // capability produces a session Stripe refuses — a broken checkout
            // for the supporter. Returning none falls back to the card path.
            return [];
        }
    }

    public static function hasTransfersCapability(string $accountId): bool
    {
        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);

            return ($account->capabilities->transfers ?? null) === 'active';
        } catch (Exception $e) {
            Log::error('Failed to check transfers capability: '.$e->getMessage(), [
                'account_id' => $accountId,
            ]);

            return true;
        }
    }

    // ✅   Add a check in your class to validate capabilities
    public static function isAccountReadyForCheckout(string $accountId): bool
    {
        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);
            $agreement = $account->tos_acceptance->service_agreement ?? 'full';

            // For recipient service agreement, only transfers capability is required
            // if ($agreement === 'recipient') {
            //    return ($account->capabilities->transfers ?? null) === 'active';
            // }

            // For full service agreement, both card_payments and transfers must be active
            return ($account->capabilities->card_payments ?? null) === 'active'
                && ($account->capabilities->transfers ?? null) === 'active';
        } catch (Exception $e) {
            Log::error('Failed to verify account capabilities: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Stripe `disabled_reason` values the creator cannot fix by filling a form.
     * These must NEVER be collapsed into "finish your setup" and must never be
     * given an onboarding button — sending a rejected creator back through
     * onboarding is a loop that cannot terminate.
     */
    private const TERMINAL_DISABLED_REASONS = [
        'rejected',
        'rejected.fraud',
        'rejected.listed',
        'rejected.terms_of_service',
        'rejected.incomplete_verification',
        'rejected.platform_fraud',
        'rejected.platform_terms_of_service',
        'rejected.platform_other',
        'rejected.other',
        'listed',
        'platform_paused',
    ];

    /** Wording per terminal reason — the creator is told what happened, not a code. */
    private const TERMINAL_COPY = [
        'rejected.fraud' => 'Stripe has closed your payment account after a fraud review.',
        'rejected.listed' => 'Stripe has closed your payment account because it matched an entry on a sanctions or restricted list.',
        'rejected.terms_of_service' => 'Stripe has closed your payment account for a breach of its terms of service.',
        'rejected.incomplete_verification' => 'Stripe has closed your payment account because verification could not be completed in time.',
        'listed' => 'Your payment account is on hold because it matched an entry on a restricted list.',
        'platform_paused' => 'Your payment account has been paused.',
    ];

    /**
     * Get comprehensive Stripe account requirements and action items.
     *
     * The contract every caller relies on: **if Stripe wants something, it
     * appears here.** Creators do not open the Stripe dashboard — this panel is
     * the only place most of them will ever see a requirement, so nothing may be
     * silently dropped. What changed is the SHAPE, not the coverage: one primary
     * card describing the actual state, plus only those extra cards that say
     * something genuinely different (payouts blocked while charges work, a
     * document Stripe rejected, a deadline).
     *
     * @param  string  $accountId  Stripe Account ID
     * @return array Account requirements analysis
     */
    public static function getAccountRequirements(string $accountId): array
    {
        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);

            return self::accountRequirementsFrom($account);
        } catch (Exception $e) {
            Log::error('Failed to get account requirements: '.$e->getMessage());

            // A read failure is NOT "nothing to do" — it is an unknown state, and
            // saying nothing would hide a real requirement behind a transient
            // outage. Report it as its own state so the dashboard can keep the
            // creator's other routes into Stripe available.
            return [
                'has_requirements' => true,
                'requirements' => [[
                    'type' => 'connection_error',
                    'severity' => 'warning',
                    'title' => 'We could not check your payment account',
                    'message' => 'We could not reach Stripe just now, so we cannot tell you whether anything needs your attention. This is usually temporary.',
                    'action' => 'Refresh the page in a few minutes. If it keeps happening, contact support.',
                    'action_url' => null,
                    'contact_support' => true,
                ]],
                'account_status' => [],
            ];
        }
    }

    /**
     * The same payload as `getAccountRequirements()`, built from an account that
     * has ALREADY been retrieved.
     *
     * ⚠️ Exists so a caller needing several facts about one account pays for one
     * `accounts->retrieve` rather than one per fact. The creator's dashboard used
     * to make four sequential retrieves of the same account — capabilities,
     * migration need, requirements and a bare status read — every time its
     * five-minute cache lapsed, with the page render waiting on all four.
     * `App\Services\Stripe\StripeAccountState` is the caller that folds them.
     *
     * Pure mapper: no client, no network.
     *
     * @param  Account  $account
     */
    public static function accountRequirementsFrom($account): array
    {
        $requirements = self::buildAccountRequirements($account);

        return [
            'has_requirements' => $requirements !== [],
            'requirements' => $requirements,
            'account_status' => [
                'charges_enabled' => (bool) ($account->charges_enabled ?? false),
                'details_submitted' => (bool) ($account->details_submitted ?? false),
                'payouts_enabled' => (bool) ($account->payouts_enabled ?? false),
                'disabled_reason' => $account->requirements->disabled_reason ?? null,
                'deadline' => self::deadlineIso($account),
            ],
        ];
    }

    /**
     * Can this connected account take a card payment right now?
     *
     * Object-taking twin of `isAccountReadyForCheckout()`, for the same
     * one-retrieve reason as `accountRequirementsFrom()`.
     *
     * @param  Account  $account
     */
    public static function accountReadyForCheckoutFrom($account): bool
    {
        return ($account->capabilities->card_payments ?? null) === 'active'
            && ($account->capabilities->transfers ?? null) === 'active';
    }

    /**
     * Decide which cards describe this account, most severe first.
     *
     * Public because it is a pure mapper over an already-retrieved account —
     * no client, no network — which is what makes every state below testable
     * without standing up Stripe. Application code should call
     * `getAccountRequirements()`.
     *
     * @param  Account  $account
     * @return array<int, array<string, mixed>>
     */
    public static function buildAccountRequirements($account): array
    {
        $reqs = $account->requirements ?? null;

        $disabledReason = $reqs->disabled_reason ?? null;
        $pastDue = $reqs->past_due ?? [];
        $currentlyDue = $reqs->currently_due ?? [];
        $eventuallyDue = $reqs->eventually_due ?? [];
        $pendingVerification = $reqs->pending_verification ?? [];
        $stripeErrors = $reqs->errors ?? [];

        $detailsSubmitted = (bool) ($account->details_submitted ?? false);
        $chargesEnabled = (bool) ($account->charges_enabled ?? false);
        $payoutsEnabled = (bool) ($account->payouts_enabled ?? false);
        $deadline = self::deadlineIso($account);

        // ── 1. Terminal ─────────────────────────────────────────────────────
        // Nothing else matters and nothing else is actionable. Returned alone,
        // with no onboarding link, so the creator is not sent round a loop.
        if ($disabledReason !== null && in_array($disabledReason, self::TERMINAL_DISABLED_REASONS, true)) {
            return [[
                'type' => 'account_rejected',
                'severity' => 'critical',
                'title' => 'Your payment account is closed',
                'message' => (self::TERMINAL_COPY[$disabledReason] ?? 'Your payment account has been closed or restricted by Stripe.')
                    .' You cannot take payments or receive payouts. Our support team can tell you what your options are.',
                'action' => 'Contact support — this cannot be fixed from the setup form.',
                'action_url' => null,
                'contact_support' => true,
                'reason_code' => $disabledReason,
            ]];
        }

        // ── 2. Stripe is reviewing ──────────────────────────────────────────
        // There is genuinely nothing for the creator to do. Saying "action
        // required" here trains people to ignore the panel.
        if (in_array($disabledReason, ['requirements.pending_verification', 'under_review'], true)) {
            return [[
                'type' => 'pending_verification',
                'severity' => 'info',
                'title' => 'Stripe is reviewing your details',
                'message' => 'Your information has been submitted and Stripe is checking it. This usually takes 1–3 business days. Payments switch on automatically once it passes — there is nothing for you to do.',
                'action' => 'Nothing right now. We will email you when this changes.',
                'action_url' => null,
                'fields_needed' => StripeRequirementLabels::humanise($pendingVerification),
            ]];
        }

        $cards = [];

        // ── 3. The one primary blocking card ────────────────────────────────
        // Exactly one of these applies. Before this they could all fire at once
        // (past_due + currently_due + card_payments inactive + transfers
        // inactive), producing four panels and one root cause.
        if (! $detailsSubmitted) {
            $cards[] = [
                'type' => 'onboarding_incomplete',
                'severity' => 'critical',
                'title' => 'Finish your Stripe setup',
                'message' => 'Your payment account was created but the setup form was never completed, so you cannot take payments or receive payouts yet. It takes a few minutes and you can stop and come back.',
                'action' => 'Complete your Stripe setup.',
                'action_url' => '/stripe/enable_card_payments',
                'action_label' => 'Finish setup',
                'fields_needed' => StripeRequirementLabels::humanise(
                    array_merge($pastDue, $currentlyDue, $eventuallyDue)
                ),
                'deadline' => $deadline,
            ];
        } elseif (! $chargesEnabled) {
            $cards[] = [
                'type' => 'information_required',
                'severity' => 'critical',
                'title' => 'Stripe needs more information',
                'message' => 'You cannot take payments until Stripe has the information below. You have already started — this is what is still missing.',
                'action' => 'Add the missing information.',
                'action_url' => '/stripe/enable_card_payments',
                'action_label' => 'Add information',
                'fields_needed' => StripeRequirementLabels::humanise(
                    array_merge($pastDue, $currentlyDue)
                ),
                'deadline' => $deadline,
            ];
        } elseif ($pastDue !== [] || $currentlyDue !== []) {
            // Charges still work, but Stripe is asking. Ignore it and they stop.
            $cards[] = [
                'type' => 'information_required_soon',
                'severity' => 'high',
                'title' => 'Stripe needs more information to keep your payments on',
                'message' => 'Your payments are still working, but Stripe has asked for the information below. If it is not provided, payments and payouts will be switched off.',
                'action' => 'Add the missing information.',
                'action_url' => '/stripe/enable_card_payments',
                'action_label' => 'Add information',
                'fields_needed' => StripeRequirementLabels::humanise(
                    array_merge($pastDue, $currentlyDue)
                ),
                'deadline' => $deadline,
            ];
        }

        // ── 4. Money in, but not out ────────────────────────────────────────
        // A genuinely different fact from anything above: sales are landing and
        // the creator cannot withdraw. Only shown when charges DO work —
        // otherwise the primary card already covers it.
        if ($chargesEnabled && ! $payoutsEnabled) {
            $cards[] = [
                'type' => 'payouts_disabled',
                'severity' => 'high',
                'title' => 'Your payouts are on hold',
                'message' => 'You can take payments, but your earnings cannot be paid out yet. This is usually a missing or unverified bank account.',
                'action' => 'Add or confirm your bank details.',
                'action_url' => '/stripe/enable_card_payments',
                'action_label' => 'Fix payouts',
                'deadline' => $deadline,
            ];
        }

        // ── 5. Something the creator sent was rejected ──────────────────────
        // `requirements.errors` is where Stripe says WHY — "the document is
        // unreadable", "the name does not match". Nothing surfaced it before, so
        // a creator re-uploaded the same unreadable passport indefinitely.
        $errorMessages = self::requirementErrorMessages($stripeErrors);
        if ($errorMessages !== []) {
            $cards[] = [
                'type' => 'requirement_errors',
                'severity' => 'high',
                'title' => 'Something you sent could not be accepted',
                'message' => 'Stripe could not accept part of what you submitted. Fixing the points below is what unblocks your account.',
                'action' => 'Resubmit the details below.',
                'action_url' => '/stripe/enable_card_payments',
                'action_label' => 'Fix and resubmit',
                'fields_needed' => $errorMessages,
            ];
        }

        // ── 6. Nothing blocking, but Stripe is still checking ───────────────
        if ($cards === [] && $pendingVerification !== []) {
            $cards[] = [
                'type' => 'verification_in_progress',
                'severity' => 'info',
                'title' => 'Stripe is still checking some details',
                'message' => 'Your account is working. Stripe is verifying the details below in the background — there is nothing for you to do.',
                'action' => 'Nothing right now.',
                'action_url' => null,
                'fields_needed' => StripeRequirementLabels::humanise($pendingVerification),
            ];
        }

        // ── 7. Will be needed later ─────────────────────────────────────────
        // Only fields not already named above, and only when nothing urgent is
        // on screen — a "soon" card stacked under a "now" card is noise.
        $eventuallyOnly = array_values(array_diff(
            $eventuallyDue,
            $currentlyDue,
            $pastDue
        ));
        if ($cards === [] && $eventuallyOnly !== []) {
            $cards[] = [
                'type' => 'eventually_due',
                'severity' => 'medium',
                'title' => 'Stripe will need this later',
                'message' => 'Nothing is blocked today. Stripe will ask for the information below at some point — adding it now avoids an interruption later.',
                'action' => 'Add it when convenient.',
                'action_url' => '/stripe/enable_card_payments',
                'action_label' => 'Add now',
                'fields_needed' => StripeRequirementLabels::humanise($eventuallyOnly),
                'deadline' => $deadline,
            ];
        }

        // ── 8. A capability Stripe is still switching on ────────────────────
        // Informational only, and only when the account is otherwise clean —
        // this is the state right after a successful submission.
        if ($cards === [] && ($account->capabilities->card_payments ?? null) === 'pending') {
            $cards[] = [
                'type' => 'card_payments_pending',
                'severity' => 'info',
                'title' => 'Card payments are being switched on',
                'message' => 'Stripe is enabling card payments on your account. This normally completes on its own within a day.',
                'action' => 'Nothing right now.',
                'action_url' => null,
            ];
        }

        return $cards;
    }

    /**
     * Stripe's own explanation of what it rejected, deduplicated.
     *
     * Each entry carries `requirement`, `code` and `reason`; `reason` is written
     * for the account holder, so it is shown as-is rather than re-worded into
     * something less specific.
     *
     * @param  mixed  $errors
     * @return array<int, string>
     */
    private static function requirementErrorMessages($errors): array
    {
        $messages = [];

        foreach ((array) $errors as $error) {
            $reason = is_object($error) ? ($error->reason ?? null) : ($error['reason'] ?? null);

            if (! is_string($reason) || trim($reason) === '') {
                continue;
            }

            $reason = trim($reason);
            if (! in_array($reason, $messages, true)) {
                $messages[] = $reason;
            }
        }

        return $messages;
    }

    /**
     * Stripe's `current_deadline` as an ISO string the frontend can format.
     *
     * This is the date payments are switched off if the requirement is ignored,
     * and it was never surfaced anywhere — a creator who does not open the
     * Stripe dashboard had no way to know one existed.
     *
     * @param  Account  $account
     */
    private static function deadlineIso($account): ?string
    {
        $deadline = $account->requirements->current_deadline ?? null;

        if (empty($deadline) || ! is_numeric($deadline)) {
            return null;
        }

        return Carbon::createFromTimestampUTC((int) $deadline)->toIso8601String();
    }

    /**
     * Search Customer
     *
     * @param  string  $query  Query like name, email
     * @return SearchResult
     */
    /**
     * Search Customer across both UK and US accounts
     *
     * @param  string  $query  Query like name, email
     * @return array Array of customers from both accounts
     */
    public static function searchCustomerAcrossAccounts($email)
    {
        self::setClient();
        $results = [];
        $query = "email:'".$email."'";

        try {
            // 1. Search UK
            $searchUk = self::$client->customers->search(['query' => $query]);
            foreach ($searchUk->data as $customer) {
                $customer->account_region = 'UK';
                $results[] = $customer;
            }
        } catch (Exception $e) {
            Log::warning('Stripe UK search failed: '.$e->getMessage());
        }

        try {
            // 2. Search US
            if (self::$clientUs !== self::$client) {
                $searchUs = self::$clientUs->customers->search(['query' => $query]);
                foreach ($searchUs->data as $customer) {
                    $customer->account_region = 'US';
                    $results[] = $customer;
                }
            }
        } catch (Exception $e) {
            Log::warning('Stripe US search failed: '.$e->getMessage());
        }

        return $results;
    }

    public static function searchCustomer($query)
    {
        self::setClient();
        try {
            return self::$client->customers->search([
                'query' => $query,
            ]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create Account
     *
     * @param  array  $payload  Account Payload
     * @param  string|null  $idempotencyKey  Retry-safe key — a repeat call with the
     *                                       same key returns the original account
     *                                       instead of creating a second one.
     * @return Account|Throwable
     */
    public static function createAccount($payload, ?string $idempotencyKey = null)
    {
        self::setClient();
        try {
            // Force manual payout schedule for all created accounts
            if (! isset($payload['settings'])) {
                $payload['settings'] = [];
            }
            if (! isset($payload['settings']['payouts'])) {
                $payload['settings']['payouts'] = [];
            }
            if (! isset($payload['settings']['payouts']['schedule'])) {
                $payload['settings']['payouts']['schedule'] = [];
            }
            $payload['settings']['payouts']['schedule']['interval'] = 'manual';

            return self::$client->accounts->create(
                $payload,
                $idempotencyKey ? ['idempotency_key' => $idempotencyKey] : []
            );
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            // A reused idempotency key with changed parameters is OUR bug, not
            // the creator's, and Stripe's own wording ("Try using a key other
            // than …") is addressed to a developer. Surfacing it verbatim on a
            // connect screen tells the creator nothing they can act on and
            // reads as though their account is broken. Callers must derive the
            // key from the payload — see initConnect.
            if (str_contains($e->getMessage(), 'idempotent')) {
                Log::error('Stripe idempotency key reused with different parameters', [
                    'idempotency_key' => $idempotencyKey,
                    'error' => $e->getMessage(),
                ]);

                throw new Exception('We could not set up your payment account just now. Please try again in a moment — if it keeps happening, contact support.');
            }

            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Retrive an Account
     *
     * @param  string  $account_id  Stripe Account Id
     * @return Throwable|Account
     */
    public static function getAccount($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->retrieve($account_id, []);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Update a connected account.
     *
     * @param  string  $account_id  Connected account ID
     * @param  array  $payload  Fields to update
     * @return Throwable|Account
     */
    public static function updateAccount($account_id, array $payload)
    {
        self::setClient();
        try {
            return self::$client->accounts->update($account_id, $payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create Account Link
     *
     * @param  array  $payload  Account Link Payload
     * @return Throwable|AccountLink
     */
    public static function createAccountLink($payload)
    {
        self::setClient();
        try {
            return self::$client->accountLinks->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create Express Account Link
     *
     * @param  string  $account_id  Stripe Express Account Id
     * @return Throwable|LoginLink
     */
    public static function getLoginLink($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->createLoginLink($account_id);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Build a merchant-of-record statement descriptor for a creator.
     *
     * Produces "<USERNAME> CONTENT" within Stripe's 22-char limit, always preserving the
     * " CONTENT" marker so the charge reads as a content purchase, never a person-to-person
     * transfer or a platform/gift charge. Strips characters Stripe disallows.
     *
     * @param  string  $username  Creator username (or display name)
     */
    public static function buildContentDescriptor($username): string
    {
        $marker = ' CONTENT';
        // Stripe disallows < > \ ' " * in descriptors; keep alnum, space, underscore, dot, hyphen.
        $clean = preg_replace('/[^A-Za-z0-9 _.\-]/', '', (string) $username);
        $clean = trim(strtoupper($clean));

        $maxName = 22 - strlen($marker); // reserve room for the marker
        if (strlen($clean) > $maxName) {
            $clean = rtrim(substr($clean, 0, $maxName));
        }
        if ($clean === '') {
            $clean = 'CREATOR';
        }

        return substr($clean.$marker, 0, 22);
    }

    /**
     * Set a connected account's default statement descriptor to "<USERNAME> CONTENT"
     * and its public business name to the creator. Covers recurring (subscription)
     * charges whose descriptor can't be set per-charge. Best-effort, single source
     * of truth for both the on-page connect flow and the account.updated webhook
     * (async approvals never touch the connect flow). Never throws.
     */
    public static function applyContentDescriptorToConnectedAccount(?string $accountId, ?string $username, ?string $displayName = null): void
    {
        if (empty($accountId) || empty($username)) {
            return;
        }

        try {
            self::updateAccount($accountId, [
                'settings' => [
                    'payments' => [
                        'statement_descriptor' => self::buildContentDescriptor($username),
                    ],
                ],
                'business_profile' => [
                    'name' => $displayName ?: $username,
                ],
            ]);
        } catch (Exception $e) {
            Log::warning('Failed to set content statement descriptor on connected account', [
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Create Payment Intent
     *
     * @param  array  $payload  Payment Payload
     * @param  string|null  $connectedAccountId  Connected Account ID
     * @param  bool  $force3DS  Whether to force 3D Secure
     * @param  string|null  $creatorUsername  The username of the creator to use in statement descriptor
     * @return Throwable|PaymentIntent
     */
    public static function createPaymentIntent(array $payload, $connectedAccountId = null, bool $force3DS = false, $creatorUsername = null)
    {
        self::setClient();

        if ($force3DS) {
            $payload['payment_method_options']['card']['request_three_d_secure'] = 'any';
        }

        if ($creatorUsername) {
            // Merchant-of-record: descriptor reads as a content purchase in the creator's name
            // (e.g. "JUSTJACK99 CONTENT"), never a platform/gift marker.
            $payload['statement_descriptor'] = self::buildContentDescriptor($creatorUsername);
        }

        try {
            if ($connectedAccountId) {
                // Set the Stripe Account context
                return self::$client->paymentIntents->create(
                    $payload,
                    ['stripe_account' => $connectedAccountId]
                );
            }

            return self::$client->paymentIntents->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create Payment Session
     *
     * @param  array  $payload  Payment Payload
     * @param  string|null  $connectedAccountId  Connected Account ID
     * @param  bool  $force3DS  Whether to force 3D Secure
     * @param  string|null  $creatorUsername  The username of the creator to use in statement descriptor
     * @return Throwable|Session
     */
    public static function createCheckoutSession(array $payload, $connectedAccountId = null, bool $force3DS = false, $creatorUsername = null)
    {
        self::setClient();

        if ($force3DS) {
            $payload['payment_method_options']['card']['request_three_d_secure'] = 'any';
        }

        if ($creatorUsername) {
            $descriptor = self::buildContentDescriptor($creatorUsername);

            // For one-time payments (mode: payment)
            if (isset($payload['mode']) && $payload['mode'] === 'payment') {
                if (! isset($payload['payment_intent_data'])) {
                    $payload['payment_intent_data'] = [];
                }
                $payload['payment_intent_data']['statement_descriptor'] = $descriptor;
            }
            // For subscriptions (mode: subscription)
            elseif (isset($payload['mode']) && $payload['mode'] === 'subscription') {
                // subscription_data does not support statement_descriptor in the Checkout Session API.
                // Recurring charges fall back to the connected account's default descriptor, which we set
                // to the same "USERNAME CONTENT" value at Connect onboarding (see StripeController).
            }
        }

        try {
            if ($connectedAccountId) {
                // Set the Stripe Account context
                return self::$client->checkout->sessions->create(
                    $payload,
                    ['stripe_account' => $connectedAccountId]
                );
            }

            return self::$client->checkout->sessions->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Get A CheckOut Session
     *
     * @param  string  $sessionId  Stripe Session Checkout Id
     * @return Throwable|Session
     */
    public static function getCheckoutSession($sessionId, $connectedAccountId = null)
    {
        self::setClient();

        if ($connectedAccountId) {
            // Set the Stripe Account context
            return self::$client->checkout->sessions->retrieve(
                $sessionId,
                [],
                ['stripe_account' => $connectedAccountId]
            );
        }
        try {
            return self::$client->checkout->sessions->retrieve($sessionId);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Get Active subscription of customer
     */
    public static function getActiveSubscriptionByCustomer($customerId, $connectedAccountId = null)
    {
        self::setClient();

        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            // 1. Check UK Account (Default)
            $subscriptions = self::$client->subscriptions->all(
                [
                    'customer' => $customerId,
                    'limit' => 1,
                ],
                $options
            );

            if ($subscriptions->data && count($subscriptions->data) > 0) {
                return $subscriptions->data[0];
            }

            // 2. Check US Account if no connected account is specified (Platform Sub)
            if (! $connectedAccountId && self::$clientUs !== self::$client) {
                $subscriptionsUs = self::$clientUs->subscriptions->all(
                    [
                        'customer' => $customerId,
                        'limit' => 1,
                    ],
                    $options
                );

                if ($subscriptionsUs->data && count($subscriptionsUs->data) > 0) {
                    return $subscriptionsUs->data[0];
                }
            }

            return null;
        } catch (Exception $e) {
            Log::error('Stripe fetch subscription error: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Create a Stripe Product
     *
     * @param  array  $payload  Product Payload
     * @return Throwable|Product
     */
    public static function createProduct(array $payload, string $connectedAccountId)
    {
        self::setClient();
        try {
            return self::$client->products->create(
                $payload,
                ['stripe_account' => $connectedAccountId]
            );
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            Log::info('Stripe API Error: '.$e->getMessage());
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create a Stripe Price
     *
     * @param  array  $payload  Price Payload
     * @return Throwable|Price
     */
    public static function createPrice(array $priceData, mixed $connectedAccountId = null)
    {
        self::setClient();

        if (! $connectedAccountId) {
            return self::$client->prices->create($priceData);
        }

        return self::$client->prices->create(
            $priceData,
            ['stripe_account' => $connectedAccountId]
        );
    }

    /**
     * Create a Stripe Price
     *
     * @param  array  $payload  Price Payload
     * @return Throwable|Price
     */
    public static function getProduct(?string $productId, ?string $connectedAccountId = null)
    {
        // Return null if productId is null or empty
        if (empty($productId)) {
            return null;
        }

        self::setClient();
        $options = [];
        if ($connectedAccountId) {
            $options['stripe_account'] = $connectedAccountId;
        }

        return self::$client->products->retrieve(
            $productId,
            [],
            $options
        );
    }

    /**
     * Create a Stripe Price
     *
     * @param  array  $payload  Price Payload
     * @return Throwable|Price
     */
    public static function createSubscription(array $payload, string $connectedAccountId)
    {
        self::setClient();

        try {
            return self::$client->subscriptions->create(
                $payload,
                ['stripe_account' => $connectedAccountId]
            );
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            Log::info('Stripe API Error: '.$e->getMessage());
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Update A Subscriptions
     *
     * @param  string  $sub_id  Subscription Id
     * @param  array  $payload  Update Payload
     * @return Throwable|Subscription
     */
    public static function updateSubscription($productId, $payload, $accountId = null)
    {
        self::setClient();

        try {
            if (! $accountId) {
                // If no account ID is provided, update the product directly
                return self::$client->products->update($productId, $payload);
            }

            return self::$client->products->update($productId, $payload, [
                'stripe_account' => $accountId,
            ]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Move a live subscription onto a new recurring amount, effective at its NEXT
     * renewal — used when a creator's negotiated platform rate falls and their
     * existing supporters should benefit.
     *
     * ⚠️ `proration_behavior: 'none'` is load-bearing. The default ('create_prorations')
     * would issue a mid-cycle credit or charge against a period the supporter has
     * already paid for at the old price. The agreement is "from your next renewal",
     * and this is what makes that literally true.
     *
     * The caller is responsible for only ever calling this with a LOWER amount —
     * see RepriceSubscriptionsOnFeeChange, which refuses to raise one.
     *
     * @param  float  $newUnitAmountMajor  The new supporter-facing amount, in major units.
     * @return Subscription
     */
    public static function repriceSubscription(
        string $subscriptionId,
        float $newUnitAmountMajor,
        string $currency,
        ?string $interval = null,
        ?float $applicationFeePercent = null,
        ?string $connectedAccountId = null,
        ?string $idempotencyKey = null
    ) {
        self::setClient();

        $options = [];
        if ($connectedAccountId) {
            $options['stripe_account'] = $connectedAccountId;
        }
        if ($idempotencyKey) {
            $options['idempotency_key'] = $idempotencyKey;
        }

        try {
            $subscription = self::$client->subscriptions->retrieve(
                $subscriptionId,
                [],
                $connectedAccountId ? ['stripe_account' => $connectedAccountId] : []
            );

            $item = $subscription->items->data[0] ?? null;
            if (! $item) {
                throw new Exception('Subscription '.$subscriptionId.' has no items to reprice');
            }

            $multiplier = Helpers::isZeroDecimalCurrency($currency) ? 1 : 100;

            // Read the cadence off the live price rather than making the caller map
            // each product's own period vocabulary onto Stripe's — getting that wrong
            // would silently change how often a supporter is billed.
            $interval = $interval
                ?: ($item->price->recurring->interval ?? null);

            if (! $interval) {
                throw new Exception('Subscription '.$subscriptionId.' has no billing interval to preserve');
            }

            $intervalCount = $item->price->recurring->interval_count ?? 1;

            $payload = [
                'items' => [[
                    'id' => $item->id,
                    'price_data' => [
                        'currency' => strtolower($currency),
                        // Reuse the existing product so the supporter's receipts and
                        // the creator's Stripe dashboard keep describing the same thing.
                        'product' => is_string($item->price->product) ? $item->price->product : $item->price->product->id,
                        'unit_amount' => (int) round($newUnitAmountMajor * $multiplier),
                        'recurring' => ['interval' => $interval, 'interval_count' => $intervalCount],
                    ],
                ]],
                'proration_behavior' => 'none',
            ];

            if ($applicationFeePercent !== null) {
                $payload['application_fee_percent'] = round($applicationFeePercent, 2);
            }

            return self::$client->subscriptions->update($subscriptionId, $payload, $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Update A Subscriptions
     *
     * @param  string  $sub_id  Subscription Id
     * @param  array  $payload  Update Payload
     * @return Throwable|Subscription
     */
    public static function getSubscription($sub_id, $connectedAccountId = null)
    {
        self::setClient();

        $options = [];
        if ($connectedAccountId) {
            $options['stripe_account'] = $connectedAccountId;
        }

        try {
            return self::$client->subscriptions->retrieve($sub_id, [], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Update A Subscriptions
     *
     * @param  string  $sub_id  Subscription Id
     * @param  array  $payload  Update Payload
     * @return Throwable|Subscription
     */
    /**
     * Cancel a subscription at the end of the period (disable auto-renewal)
     *
     * @param  string  $sub_id  Subscription Id
     * @param  bool  $atPeriodEnd  Whether to cancel at the end of the current period
     * @param  string|null  $connectedAccountId
     * @return Subscription
     */
    public static function cancelSubscription($sub_id, $atPeriodEnd = false, $connectedAccountId = null)
    {
        self::setClient();
        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            if ($atPeriodEnd) {
                return self::$client->subscriptions->update($sub_id, [
                    'cancel_at_period_end' => true,
                ], $options);
            }

            return self::$client->subscriptions->cancel($sub_id, [], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Undo a pending "cancel at period end" so the subscription renews again.
     *
     * Distinct from resumeSubscription(), which clears a pause_collection set by the
     * posting-cadence enforcer. This one clears the supporter's own cancellation and is
     * only valid while the current period has not ended (once Stripe actually cancels
     * the subscription it cannot be revived — the supporter must re-subscribe).
     *
     * @param  string  $sub_id  Stripe subscription ID
     * @param  string|null  $connectedAccountId  Creator's connected account
     * @return Throwable|Subscription
     */
    public static function uncancelSubscription($sub_id, $connectedAccountId = null)
    {
        self::setClient();
        try {
            $options = $connectedAccountId ? ['stripe_account' => $connectedAccountId] : [];

            return self::$client->subscriptions->update($sub_id, [
                'cancel_at_period_end' => false,
            ], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * The one Stripe Product every creator's platform subscription bills against.
     *
     * ⚠️ `subscriptions->create()` does NOT accept an inline `price_data.product_data`
     * — that is a Checkout convenience, and passing it fails with "Received unknown
     * parameter: items[0][price_data][product_data]". A subscription needs a real
     * product id.
     *
     * The id is deterministic, so this is create-or-reuse with no configuration to
     * set up per environment: Stripe rejects a duplicate id, which is the signal
     * that it already exists.
     */
    public const PLATFORM_PRODUCT_ID = 'spennypiggy_creator_subscription';

    public static function platformSubscriptionProductId(string $name): string
    {
        self::setClient();

        try {
            self::$client->products->create([
                'id' => self::PLATFORM_PRODUCT_ID,
                'name' => $name,
            ]);
        } catch (\Throwable $e) {
            // Already there — the normal case after the first ever activation.
            // Anything else surfaces when the subscription create fails.
        }

        return self::PLATFORM_PRODUCT_ID;
    }

    /**
     * Create the platform subscription for a creator whose card is already saved.
     *
     * The setup-mode counterpart to endSubscriptionTrial(): under that flow no
     * subscription exists until the creator's first sale, so this is what starts
     * billing rather than a trial being cut short.
     *
     * ⚠️ This CHARGES immediately when $trialDays is 0. Pass an idempotency key —
     * a retried activation must not be able to create a second subscription, which
     * would bill the creator twice a month for the rest of time.
     *
     * ⚠️ `default_payment_method` is explicit. Stripe attaches the card itself when
     * Checkout creates the subscription, but nothing does that here — omit it and
     * the subscription is created and then immediately fails to collect.
     *
     * @return Throwable|Subscription
     */
    public static function createPlatformSubscription(
        string $customerId,
        string $paymentMethodId,
        int $unitAmountMinor,
        string $currency,
        string $productName,
        int $trialDays = 0,
        array $metadata = [],
        ?string $idempotencyKey = null,
    ) {
        self::setClient();
        try {
            $payload = array_filter([
                'customer' => $customerId,
                'default_payment_method' => $paymentMethodId,
                'items' => [[
                    'price_data' => [
                        'currency' => strtolower($currency),
                        // A product ID, never inline product_data — see
                        // platformSubscriptionProductId().
                        'product' => self::platformSubscriptionProductId($productName),
                        'unit_amount' => $unitAmountMinor,
                        'recurring' => ['interval' => 'month', 'interval_count' => 1],
                    ],
                ]],
                'trial_period_days' => $trialDays > 0 ? $trialDays : null,
                'metadata' => $metadata ?: null,
                // The card was authenticated when it was saved, so this charge is
                // off-session. Telling Stripe that is what lets it use the saved
                // authorisation instead of asking for the cardholder.
                'off_session' => true,
                'payment_behavior' => 'allow_incomplete',
            ], fn ($v) => $v !== null);

            $options = $idempotencyKey ? ['idempotency_key' => (string) $idempotencyKey] : [];

            return self::$client->subscriptions->create($payload, $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * The card a completed setup-mode Checkout session saved.
     *
     * Returns null rather than throwing: a missing payment method means the
     * creator has no usable card, which the caller has to report to them — it is
     * not an exception in the flow.
     */
    public static function paymentMethodFromSetupSession($session): ?string
    {
        self::setClient();

        try {
            $setupIntentId = is_string($session->setup_intent ?? null)
                ? $session->setup_intent
                : ($session->setup_intent->id ?? null);

            if (! $setupIntentId) {
                return null;
            }

            $intent = self::$client->setupIntents->retrieve($setupIntentId, []);
            $pm = $intent->payment_method ?? null;

            return is_string($pm) ? $pm : ($pm->id ?? null);
        } catch (\Throwable $e) {
            Log::error('StripeControl: could not read the saved card from a setup session: '.$e->getMessage());

            return null;
        }
    }

    /**
     * End a subscription's trial immediately, so Stripe bills now and anchors the
     * monthly cycle to this moment.
     *
     * Used by SubscriptionActivationService when a creator makes their first sale:
     * the platform subscription is parked on a long trial at sign-up (Stripe has no
     * infinite trial — trial_end is always a timestamp) and this is what converts it
     * into a paying subscription.
     *
     * ⚠️ This CHARGES the creator. Pass an idempotency key — a retried or re-run
     * activation must not be able to raise a second invoice. Stripe scopes the key
     * to the request, so the same key returns the original result rather than
     * billing again.
     *
     * The platform subscription lives on the platform account, not a connected one,
     * so there is no stripe_account option here.
     *
     * @param  string  $sub_id  Stripe subscription ID
     * @return Throwable|Subscription
     */
    public static function endSubscriptionTrial($sub_id, ?string $idempotencyKey = null)
    {
        self::setClient();
        try {
            $options = $idempotencyKey ? ['idempotency_key' => (string) $idempotencyKey] : [];

            return self::$client->subscriptions->update($sub_id, [
                'trial_end' => 'now',
                // Bill for the new period straight away rather than rolling the
                // charge into a future invoice — the creator has just earned, and
                // this is the moment the subscription was promised to start.
                'proration_behavior' => 'none',
            ], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Pause a subscription's billing (no new invoices) — used when a creator falls below
     * the min posting cadence. Reversible via resumeSubscription(). behavior 'void' means
     * invoices during the pause are voided rather than collected later.
     *
     * @param  string  $sub_id  Stripe subscription ID
     * @param  string|null  $connectedAccountId  Creator's connected account
     * @return Throwable|Subscription
     */
    public static function pauseSubscription($sub_id, $connectedAccountId = null)
    {
        self::setClient();
        try {
            $options = $connectedAccountId ? ['stripe_account' => $connectedAccountId] : [];

            return self::$client->subscriptions->update($sub_id, [
                'pause_collection' => ['behavior' => 'void'],
            ], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Resume a paused subscription's billing (creator met the posting cadence again).
     *
     * @param  string  $sub_id  Stripe subscription ID
     * @param  string|null  $connectedAccountId  Creator's connected account
     * @return Throwable|Subscription
     */
    public static function resumeSubscription($sub_id, $connectedAccountId = null)
    {
        self::setClient();
        try {
            $options = $connectedAccountId ? ['stripe_account' => $connectedAccountId] : [];

            return self::$client->subscriptions->update($sub_id, [
                'pause_collection' => '',
            ], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    // public static function cancelSubscription($sub_id)
    // {
    //     self::setClient();
    //     try {
    //         $subscription = self::$client->subscriptions->retrieve($sub_id);
    //         if ($subscription->status !== 'canceled') {
    //             return self::$client->subscriptions->cancel($sub_id);
    //         }
    //         // return self::$client->subscriptions->cancel($sub_id, []);
    //     } catch (RateLimitException $e) {
    //         throw new Exception("Stripe RateLimit: " . $e->getMessage());
    //     } catch (InvalidRequestException $e) {
    //         throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
    //     } catch (ApiConnectionException $e) {
    //         throw new Exception("Stripe API Connection: " . $e->getMessage());
    //     } catch (ApiErrorException $e) {
    //         throw new Exception("Stripe API Error: " . $e->getMessage());
    //     }
    // }

    /**
     * Get account balance for a connected account
     *
     * @param  string  $connectedAccountId
     * @return Balance
     *
     * @throws Exception
     */
    public static function getAccountBalance($connectedAccountId)
    {
        self::setClient();

        try {
            return self::$client->balance->retrieve([], ['stripe_account' => $connectedAccountId]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function ensureManualPayoutSchedule(string $connectedAccountId, string $currency = 'GBP'): bool
    {
        // A connected account id is always `acct_…`. `users.account_id` has been seen holding a
        // CUSTOMER id (`cus_…`) instead, and every caller then spent a Stripe round trip to be
        // told the key "does not have access to account 'cus_…'" — an ERROR-level line that reads
        // like a revoked key when it is really a malformed column. Reject it here, once, for all
        // seven callers rather than letting each one log the wrong diagnosis.
        if (! str_starts_with($connectedAccountId, 'acct_')) {
            Log::warning('Skipped manual payout schedule: value is not a connected account id', [
                'account_id' => $connectedAccountId,
            ]);

            return false;
        }

        $client = self::getClientForCurrency($currency);

        try {
            $account = $client->accounts->retrieve($connectedAccountId, []);
            $interval = $account->settings->payouts->schedule->interval ?? null;

            if ($interval === 'manual') {
                return false;
            }

            $client->accounts->update($connectedAccountId, [
                'settings' => [
                    'payouts' => [
                        'schedule' => [
                            'interval' => 'manual',
                        ],
                    ],
                ],
            ]);

            return true;
        } catch (Exception $e) {
            /*
             * An account Stripe will not let this key touch is a PERMANENT fact about
             * that row, not a failure of this run: the creator disconnected, the
             * account was rejected or deleted, or it belongs to another platform.
             *
             * `payout:enforce-manual` sweeps EVERY account with an `account_id` every
             * ten minutes - 144 runs a day - so logging this at error level meant one
             * dead account produced 144 identical alerts a day, for as long as the row
             * existed. That is how a real fault gets buried: the alert that matters is
             * indistinguishable from the 143 before it. Warning + a 24h cooldown keyed
             * on the account keeps it visible once a day and actionable.
             *
             * `Cache::add` is atomic - a `has()` + `put()` pair lets two concurrent
             * runs both pass the check and both log.
             */
            if (self::isAccountUnreachable($e)) {
                if (Cache::add('stripe:manual-payout:unreachable:'.$connectedAccountId, true, now()->addDay())) {
                    // Still ERROR, not warning: this creator can never be paid out until
                    // somebody looks at the account, so it has to reach whoever reads the
                    // alerts. The cooldown makes it once a day instead of 144 times -
                    // it does not make it silent.
                    Log::error('Connected account is unreachable - manual payout schedule not enforced', [
                        'account_id' => $connectedAccountId,
                        'currency' => $currency,
                        'error' => $e->getMessage(),
                    ]);
                }

                return false;
            }

            // Anything else - a network blip, a rate limit, a Stripe outage - is a real
            // failure of THIS run and keeps its error level. The account id was only ever
            // available inside the message string before, which is not something an alert
            // can group or filter on.
            Log::error('Failed to ensure manual payout schedule', [
                'account_id' => $connectedAccountId,
                'currency' => $currency,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Is this Stripe error telling us the account will never be reachable with this key?
     *
     * Matched on the Stripe error CODE where there is one - `account_invalid` is the
     * documented code for "no such account, or access revoked". The string check is a
     * fallback for the permission error, which carries no code.
     */
    private static function isAccountUnreachable(\Throwable $e): bool
    {
        if ($e instanceof PermissionException) {
            return true;
        }

        if ($e instanceof \Stripe\Exception\InvalidRequestException) {
            return in_array($e->getStripeCode(), ['account_invalid', 'resource_missing'], true);
        }

        return str_contains($e->getMessage(), 'does not have access to account')
            || str_contains($e->getMessage(), 'Application access may have been revoked');
    }

    /**
     * Create a payout to a connected account's bank account
     *
     * @param  array  $payload  Payout payload. Pass an 'idempotency_key' to guard against
     *                          duplicate payouts on network retries / re-runs — it is pulled
     *                          out of the payload and sent as a Stripe request option.
     * @param  string  $connectedAccountId
     * @return Payout
     *
     * @throws Exception
     */
    public static function createPayout(array $payload, $connectedAccountId)
    {
        $currency = $payload['currency'] ?? 'GBP';
        $client = self::getClientForCurrency($currency);

        // Pull idempotency_key out of the payload — it is a request option, not a param.
        $idempotencyKey = $payload['idempotency_key'] ?? null;
        unset($payload['idempotency_key']);

        $options = ['stripe_account' => $connectedAccountId];
        if ($idempotencyKey) {
            $options['idempotency_key'] = (string) $idempotencyKey;
        }

        try {
            return $client->payouts->create($payload, $options);
        } catch (Exception $e) {
            Log::error('Stripe Payout Error: '.$e->getMessage());
            throw new Exception('Stripe Payout Error: '.$e->getMessage());
        }
    }

    /**
     * Get transfer details
     *
     * @param  string  $transferId
     * @return Transfer
     *
     * @throws Exception
     */
    public static function getTransfer($transferId)
    {
        self::setClient();

        try {
            return self::$client->transfers->retrieve($transferId);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Transfer funds to a connected account
     *
     * @deprecated Use transferToConnectedAccountMinor() instead. This major-unit
     *             variant has no idempotency key and no metadata support, so a retry
     *             can double-pay. Currently unused; kept only to avoid breaking any
     *             dynamic references.
     *
     * @param  string  $destinationAccountId
     * @param  int|float  $amount  Amount in major units (e.g. 10.00)
     * @param  string  $currency
     * @return Transfer
     *
     * @throws Exception
     */
    public static function transferToConnectedAccount($destinationAccountId, $amount, $currency = 'usd')
    {
        self::setClient();

        try {
            // Convert to minor units (cents/pence)
            $isZeroDecimal = Helpers::isZeroDecimalCurrency($currency);
            $amountMinor = $isZeroDecimal ? (int) $amount : (int) ($amount * 100);

            return self::$client->transfers->create([
                'amount' => $amountMinor,
                'currency' => strtolower($currency),
                'destination' => $destinationAccountId,
                'description' => 'Reserve Release Payout',
            ]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function transferToConnectedAccountMinor(string $destinationAccountId, int $amountMinor, string $currency = 'usd', array $metadata = [], ?string $description = null, ?string $idempotencyKey = null)
    {
        $client = self::getClientForCurrency($currency);

        try {
            $payload = [
                'amount' => (int) $amountMinor,
                'currency' => strtolower($currency),
                'destination' => $destinationAccountId,
            ];
            if (! empty($description)) {
                $payload['description'] = $description;
            }
            if (! empty($metadata)) {
                $payload['metadata'] = $metadata;
            }

            $options = [];
            if ($idempotencyKey) {
                $options['idempotency_key'] = $idempotencyKey;
            }

            return $client->transfers->create($payload, $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function updateTransferMinor(string $transferId, string $currency = 'usd', array $metadata = [], ?string $description = null)
    {
        $client = self::getClientForCurrency($currency);

        try {
            $payload = [];
            if (! empty($description)) {
                $payload['description'] = $description;
            }
            if (! empty($metadata)) {
                $payload['metadata'] = $metadata;
            }
            if (empty($payload)) {
                return $client->transfers->retrieve($transferId);
            }

            return $client->transfers->update($transferId, $payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Re-fetch a payout from the connected account to read its current live status.
     * Used by the payout reconciler to resolve records stuck 'in_transit' when a webhook
     * was dropped.
     */
    public static function retrievePayout(string $payoutId, string $connectedAccountId, string $currency = 'GBP')
    {
        $client = self::getClientForCurrency($currency);

        return $client->payouts->retrieve($payoutId, [], ['stripe_account' => $connectedAccountId]);
    }

    public static function updatePayoutMetadata(string $payoutId, string $connectedAccountId, string $currency = 'usd', array $metadata = [])
    {
        $client = self::getClientForCurrency($currency);

        try {
            if (empty($metadata)) {
                return $client->payouts->retrieve($payoutId, [], ['stripe_account' => $connectedAccountId]);
            }

            return $client->payouts->update($payoutId, ['metadata' => $metadata], ['stripe_account' => $connectedAccountId]);
        } catch (Exception $e) {
            Log::error('Stripe Payout Update Error: '.$e->getMessage());
            throw new Exception('Stripe Payout Update Error: '.$e->getMessage());
        }
    }

    /**
     * List transfers for an account
     *
     * @return Collection
     *
     * @throws Exception
     */
    public static function listTransfers(array $params = [])
    {
        self::setClient();

        try {
            return self::$client->transfers->all($params);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Delete Product
     */
    public static function deleteProductAndPrices(string $productId, string $connectedAccountId)
    {
        $client = new StripeClient(config('services.stripe.secret'));

        try {
            // 1. Fetch all prices for the product
            $prices = $client->prices->all(
                ['product' => $productId, 'limit' => 100],
                ['stripe_account' => $connectedAccountId]
            );

            foreach ($prices->data as $price) {
                // 2. Cancel all subscriptions using this price
                $cancelSubscription = self::cancelSubscriptionsByPrices($client, $price->id);
                Log::info('Cancelled subscriptions for price: ');
                Log::info(json_encode($cancelSubscription));
                // 3. Deactivate the price if active
                if ($price->active) {
                    try {
                        $updated = $client->prices->update(
                            $price->id,
                            ['active' => false],
                            ['stripe_account' => $connectedAccountId]
                        );

                        Log::info($updated->active
                            ? "Price still active after update: {$price->id}"
                            : "Deactivated price: {$price->id}");
                    } catch (Exception $e) {
                        Log::error("Failed to deactivate price {$price->id}: ".$e->getMessage());
                    }
                }
            }

            // 4. Optionally delete the product
            try {
                $updated = $client->products->update(
                    $productId,
                    ['active' => false],
                    ['stripe_account' => $connectedAccountId]
                );

                return $updated->active === false;
            } catch (Exception $e) {
                Log::error('Failed to archive product: '.$e->getMessage());

                return false;
            }

            return true;
        } catch (Exception $e) {
            Log::error('Stripe Error in deleteProductAndPrices: '.$e->getMessage());

            return false;
        }
    }

    public static function deleteProductAndPricesOfCreator(string $productId, ?string $connectedAccountId = null)
    {
        $client = new StripeClient(config('services.stripe.secret'));

        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            // 1. Fetch all prices for the product
            $prices = $client->prices->all(
                ['product' => $productId, 'limit' => 100],
                $options
            );

            foreach ($prices->data as $price) {
                // 2. Cancel all subscriptions using this price
                $cancelSubscription = self::cancelSubscriptionsByPrices($client, $price->id);
                Log::info('Cancelled subscriptions for price: ');
                Log::info(json_encode($cancelSubscription));

                // 3. Deactivate the price if active
                if ($price->active) {
                    try {
                        $updated = $client->prices->update(
                            $price->id,
                            ['active' => false],
                            $options
                        );

                        Log::info($updated->active
                            ? "Price still active after update: {$price->id}"
                            : "Deactivated price: {$price->id}");
                    } catch (Exception $e) {
                        Log::error("Failed to deactivate price {$price->id}: ".$e->getMessage());
                    }
                }
            }

            // 4. Archive the product
            try {
                $updated = $client->products->update(
                    $productId,
                    ['active' => false],
                    $options
                );

                return $updated->active === false;
            } catch (Exception $e) {
                Log::error('Failed to archive product: '.$e->getMessage());

                return false;
            }
        } catch (Exception $e) {
            Log::error('Stripe Error in deleteProductAndPrices: '.$e->getMessage());

            return false;
        }
    }

    private static function cancelSubscriptionsByPrice(StripeClient $client, string $priceId, $connectedAccountId = null)
    {
        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            $startingAfter = null;

            do {
                $params = ['limit' => 100, 'status' => 'active'];
                if ($startingAfter) {
                    $params['starting_after'] = $startingAfter;
                }

                $subscriptions = $client->subscriptions->all($params, $options);

                foreach ($subscriptions->data as $subscription) {
                    $startingAfter = $subscription->id;

                    foreach ($subscription->items->data as $item) {
                        if ($item->price->id === $priceId) {
                            try {
                                $client->subscriptions->cancel(
                                    $subscription->id,
                                    [],
                                    $options
                                );
                                Log::info("Cancelled subscription: {$subscription->id}");
                                break;
                            } catch (Exception $e) {
                                Log::error("Failed to cancel subscription {$subscription->id}: ".$e->getMessage());
                            }
                        }
                    }
                }
            } while ($subscriptions->has_more);
        } catch (Exception $e) {
            Log::error('Failed to retrieve subscriptions: '.$e->getMessage());
        }
    }

    private static function cancelSubscriptionsByPrices(StripeClient $client, string $priceId)
    {
        try {
            $options = [];

            $startingAfter = null;

            do {
                $params = ['limit' => 100, 'status' => 'active'];
                if ($startingAfter) {
                    $params['starting_after'] = $startingAfter;
                }

                $subscriptions = $client->subscriptions->all($params, $options);

                foreach ($subscriptions->data as $subscription) {
                    $startingAfter = $subscription->id;

                    foreach ($subscription->items->data as $item) {
                        if ($item->price->id === $priceId) {
                            try {
                                $client->subscriptions->cancel(
                                    $subscription->id,
                                    [],
                                    $options
                                );
                                Log::info("Cancelled subscription: {$subscription->id}");
                                break;
                            } catch (Exception $e) {
                                Log::error("Failed to cancel subscription {$subscription->id}: ".$e->getMessage());
                            }
                        }
                    }
                }
            } while ($subscriptions->has_more);
        } catch (Exception $e) {
            Log::error('Failed to retrieve subscriptions: '.$e->getMessage());
        }
    }
}
