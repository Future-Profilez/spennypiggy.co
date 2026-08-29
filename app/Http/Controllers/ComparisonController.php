<?php

namespace App\Http\Controllers;

use App\SeoMeta;
use App\Support\ComparisonFeePayload;
use App\Support\CompetitorSheet;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The /creators/vs/* comparison pages and their index.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026.
 *
 * One template, one config file per competitor. The slug IS the config file
 * name, so an unknown slug has nothing to look up and can only 404.
 */
class ComparisonController extends Controller
{
    /**
     * One comparison page.
     *
     * 🚨 AN UNPUBLISHED SHEET IS A 404 IN PRODUCTION AND VISIBLE EVERYWHERE
     * ELSE. Every sheet ships `published => false` and goes live only after
     * Jack has cleared its "verify" rows against the competitor's live pages —
     * and he does that by reading the built page on the development host. A
     * flag that hid the page from him as well would mean reviewing a config
     * file instead of the thing being published.
     *
     * ⚠️ `dev.spennypiggy.co` runs as `development`, not `production`, so a
     * draft is reachable there. That host is already `noindex` sitewide via
     * `config('seo.indexable')`, so a draft cannot be indexed.
     */
    public function show(string $slug): Response
    {
        $sheet = CompetitorSheet::find($slug);

        abort_if($sheet === null, 404);
        abort_if(! $sheet->isPublished() && app()->isProduction(), 404);

        $this->titleAndDescription($sheet->get('metaTitle'), $sheet->get('metaDescription'));

        return Inertia::render($sheet->component(), [
            'wishtenderLive' => $this->wishtenderPublished(),
            'competitor' => [
                'slug' => $sheet->slug,
                'name' => $sheet->name(),
                'what' => $sheet->get('what'),
                'heroSubline' => $sheet->get('heroSubline'),
                'betterAt' => $sheet->get('betterAt'),
                'switchSteps' => $sheet->get('switchSteps'),
                'callout' => $sheet->get('callout'),
                'example' => $sheet->get('example'),
                'published' => $sheet->isPublished(),

                /*
                 * 🚨 THE SHARE CARD, AND IT HAS TO COME FROM HERE. There is no
                 * `$seoData` entry for `/creators/vs/*` — that map matches on an
                 * EXACT path, so one entry could never cover twenty competitors
                 * and a wildcard would give them all one description. Each sheet
                 * carries its own, and the page's <Head> is the only thing that
                 * emits it. Drop these and every comparison unfurls as a bare
                 * URL, which is the exact fault the two ad pages carried until
                 * 24 Aug 2026.
                 */
                'metaTitle' => $sheet->get('metaTitle'),
                'metaDescription' => $sheet->get('metaDescription'),

                // Generic pages carry their own short table; the case study
                // carries a sourced timeline and a differences table. Each page
                // reads only what its own layout defines.
                'rows' => $sheet->get('rows'),
                'timeline' => $sheet->get('timeline'),
                'differences' => $sheet->get('differences'),
                'consequences' => $sheet->get('consequences'),
                'closingNote' => $sheet->get('closingNote'),
            ],
            'matrix' => $sheet->matrix(),
            'competitorFees' => $sheet->fees(),

            // 🚨 Priced by the live checkout engine, never by the page.
            'fees' => ComparisonFeePayload::build($this->displayCurrency()),

            // The YouPay sheet compares against a different baseline and the
            // spec gives it its own wording rather than bending the shared one.
            'threeTierLine' => config(
                $slug === 'youpay'
                    ? 'comparison_fees.three_tier_line_youpay'
                    : 'comparison_fees.three_tier_line'
            ),
        ]);
    }

