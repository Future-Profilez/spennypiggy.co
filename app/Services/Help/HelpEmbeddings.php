<?php

namespace App\Services\Help;

use App\Models\HelpArticle;
use App\Support\HelpTokens;
use Illuminate\Support\Facades\Log;

/**
 * Turns help articles into vectors so a question written in ordinary language
 * can find the right answer.
 *
 * ⚠️ NO VECTOR DATABASE. At ~100 articles, cosine similarity over a JSON column
 * in PHP takes milliseconds and needs no extra infrastructure and no second copy
 * of the content. Revisit at thousands, not before.
 *
 * ⚠️ TOKENS ARE RESOLVED BEFORE EMBEDDING. An article whose body says
 * "{{reserve.onboarding_pct}}" would otherwise be embedded with the literal
 * braces and never match someone asking about "10%". Resolving first is also
 * what lets the answer model quote a figure without inventing one.
 */
class HelpEmbeddings
{
    /** Model input cap. Long articles are truncated rather than refused. */
    private const MAX_CHARS = 8000;

    /**
     * Why the last call failed, in words a person can act on.
     *
     * ⚠️ This exists because the console command reported only "Embedding
     * request failed" while the actual cause — a 401 naming a truncated API key
     * — sat in the log. A caller that cannot see the reason re-runs the same
     * broken thing, which is precisely what happened.
     */
    private static ?string $lastError = null;

    /**
     * The machine-readable half of the same failure.
     *
     * ⚠️ A scheduled command needs to tell "this will fix itself" from "a person
     * must look". `rate_limited` on a free tier is the first; `auth` and
     * `bad_request` are the second. The prose above is for the human, this is
     * for the exit code.
     */
    private static ?string $lastReason = null;

    public static function lastError(): ?string
    {
        return self::$lastError;
    }

    public static function lastReason(): ?string
    {
        return self::$lastReason;
    }

    public static function enabled(): bool
    {
        return (bool) config('help.ai.enabled') && HelpAiKeyPool::configured();
    }

    /**
     * The exact text an article is embedded from.
     *
     * The title and the curated keywords are repeated deliberately: a supporter
     * asks "why is 10% being held", and it is the keywords line a human wrote
     * that carries that phrasing, not the prose.
     */
    public static function textFor(HelpArticle $article): string
    {
        $parts = [
            $article->title,
            $article->keywords,
            HelpTokens::render($article->summary),
            HelpTokens::render($article->body),
        ];

        $text = trim(implode("\n\n", array_filter($parts)));

        return mb_substr($text, 0, self::MAX_CHARS);
    }

    /** Changes only when the embedded words change, so a re-run costs nothing. */
    public static function hashFor(HelpArticle $article): string
    {
        return hash('sha256', config('help.ai.embedding_model').'|'.self::textFor($article));
    }

    /**
     * Embed a batch of strings.
     *
     * Returns null on any failure — never throws and never partially returns.
     * Callers treat null as "semantic search is unavailable" and fall back to
     * keyword search, which is always present.
     *
     * @param  array<int, string>  $inputs
     * @return array<int, array<int, float>>|null
     */
    public static function embed(array $inputs): ?array
    {
        if (empty($inputs) || ! self::enabled()) {
            return null;
        }

        self::$lastError = null;
        self::$lastReason = null;

        try {
            // Failover across the key pool lives in HelpAiClient — see its
            // docblock. A key spent here is a key the answer half skips too.
            $result = HelpAiClient::post('embeddings', [
                'model' => config('help.ai.embedding_model'),
                'input' => array_values($inputs),
            ]);

            if (! $result['ok']) {
                // The provider's own message, verbatim, naming which key it came
                // from. `help:embed` prints this — a vaguer version sends people
                // to re-run the command rather than to look at the key.
                self::$lastError = $result['error'] ?: ('Embedding request failed ('.$result['reason'].').');
                self::$lastReason = $result['reason'];

                Log::warning('Help centre embedding request failed', [
                    'reason' => $result['reason'],
                    'error' => mb_substr((string) $result['error'], 0, 500),
                ]);

                return null;
            }

            $data = $result['json']['data'] ?? null;

            if (! is_array($data) || count($data) !== count($inputs)) {
                self::$lastError = 'The API returned '.(is_array($data) ? count($data) : 0)
                    .' embedding(s) for '.count($inputs).' input(s).';
                self::$lastReason = 'bad_response';

                Log::warning('Help centre embedding returned an unexpected shape');

                return null;
            }

            // ⚠️ Sorted by the index the API reports, not by array order. The
            // response is documented as possibly out of order, and a silently
            // mismatched pairing would attach every article to the wrong vector
            // — which does not error, it just makes search quietly wrong.
            usort($data, fn ($a, $b) => ($a['index'] ?? 0) <=> ($b['index'] ?? 0));

            return array_map(fn ($row) => array_map('floatval', $row['embedding'] ?? []), $data);
        } catch (\Throwable $e) {
            self::$lastError = $e->getMessage();
            self::$lastReason = 'exception';

            Log::warning('Help centre embedding threw', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /** Embed one string. */
    public static function embedOne(string $input): ?array
    {
        $result = self::embed([$input]);

        return $result[0] ?? null;
    }

    /**
     * Cosine similarity, in the range -1..1.
     *
     * Returns 0.0 for mismatched or empty vectors rather than throwing — an
     * article embedded under a previous model has a different dimension, and it
     * should simply not match rather than take the search down.
     */
    public static function similarity(array $a, array $b): float
    {
        $len = count($a);

        if ($len === 0 || $len !== count($b)) {
            return 0.0;
        }

        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        for ($i = 0; $i < $len; $i++) {
            $x = (float) $a[$i];
            $y = (float) $b[$i];
            $dot += $x * $y;
            $normA += $x * $x;
            $normB += $y * $y;
        }

        if ($normA <= 0.0 || $normB <= 0.0) {
            return 0.0;
        }

        return $dot / (sqrt($normA) * sqrt($normB));
    }

    /**
     * Rank visible articles against a question vector.
     *
     * @return array<int, array{article: HelpArticle, score: float}> best first
     */
    public static function rank(array $questionVector, int $limit = 5): array
    {
        if (empty($questionVector)) {
            return [];
        }

        $articles = HelpArticle::query()
            ->visible()
            ->whereNotNull('embedding')
            ->with('category:id,slug,title')
            ->get();

        $scored = [];

        foreach (HelpArticle::withLiveFeatures($articles) as $article) {
            $vector = $article->embedding;

            if (! is_array($vector) || empty($vector)) {
                continue;
            }

            $scored[] = [
                'article' => $article,
                'score' => self::similarity($questionVector, $vector),
            ];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, max(1, $limit));
    }
}
