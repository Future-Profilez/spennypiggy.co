<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI-assisted answers
    |--------------------------------------------------------------------------
    |
    | The help centre can answer a question written in ordinary language by
    | retrieving the closest articles and having a model write an answer FROM
    | THOSE ARTICLES ONLY.
    |
    | 🚨 The model never answers from its own knowledge. This help centre states
    | fees, payout timing and reserve rules; a model inventing "10% every month"
    | is materially worse than no answer at all. Every guardrail below exists for
    | that reason and none of them is decorative.
    |
    | ⚠️ `enabled` defaults to FALSE. It is switched on deliberately, per
    | environment, once the corpus has been embedded — an AI answer over three
    | articles is worse than the keyword search it replaces.
    |
    */

    'ai' => [
        'enabled' => (bool) env('HELP_AI_ENABLED', false),

        /*
         * The platform's OpenAI credential.
         *
         * ⚠️ ONE OpenAI KEY DOES EVERYTHING — images, chat and embeddings are
         * all the same credential. There is no separate "DALL·E key". The
         * existing variable is named DALLE_SECRET_KEY for historical reasons
         * only, and OpenAIContentService already uses that same key against
         * /v1/chat/completions, so the name has been misleading for a while.
         *
         * OPENAI_API_KEY is preferred and checked first; DALLE_SECRET_KEY still
         * works so nothing has to be changed on any existing environment.
         *
         * ⚠️ Read through config(), never env() — env() returns null once Vapor
         * caches config on deploy, and the feature would silently stop working
         * on exactly the environment that matters.
         */
        'api_key' => env('OPENAI_API_KEY') ?: env('DALLE_SECRET_KEY'),

        'embedding_model' => env('HELP_AI_EMBEDDING_MODEL', 'text-embedding-3-small'),
        'answer_model' => env('HELP_AI_ANSWER_MODEL', 'gpt-4o-mini'),

        // Longest question accepted. A genuine help question fits easily; the
        // cap stops a pasted essay becoming an expensive embedding plus an
        // expensive prompt.
        'max_question_length' => (int) env('HELP_AI_MAX_QUESTION', 200),

        // 🚨 THE MAIN COST LEVER — this is input tokens, and input is most of
        // the bill. Three articles is enough to answer well; five sent roughly
        // 60% more text for answers that were not better.
        'context_articles' => (int) env('HELP_AI_CONTEXT_ARTICLES', 3),

        // Each context article is truncated to this many characters. A long
        // article's answer is almost always in its opening; sending 4,000
        // characters to quote two sentences is most of the waste.
        'max_context_chars' => (int) env('HELP_AI_MAX_CONTEXT_CHARS', 1400),

        // 🚨 Below this cosine similarity the best match is not close enough to
        // answer from, and the endpoint returns keyword results instead of a
        // generated answer. A confident answer built from irrelevant articles is
        // the single worst thing this feature can produce.
        'min_similarity' => (float) env('HELP_AI_MIN_SIMILARITY', 0.28),

        // Answers are cached per normalised question. Help questions repeat
        // heavily — "when do I get paid" is asked by everyone — so a week means
        // the platform pays for each distinct question roughly once.
        // ⚠️ An article edit does NOT invalidate this. Run `cache:clear` after a
        // material content change, or a stale answer survives the week.
        'cache_ttl' => (int) env('HELP_AI_CACHE_TTL', 604800),

        // Hard ceiling on the generated answer. It is a short answer that points
        // at articles, never a replacement for reading them — roughly 4 short
        // sentences.
        'max_tokens' => (int) env('HELP_AI_MAX_TOKENS', 200),

        // Seconds. A help search that hangs is worse than one that falls back.
        'timeout' => (int) env('HELP_AI_TIMEOUT', 12),

        // Per-IP hourly cap on generated answers. Each one costs money and the
        // endpoint is public and unauthenticated.
        'rate_limit_per_hour' => (int) env('HELP_AI_RATE_LIMIT', 15),
    ],

];
