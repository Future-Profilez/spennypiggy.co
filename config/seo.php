<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Search indexing
    |--------------------------------------------------------------------------
    |
    | Whether this environment may appear in search results.
    |
    | dev.spennypiggy.co was fully indexed by Google — a publicly reachable host
    | serving the same pages as production, competing with it in results and
    | showing unreleased work to anyone who found it.
    |
    | Default is "production only". The environment name is the check because it
    | is the one value every deployment already sets correctly; SEO_INDEXABLE is
    | the escape hatch for a host that is production by another name.
    |
    | ⚠️ Turning this off does NOT remove pages already in the index. Google has
    | to CRAWL a page to see the noindex on it, so a disallowed page keeps its
    | existing listing indefinitely. That is why robots.txt stays permissive on a
    | non-indexable host: allow the crawl, serve noindex, let the pages drop out.
    | Blocking the crawler instead is what freezes them in place.
    |
    */

    'indexable' => env('SEO_INDEXABLE', env('APP_ENV') === 'production'),

];
