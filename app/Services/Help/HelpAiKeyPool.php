<?php

namespace App\Services\Help;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * The pool of AI credentials, and which of them are currently usable.
 *
 * ⚠️ A COOLDOWN RECORDS WHAT THE PROVIDER SAID ABOUT THE CREDENTIAL — a 429
 * (spent) or a 401/403 (refused). A 5xx or a dropped connection is the
 * provider's bad minute and says nothing about the key, so HelpAiClient moves
 * to the next key and remembers nothing.
 *
 * 🚨 A COOLDOWN IS PER KEY *AND PER MODEL*, because that is how the providers
 * meter. Groq publishes a separate daily allowance for `llama-3.3-70b-versatile`
 * and for `nomic-embed-text-v1_5`; an account out of embedding tokens still has
 * chat tokens. Standing the whole KEY down on an embedding 429 would throw away
 * chat capacity that exists — on the one feature built to stretch a free tier.
 * The scope is the model name the request carried.
 *
 * 🚨 THE PROBLEM THIS EXISTS FOR: a free tier's quota is per ACCOUNT, and it
 * runs out. One key alone means Ask AI simply stops for the rest of the day.
 * With a pool, a key that reports 429 is stood down for as long as the provider
 * says, the request is retried on another key in the SAME request, and the next
 * visitor is never sent to the exhausted one.
 *
 * ⚠️ THE COOLDOWN IS SHARED STATE, NOT PER-PROCESS. It lives in the cache, so
 * every Lambda container and every queue worker sees the same standing-down.
 * A static property here would be correct under FPM and wrong on Vapor — a warm
 * container would keep its own private idea of which keys are healthy, so one
 * container would go on hammering a key another had already found exhausted.
 *
 * ⚠️ KEYED BY FINGERPRINT, NEVER BY POSITION. Reorder or remove a key in the
 * env and every index shifts — a cooldown recorded against "key 2" would then
 * apply to a completely different account. The fingerprint follows the key.
 *
 * 🚨 NOTHING HERE MAY THROW. Every caller is inside a public help page. A cache
 * driver that is momentarily unavailable must degrade to "all keys look
 * healthy" — trying and failing is recoverable; a 500 on /help is not.
 */
class HelpAiKeyPool
{
    private const COOLDOWN_PREFIX = 'help:ai:cooldown:';

    private const REASON_PREFIX = 'help:ai:coolreason:';

    private const COUNT_PREFIX = 'help:ai:coolcount:';

    private const CURSOR_KEY = 'help:ai:cursor';

    /** Why a key was stood down. Each has its own duration and its own meaning. */
    public const REASON_RATE_LIMITED = 'rate_limited';

    public const REASON_AUTH = 'auth';

    /**
     * Every configured credential, in env order.
     *
     * @return array<int, array{key:string, index:int, fingerprint:string, label:string}>
     */
    public static function keys(): array
    {
        $configured = config('help.ai.keys');

        $raw = is_array($configured) ? $configured : [];

        // A single-key install is a pool of one. Falling back keeps every
        // existing environment — and every existing test — working unchanged.
        if (empty($raw)) {
            $single = (string) config('help.ai.api_key', '');
            $raw = $single !== '' ? [$single] : [];
        }

        $keys = [];
        $seen = [];

        foreach ($raw as $value) {
            $value = trim((string) $value);

            if ($value === '') {
                continue;
            }

            $fingerprint = substr(sha1($value), 0, 12);

            // ⚠️ Deduplicated. The same key pasted twice looks like failover in
            // the env file and is not — both entries share one account quota, so
            // the second "key" is exhausted at the same moment as the first.
            if (isset($seen[$fingerprint])) {
                continue;
            }

            $seen[$fingerprint] = true;
            $index = count($keys);

            $keys[] = [
                'key' => $value,
                'index' => $index,
                'fingerprint' => $fingerprint,
                // 🚨 What goes in a log line. NEVER the key itself — these end up
                // in Sentry, which is not a place secrets may be reconstructed
                // from. Four characters is enough to tell two keys apart when
                // reading the status table beside the env file.
                'label' => '#'.($index + 1).' (…'.substr($value, -4).')',
            ];
        }

        return $keys;
    }

