<?php

namespace App\Http\Controllers;

use App\SeoMeta;
use App\Support\ComparisonFeePayload;
use App\Support\MonetisationPillars;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The `/creators/*` landing pages that need server-side data.
 *
 * The rest of that family are closures in `routes/web.php`. A page belongs here
 * once it reads config the front end must not retype — this one prints the
 * membership benefit list and the platform's own fee example, and both have to
 * come from the files that actually govern them.
 */
class CreatorLandingController extends Controller
{
    /**
     * /creators/memberships — the recurring-revenue landing page.
     *
     * Client note, 4 Sep 2026: memberships are the platform's answer to
     * "starting from £0 every month", and they had no page of their own — the
     * whole product was one card, seventh of seven, on two other pages.
     *
     * 🚨 THE BENEFIT LIST IS NOT WRITTEN IN THE PAGE. It is `config/rewards.php`
     * `perks`, which is the same list `AddMembership` renders and the same list
     * `RewardService` validates against. A page that retypes them advertises
     * benefits the form may not offer, and nothing anywhere would report it.
     *
     * 🚨 `on_platform_perks` IS SENT SEPARATELY BECAUSE IT IS A RULE, NOT A
     * PREFERENCE. A recurring content subscription must deliver content on this
     * platform (Stripe content-first compliance), so
     * `MembershipController::withDefaultOnPlatformContent` adds the monthly
     * content bundle when a creator picks none. The page has to say that out
     * loud — a creator who reads "pick whichever benefits you like" and then
     * finds a benefit they did not choose on their own listing was misled by us.
     */
    public function memberships(): Response
    {
        $this->titleAndDescription(
            'Creator memberships — turn supporters into monthly members | Spenny Piggy',
            'Set up a membership in three steps and earn the same amount every month. Choose a tier, choose what members get, set your monthly price. You keep 100% of your listed price.'
        );

        $perks = (array) config('rewards.perks', []);
        $onPlatform = (array) config('rewards.on_platform_perks', []);

        return Inertia::render('creators/Memberships', [
            'perks' => array_map(
                static fn (string $key, string $label): array => [
                    'key' => $key,
                    'label' => $label,
                    'onPlatform' => in_array($key, $onPlatform, true),
                ],
                array_keys($perks),
                array_values($perks),
            ),
            'fees' => ComparisonFeePayload::build($this->displayCurrency()),
            'threeTierLine' => config('comparison_fees.three_tier_line'),
            'pillars' => MonetisationPillars::forInertia(),
        ]);
    }

    /**
     * The currency the reader is browsing in, where the site knows one.
     *
     * ⚠️ Display only — it selects which currency the fee example is shown in
     * and changes no charge and no rate. Lifted from `ComparisonController`,
     * which owns the same read for the same block.
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
     * 🚨 THE PAGE'S OWN `<Head title>` IS NOT ENOUGH. `SeoMeta` always renders
     * its own default title and its output sits ABOVE `@inertiaHead`, so a page
     * that sets only the Inertia title ships TWO <title> elements with the
     * generic one FIRST — and that is the one a crawler takes. Measured, not
     * assumed; see `ComparisonController` for the original note.
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