    /**
     * Whether the WishTender case study is reachable.
     *
     * 🚨 `RiskBlock` LINKS TO `/creators/vs/wishtender` FROM EVERY PAGE IT
     * RENDERS ON, and that sheet ships as a draft — which `show()` answers with
     * a 404 in production. So a live page carried a link to a 404, on the block
     * whose entire job is to be the trustworthy part of the argument.
     *
     * The link is now gated on the sheet actually being published, so the two
     * can never disagree again: publishing the sheet restores the link, and
     * un-publishing it removes the link in the same move. The sentence beside it
     * stands on its own without a link, so nothing is lost while it is a draft.
     *
     * ⚠️ Wrapped: a comparison page must not 500 because a sibling sheet is
     * malformed. Unreachable is the safe answer.
     */
    private function wishtenderPublished(): bool
    {
        try {
            return (bool) CompetitorSheet::find('wishtender')?->isPublished();
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * /creators/compare — every comparison that is live.
     *
     * ⚠️ Unpublished sheets are absent, not greyed. A card here is a promise
     * that the page behind it is finished.
     */
    public function index(): Response
    {
        $this->titleAndDescription(
            'Compare Spenny Piggy — fees and features, side by side',
            'Every fee from each platform’s own pages, with a link and the date we checked it, next to ours.'
        );

        return Inertia::render('creators/vs/Index', [
            'wishtenderLive' => $this->wishtenderPublished(),
            'comparisons' => array_map(fn (CompetitorSheet $sheet) => [
                'slug' => $sheet->slug,
                'name' => $sheet->name(),
                'what' => $sheet->get('what'),
            ], CompetitorSheet::published()),
        ]);
    }

    /**
     * /creators/wishlist — the wishlist keyword landing page.
     *
     * 🚨 NOT A COMPARISON, and nothing on it is new product. It is the existing
     * seven ways to earn, described for somebody who typed "wishlist" — the
     * keyword cluster currently lands on /creators/features, which never uses
     * the word once. It shares the fee block because that is where a wishlist
     * searcher compares us against what they use now.
     */
    public function wishlist(): Response
    {
        $this->titleAndDescription(
            'Creator wishlist that pays you 100% — Spenny Piggy',
            'A wishlist where supporters buy the content you made, at the price you set. You keep 100% of your listed price, with a delivery record on every wish.'
        );

        return Inertia::render('creators/Wishlist', [
            'wishtenderLive' => $this->wishtenderPublished(),
            'fees' => ComparisonFeePayload::build($this->displayCurrency()),
            'threeTierLine' => config('comparison_fees.three_tier_line'),
        ]);
    }

    /**
     * The currency the reader is browsing in, where the site knows one.
     *
     * ⚠️ Display only. It selects which currency the £1 flat fee and the
     * example are shown in; it changes no charge and no rate.
     */
    private function displayCurrency(): string
    {
        $cookie = request()->cookie('global_currency');

        return is_string($cookie) && preg_match('/^[A-Z]{3}$/', strtoupper($cookie))
            ? strtoupper($cookie)
            : 'GBP';
    }

    /**
     * Set the page's <title> and description SERVER-SIDE.
     *
     * 🚨 THE PAGE'S OWN `<Head title>` IS NOT ENOUGH, AND THIS IS NOT BELT AND
     * BRACES. `SeoMeta` seeds `$tags['title']` with `SeoMeta::DEFAULT_TITLE` and
     * always renders it, and its output sits ABOVE `@inertiaHead` in the layout —
     * so a page that sets only the Inertia title ships TWO <title> elements with
     * the generic site one FIRST, which is the one a crawler takes. Every
     * comparison would have appeared in search as "Spenny Piggy | Creator
     * Content, Memberships…". Measured, not assumed.
     *
     * ⚠️ `SeoMeta` has no `setTitle`; for a title, `addTag`'s SECOND argument is
     * the string itself. Passing an array renders "Array to string conversion".
     */
    private function titleAndDescription(?string $title, ?string $description): void
    {
        if (filled($title)) {
            SeoMeta::addTag('title', $title);
        }

        if (filled($description)) {
            SeoMeta::addTag('meta', ['name' => 'description', 'content' => $description]);
        }
    }
}