    public static function configured(): bool
    {
        return self::keys() !== [];
    }

    /**
     * A key whose PREFIX says it belongs to a different provider than
     * `base_url` points at — the misconfiguration that actually happened:
     * four `gsk_` Groq keys pasted into `HELP_AI_API_KEYS` with the host left at
     * OpenAI, so every one 401'd and stood down as "refused". The 401 message
     * ("Incorrect API key provided") is true and useless; this names the fix.
     *
     * Prefixes are a hint, not an authority — an unknown prefix says nothing.
     *
     * @return array<int, string> one sentence per mismatched key, empty when fine
     */
    public static function hostMismatches(): array
    {
        $host = (string) parse_url((string) config('help.ai.base_url'), PHP_URL_HOST);

        $expects = [
            'gsk_' => ['groq.com', 'Groq (set HELP_AI_BASE_URL=https://api.groq.com/openai/v1)'],
            'sk-' => ['openai.com', 'OpenAI (set HELP_AI_BASE_URL=https://api.openai.com/v1)'],
            'AIza' => ['googleapis.com', 'Gemini (set HELP_AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai)'],
        ];

        $problems = [];

        foreach (self::keys() as $key) {
            foreach ($expects as $prefix => [$domain, $advice]) {
                if (str_starts_with($key['key'], $prefix) && ! str_contains($host, $domain)) {
                    $problems[] = "Key {$key['label']} looks like a {$advice} key, but HELP_AI_BASE_URL points at ".($host ?: 'nothing').'.';
                }
            }
        }

        return $problems;
    }

    public static function count(): int
    {
        return count(self::keys());
    }

    /**
     * The models this install meters against — one cooldown ledger each.
     *
     * @return array<int, string>
     */
    public static function scopes(): array
    {
        $models = [(string) config('help.ai.answer_model')];

        // On the keyword retriever nothing is ever embedded, so a row for the
        // embedding model is a row about a call that never happens.
        if (config('help.ai.retriever') !== 'keyword') {
            $models[] = (string) config('help.ai.embedding_model');
        }

        return array_values(array_unique(array_filter($models)));
    }

    /**
     * Cache-key fragment for a model.
     *
     * Kept readable rather than hashed — somebody reading the cache while
     * diagnosing a stuck key should be able to see which model it is.
     */
    private static function scopeKey(?string $scope): string
    {
        $scope = trim((string) $scope);

        if ($scope === '') {
            return 'default';
        }

        return substr((string) preg_replace('/[^A-Za-z0-9_.-]/', '_', $scope), 0, 64);
    }

    /**
     * The keys worth trying right now, in the order to try them.
     *
     * Rotation is a shared, atomic cursor rather than a random pick: with two
     * keys and random choice, an even split only appears over a large number of
     * requests, and a help centre does not get a large number of requests. The
     * cursor makes consecutive askers alternate exactly.
     *
     * @return array<int, array{key:string, index:int, fingerprint:string, label:string}>
     */
    public static function available(?string $scope = null): array
    {
        $all = self::keys();

        if (count($all) < 2) {
            return array_values(array_filter($all, fn ($k) => ! self::isCooling($k['fingerprint'], $scope)));
        }

        // 🚨 THE CURSOR IS PER MODEL. One shared cursor with an EVEN number of
        // keys locks into a fixed split, because an ask makes two pooled calls
        // (embed, then chat): embed takes cursor 1 → key A, chat takes cursor 2
        // → key B, and the next ask lands on 3 → A, 4 → B again — for ever. Key
        // B then carries every chat call (the ~1,800-token one) while key A's
        // chat quota sits unused, and "two accounts doubles capacity" is false
        // for exactly the call that spends the quota. Verified by test: two
        // full asks on two keys put both chat calls on the same key.
        $start = self::advanceCursor($scope) % count($all);

        // Walk the whole ring from the cursor, so a skipped key is passed over
        // rather than shortening the rotation.
        $ordered = array_merge(array_slice($all, $start), array_slice($all, 0, $start));

        return array_values(array_filter($ordered, fn ($k) => ! self::isCooling($k['fingerprint'], $scope)));
    }

