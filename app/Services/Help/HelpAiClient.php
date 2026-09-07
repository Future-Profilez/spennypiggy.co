<?php

namespace App\Services\Help;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * ONE definition of "call the AI provider, and cope when a key is spent".
 *
 * Both the embedding call and the answer call go through here. Two copies of a
 * failover loop is two behaviours waiting to disagree — the embedding half
 * retrying where the answer half gives up would show as "search works, answers
 * do not", which reads as a model problem rather than a credential one.
 *
 * 🚨 THIS NEVER THROWS AND NEVER RETURNS A HALF-ANSWER. Every outcome is a
 * shaped array. The callers are a public help page and a scheduled command; the
 * worst acceptable result is "no answer, here are the articles".
 */
class HelpAiClient
{
    /**
     * POST to an OpenAI-compatible path, trying each healthy key in turn.
     *
     * @param  string  $path  'chat/completions' or 'embeddings'
     * @return array{ok:bool, json:?array, reason:?string, error:?string, key:?string}
     */
    public static function post(string $path, array $payload): array
    {
        // 🚨 THE SCOPE IS THE MODEL, because that is what the provider meters.
        // A key out of embedding tokens still has chat tokens; see
        // HelpAiKeyPool's docblock.
        $scope = isset($payload['model']) ? (string) $payload['model'] : null;

        $candidates = HelpAiKeyPool::available($scope);

        if ($candidates === []) {
            // Told apart deliberately: nothing configured is a setup problem a
            // person must fix, every key spent is a temporary state that clears
            // itself. Reporting both as "unavailable" sends somebody to check
            // the env file when the env file is fine.
            return self::failure(
                HelpAiKeyPool::configured() ? 'rate_limited' : 'no_keys',
                HelpAiKeyPool::configured()
                    ? 'Every AI key is standing down for '.($scope ?: 'this model').'; the next one frees up shortly.'
                    : 'No AI key is configured.'
            );
        }

        $url = rtrim((string) config('help.ai.base_url', 'https://api.openai.com/v1'), '/').'/'.ltrim($path, '/');
        $perAttempt = max(1, (int) config('help.ai.timeout', 12));

        /*
         * 🚨 ONE BUDGET FOR THE WHOLE LOOP, NOT ONE TIMEOUT PER KEY.
         *
         * Without it the worst case is `timeout × keys`, so ADDING A KEY MADE
         * THE PAGE SLOWER — and HelpAnswer makes two pooled calls (embed, then
         * chat), so three keys at 12s each is 72 seconds against a 60-second
         * Lambda. The graceful "here are the articles" fallback would never be
         * reached; the visitor would get a hard timeout instead, on the one
         * path that exists so this feature cannot break.
         *
         * The budget is spent, not divided: a first attempt that answers in
         * 200ms leaves the rest for the next key.
         */
        // ⚠️ A CEILING, NEVER A FLOOR. An earlier version wrote
        // `max($perAttempt, $budget)` so "at least one attempt fits" — which
        // silently let a large `timeout` override the budget entirely, i.e. the
        // exact bug the budget exists to prevent. The per-attempt timeout is
        // clamped to what is left instead.
        $budget = max(1, (int) config('help.ai.request_budget', 18));
        $startedAt = microtime(true);

        $lastError = null;
        $lastReason = 'request_failed';
        // ⚠️ Ranked, not last-wins. If ANY key was rate limited, that is what
        // the caller is told — a spent quota is the one signal that means "add
        // an account", and a later 5xx on a different key must not bury it.
        $sawRateLimit = false;

        foreach ($candidates as $candidate) {
            $remaining = $budget - (microtime(true) - $startedAt);

            // Below this there is no point starting: a 1-second timeout against
            // a provider that is already slow just spends the attempt.
            if ($remaining < 2) {
                $lastError = $lastError ?? 'Ran out of time before every key could be tried.';

                break;
            }

            try {
                $response = Http::withToken($candidate['key'])
                    ->timeout((int) min($perAttempt, ceil($remaining)))
                    ->post($url, $payload);
            } catch (\Throwable $e) {
                // 🚨 A connection failure or a timeout says NOTHING about the
                // key, so nothing is remembered about it. The request moves to
                // the next key now; the next visitor tries this one again. An
                // earlier version stood the key down for a minute here, which
                // with a pool of ONE turned a single dropped packet into sixty
                // seconds of search-only — a cooldown is for what the provider
                // said about the credential (429, 401), never for its bad minute.
                $lastError = $e->getMessage();
                $lastReason = 'exception';

                continue;
            }

            if ($response->successful()) {
                return [
                    'ok' => true,
                    'json' => (array) $response->json(),
                    'reason' => null,
                    'error' => null,
                    'key' => $candidate['label'],
                ];
            }

            $status = $response->status();
            $message = self::messageFrom($response);
            $lastError = 'HTTP '.$status.' on key '.$candidate['label'].': '.$message;

            if ($status === 429) {
                HelpAiKeyPool::cool(
                    $candidate,
                    HelpAiKeyPool::cooldownFor(
                        HelpAiKeyPool::REASON_RATE_LIMITED,
                        $response->header('Retry-After') ?: null
                    ),
                    HelpAiKeyPool::REASON_RATE_LIMITED,
                    $scope
                );

                $sawRateLimit = true;
                $lastReason = 'rate_limited';

                continue;
            }

            if ($status === 401 || $status === 403) {
                HelpAiKeyPool::cool(
                    $candidate,
                    HelpAiKeyPool::cooldownFor(HelpAiKeyPool::REASON_AUTH),
                    HelpAiKeyPool::REASON_AUTH,
                    $scope
                );

                $lastReason = 'auth';

                continue;
            }

            if ($status >= 500) {
                // The provider's fault, not the key's — same reasoning as the
                // connection failure above. Try the next key, remember nothing.
                $lastReason = 'request_failed';

                continue;
            }

            // 🚨 ANY OTHER 4xx IS OUR REQUEST, NOT THE KEY. A wrong model name,
            // a payload the host rejects — every key answers identically, so
            // trying them all burns the whole pool to be told the same thing N
            // times, and standing them down would take Ask AI out over a typo
            // in an env var. Stop here, keep the keys healthy, report the
            // provider's own words.
            return self::failure('bad_request', $lastError);
        }

        return self::failure(
            $sawRateLimit ? 'rate_limited' : $lastReason,
            $lastError ?? 'Every AI key failed.'
        );
    }

    /** The provider's own message beats anything we would write in its place. */
    private static function messageFrom(Response $response): string
    {
        $message = $response->json('error.message');

        if (is_string($message) && $message !== '') {
            return $message;
        }

        return mb_substr($response->body(), 0, 300);
    }

    /** @return array{ok:bool, json:?array, reason:?string, error:?string, key:?string} */
    private static function failure(string $reason, ?string $error): array
    {
        return ['ok' => false, 'json' => null, 'reason' => $reason, 'error' => $error, 'key' => null];
    }
}
