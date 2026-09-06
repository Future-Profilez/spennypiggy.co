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
        /*
         * 🚨 THE POOL. Comma-separated, as many as you have — the code does not
         * care whether that is one, two or five.
         *
         *   HELP_AI_API_KEYS=gsk_aaa...,gsk_bbb...
         *
         * ⚠️ A FREE TIER'S QUOTA IS PER ACCOUNT, NOT PER KEY. Two keys minted
         * in ONE provider account share one daily allowance, so they run out
         * together and the failover buys nothing. Real capacity means separate
         * accounts (and check the provider's terms allow one person to hold
         * more than one). The pool deduplicates identical keys for the same
         * reason — the same string twice is not two accounts.
         *
         * ⚠️ Keys may point at DIFFERENT hosts only if those hosts serve the
         * same model names, because `base_url` and the model names below are
         * shared by the whole pool. Mixing providers means a second install,
         * not a second key.
         */
        'keys' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('HELP_AI_API_KEYS', ''))
        ))),

        /*
         * The single-key form. Still supported, and still what
         * `config('help.ai.api_key')` answers — the pool falls back to it when
         * HELP_AI_API_KEYS is empty, so an existing environment needs no change.
         */
        'api_key' => env('HELP_AI_API_KEY') ?: (
            // The OpenAI keys are only a sensible fallback when the endpoint
            // IS OpenAI. Against any other host they produce a 401 that reads
            // as "the key is wrong" — and the person who set HELP_AI_BASE_URL
            // to Groq and left HELP_AI_API_KEY blank would never guess why.
            str_contains(env('HELP_AI_BASE_URL', 'https://api.openai.com/v1'), 'api.openai.com')
                ? (env('OPENAI_API_KEY') ?: env('DALLE_SECRET_KEY'))
                : null
        ),

        /*
         * Any OpenAI-COMPATIBLE host: the same /chat/completions and
         * /embeddings request and response shapes. Known to work:
         *
         *   OpenAI  https://api.openai.com/v1                              (default)
         *   Groq    https://api.groq.com/openai/v1                         (free tier)
         *   Gemini  https://generativelanguage.googleapis.com/v1beta/openai (free tier)
         *
         * ⚠️ Changing the host means changing BOTH model names below to ones
         * that host serves, then `php artisan help:embed` — the embedding hash
         * includes the model name, so every article re-embeds automatically.
         *
         * ⚠️ `min_similarity` was tuned against text-embedding-3-small. A
         * different embedding model has a different score distribution; after
         * switching, ask a few real questions and read the `confidence` the
         * endpoint returns before trusting the threshold.
         *
         * 🚨 A FREE TIER IS NOT FREE OF CONSEQUENCES. Read the provider's data
         * policy before pointing this at one: /help/ask receives supporters'
         * own words about their own payments, and a free tier that trains on
         * inputs is receiving those. That is a decision for the platform, not
         * a default this file can make.
         */
        'base_url' => rtrim(env('HELP_AI_BASE_URL', 'https://api.openai.com/v1'), '/'),

        /*
         * How long a credential is stood down for after the provider refuses it.
         *
         * ⚠️ A 429's own `Retry-After` header ALWAYS WINS over `rate_limited`
         * below — only the provider knows when its quota actually resets. These
         * are the fallbacks for when it does not say.
         *
         * `auth` is deliberately long and deliberately loud: a refused key is a
         * configuration fault that will not fix itself, and retrying it every
         * ten minutes forever just buries the error line that says so.
         *
         * ⚠️ There is deliberately NO cooldown for a 5xx or a dropped connection.
         * That is the provider's bad minute, not the key's — the request moves
         * to the next key and nothing is remembered.
         */
        'cooldown' => [
            'rate_limited' => (int) env('HELP_AI_COOLDOWN_RATE_LIMITED', 600),
            'auth' => (int) env('HELP_AI_COOLDOWN_AUTH', 3600),
            // Floor for a provider-supplied Retry-After — "1 second" is true and
            // useless, and retrying that fast just spends the next request.
            'min' => (int) env('HELP_AI_COOLDOWN_MIN', 5),
            // Ceiling for the same value. A provider that answers "retry in 30
            // days" must not take Ask AI out for a month.
            'max' => (int) env('HELP_AI_COOLDOWN_MAX', 86400),
        ],

        'embedding_model' => env('HELP_AI_EMBEDDING_MODEL', 'text-embedding-3-small'),

        /*
         * How the articles for a question are found.
         *
         *   vector   — embeddings + cosine similarity (needs an embedding model
         *              on the same host, and `help:embed` to have run)
         *   keyword  — the help centre's own search (HelpSearch) picks the
         *              articles; the chat model writes the answer from them
         *
         * 🚨 GROQ HAS NO EMBEDDING MODEL (measured 5 Sep 2026 — 14 models on the
         * free tier, none of them embeddings). On Groq this MUST be `keyword`,
         * or every question fails at the embedding step and Ask AI only ever
         * shows links. The grounding rules are identical either way: the model
         * still answers only from the retrieved articles, and NO_ANSWER still
         * guards relevance. What changes is the retriever's tolerance for
         * phrasing — keyword search stems lightly, vectors understand meaning.
         */
        'retriever' => env('HELP_AI_RETRIEVER', 'vector'),
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

        /*
         * Hard ceiling on the generated answer. The answer's LENGTH is set by
         * the prompt's style rules (four sentences); this is a safety stop.
         *
         * 🚨 A REASONING MODEL SPENDS THIS ON THINKING FIRST. On Groq,
         * `openai/gpt-oss-*` counts its reasoning tokens against `max_tokens`,
         * so at 200 the visible answer was cut mid-sentence ("held for 30 ")
         * while the thinking used the budget — measured live, 5 Sep 2026. 400
         * leaves room for low-effort reasoning plus four sentences; the prompt
         * keeps the visible part short either way.
         */
        'max_tokens' => (int) env('HELP_AI_MAX_TOKENS', 400),

        /*
         * `low` | `medium` | `high` | null. Sent as `reasoning_effort` ONLY
         * when set — OpenAI's chat models reject unknown parameters with a
         * 400, so it must never be sent to a model that does not take it. For
         * Groq's gpt-oss it is what stops a four-sentence answer costing a
         * thousand tokens of thinking; `low` is right for "read three articles,
         * answer in prose".
         */
        'reasoning_effort' => env('HELP_AI_REASONING_EFFORT') ?: null,

        // Seconds, per attempt. A help search that hangs is worse than one that
        // falls back.
        'timeout' => (int) env('HELP_AI_TIMEOUT', 12),

        /*
         * 🚨 Seconds for a WHOLE pooled call, however many keys it tries.
         *
         * Without this, worst case is `timeout × keys` — so adding a key made
         * the page slower, and three keys at 12s each is 72 seconds against a
         * 60-second Lambda. HelpAnswer makes TWO pooled calls (embed, then
         * chat), so the real ceiling is roughly twice this: keep 2 × budget
         * comfortably inside the Lambda limit.
         */
        'request_budget' => (int) env('HELP_AI_REQUEST_BUDGET', 18),

        // Per-IP hourly cap on generated answers. Each one costs money and the
        // endpoint is public and unauthenticated.
        'rate_limit_per_hour' => (int) env('HELP_AI_RATE_LIMIT', 15),

        /*
         * Follow-up questions — the chat panel.
         *
         * 🚨 NOTHING IS STORED. The browser sends the conversation so far with
         * each follow-up, bounded here, and the server keeps no copy. Every
         * turn is answered from freshly retrieved articles; earlier turns are
         * CONTEXT for what "it" and "that" refer to, never a source of facts.
         *
         * ⚠️ A follow-up is never cached (it depends on the conversation), so
         * every one is a paid generation. `max_turns` is what stops one chat
         * from spending a free tier's day.
         */
        'chat' => [
            // User questions per conversation, including the current one.
            'max_turns' => (int) env('HELP_AI_CHAT_MAX_TURNS', 6),
            // Total characters of earlier turns sent as context, trimmed from
            // the OLDEST. Roughly 400 tokens on top of the articles.
            'max_history_chars' => (int) env('HELP_AI_CHAT_HISTORY_CHARS', 1500),
            // Per message, validated at the edge. An assistant turn is at most
            // four sentences; a user turn is the question cap.
            'max_message_chars' => 600,
        ],
    ],

];