    /** Is this credential currently stood down? */
    public static function isCooling(string $fingerprint, ?string $scope = null): bool
    {
        return self::coolingUntil($fingerprint, $scope) !== null;
    }

    /** Unix timestamp the cooldown lifts, or null when the key is healthy. */
    public static function coolingUntil(string $fingerprint, ?string $scope = null): ?int
    {
        try {
            $until = Cache::get(self::COOLDOWN_PREFIX.$fingerprint.':'.self::scopeKey($scope));
        } catch (\Throwable $e) {
            // 🚨 Fails OPEN. If the cache cannot be read we do not know that a
            // key is exhausted, and refusing every key on that basis would take
            // Ask AI down for a cache blip. The provider's own 429 is the
            // backstop, and it costs one wasted request.
            return null;
        }

        if (! is_numeric($until)) {
            return null;
        }

        return (int) $until > time() ? (int) $until : null;
    }

    /**
     * Stand a credential down.
     *
     * @param  array{fingerprint:string, label:string}  $key
     * @param  int  $seconds  provider-supplied where possible; see cooldownFor()
     */
    public static function cool(array $key, int $seconds, string $reason, ?string $scope = null): void
    {
        $seconds = max(1, min($seconds, (int) config('help.ai.cooldown.max', 86400)));
        $until = time() + $seconds;
        $slot = $key['fingerprint'].':'.self::scopeKey($scope);

        try {
            Cache::put(self::COOLDOWN_PREFIX.$slot, $until, $seconds);
            Cache::put(self::REASON_PREFIX.$slot, $reason, $seconds);

            // Kept for the day so `help:ai-status` can answer the only question
            // that matters when deciding whether to add another key: is this
            // happening once a week or thirty times a day?
            $countKey = self::COUNT_PREFIX.$slot.':'.date('Y-m-d');
            Cache::add($countKey, 0, 172800);
            Cache::increment($countKey);
        } catch (\Throwable $e) {
            Log::warning('Help AI: could not record a key cooldown', ['error' => $e->getMessage()]);

            return;
        }

        $context = [
            'key' => $key['label'],
            'model' => self::scopeKey($scope),
            'reason' => $reason,
            'seconds' => $seconds,
        ];

        // 🚨 An exhausted quota is EXPECTED on a free tier and is handled — it
        // is a warning. A credential the provider refuses is a configuration
        // fault that will not fix itself, so that one is an error and reaches
        // whoever reads the alerts (the `sentry` log channel carries error and
        // above). Logged once per cooldown, not once per request.
        if ($reason === self::REASON_AUTH) {
            // ⚠️ ONCE PER KEY PER 24H at error level — the `sentry` channel
            // carries error and above, and a revoked key re-cools every hour
            // for as long as it sits in the env, which is 24 identical alerts a
            // day per dead key (the `ensureManualPayoutSchedule` noise, at a
            // smaller scale). `Cache::add` is atomic; a `has()`+`put()` pair
            // lets two concurrent refusals both alert.
            $claimed = false;

            try {
                $claimed = Cache::add('help:ai:autherr:'.$key['fingerprint'], 1, 86400);
            } catch (\Throwable $e) {
                $claimed = true; // cannot dedupe → say it, rather than stay silent
            }

            if ($claimed) {
                Log::error('Help AI: a key was refused by the provider', $context);
            } else {
                Log::warning('Help AI: a refused key is still refused', $context);
            }
        } else {
            Log::warning('Help AI: key stood down', $context);
        }
    }

    /**
     * How long to stand a key down for, given what the provider said.
     *
     * ⚠️ The provider's own `Retry-After` wins over any number we invent — it
     * is the only value that knows when the quota actually resets. Groq and
     * OpenAI both send it on a 429; it is either seconds or an HTTP date.
     */
    public static function cooldownFor(string $reason, ?string $retryAfter = null): int
    {
        if ($reason === self::REASON_RATE_LIMITED && $retryAfter !== null) {
            $parsed = self::parseRetryAfter($retryAfter);

            if ($parsed !== null) {
                // A floor, because some providers answer "1" on a per-minute
                // limit and retrying a second later just burns the next request.
                return max($parsed, (int) config('help.ai.cooldown.min', 5));
            }
        }

        return (int) match ($reason) {
            self::REASON_AUTH => config('help.ai.cooldown.auth', 3600),
            default => config('help.ai.cooldown.rate_limited', 600),
        };
    }

    /** Seconds, or an HTTP date. Returns null when it is neither. */
    private static function parseRetryAfter(string $value): ?int
    {
        $value = trim($value);

        if ($value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return (int) ceil((float) $value);
        }

        $timestamp = strtotime($value);

        if ($timestamp === false) {
            return null;
        }

        $seconds = $timestamp - time();

        return $seconds > 0 ? $seconds : null;
    }

    /**
     * What every key is doing right now — for `help:ai-status`.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function status(): array
    {
        $today = date('Y-m-d');
        $rows = [];

        // 🚨 One row per key PER MODEL. A single row per key cannot express the
        // state the pool actually holds — an account can be out of embedding
        // tokens and still answering chat, and a table that hides that sends
        // somebody to create an account they do not need.
        foreach (self::keys() as $key) {
            foreach (self::scopes() as $scope) {
                $slot = $key['fingerprint'].':'.self::scopeKey($scope);
                $until = self::coolingUntil($key['fingerprint'], $scope);

                try {
                    $reason = $until ? Cache::get(self::REASON_PREFIX.$slot) : null;
                    $cooldowns = (int) Cache::get(self::COUNT_PREFIX.$slot.':'.$today, 0);
                } catch (\Throwable $e) {
                    $reason = null;
                    $cooldowns = 0;
                }

                $rows[] = [
                    'label' => $key['label'],
                    'index' => $key['index'],
                    'model' => $scope,
                    'healthy' => $until === null,
                    'cooling_until' => $until,
                    'seconds_remaining' => $until ? $until - time() : 0,
                    'reason' => $reason,
                    'cooldowns_today' => $cooldowns,
                ];
            }
        }

        return $rows;
    }

    /** Bring every key back into rotation. Used by tests and by `help:ai-status --reset`. */
    public static function reset(): void
    {
        foreach (self::keys() as $key) {
            foreach (self::scopes() as $scope) {
                $slot = $key['fingerprint'].':'.self::scopeKey($scope);

                try {
                    Cache::forget(self::COOLDOWN_PREFIX.$slot);
                    Cache::forget(self::REASON_PREFIX.$slot);
                } catch (\Throwable $e) {
                    // Nothing to do — a cooldown that cannot be cleared expires anyway.
                }
            }
        }
    }

    /**
     * Atomic round-robin position.
     *
     * ⚠️ `Cache::increment` needs the key to exist on some drivers, so it is
     * seeded with `add` (which is itself atomic and a no-op when present).
     */
    private static function advanceCursor(?string $scope): int
    {
        $key = self::CURSOR_KEY.':'.self::scopeKey($scope);

        try {
            Cache::add($key, 0, 86400);
            $value = Cache::increment($key);

            if (is_numeric($value)) {
                return (int) $value;
            }
        } catch (\Throwable $e) {
            // Fall through.
        }

        // A cache that cannot count still has to spread load, and an unspread
        // pool sends everything to key #1 until its quota is gone.
        return random_int(0, 1023);
    }
}
