<?php

namespace App\Http\Controllers;

use App\SeoMeta;
use App\Services\Discovery\BirthdayDiscoveryService;
use App\Support\DiscoverySources;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Discovery Phase 4 — the "Birthdays This Week" collection on Discover.
 *
 * 🚨 THE PAGE IS ALWAYS LIVE; ITS CONTENT IS WHAT IS GATED. The brief asks for a
 * "greyed / Coming soon tile until enough opted-in creators exist", and the
 * feature is already advertised as COMING SOON on three marketing pages — so
 * this route must answer, not 404. Below `collection_min_creators` eligible
 * creators the page renders its coming-soon state; at or above it, real cards.
 * The state answers to the DATA, not to a flag somebody has to remember.
 *
 * ⚠️ Deliberately NOT gated on the two sending flags. Those switch e-mail off;
 * they say nothing about whether a public collection page may exist. A page that
 * disappeared when sending was off would break the "Discover more birthdays"
 * link in an e-mail sent the moment it was turned on.
 *
 * 🚨 THE BIRTH YEAR IS NEVER DISPLAYED. The props come straight from
 * `BirthdayDiscoveryService::card()`, whose whitelist carries a day-and-month
 * `birthday_label` and no year — the column is not even selected.
 *
 * 🚨 CREATOR EARNINGS ARE NEVER SHOWN, and the order is a seeded weekly rotation
 * rather than any commercial ranking. See the service.
 */
class BirthdayDiscoveryController extends Controller
{
    public function index(Request $request, BirthdayDiscoveryService $birthdays)
    {
        $weekStart = BirthdayDiscoveryService::weekStart(now());
        $weekEnd = $weekStart->copy()->addDays(6);

        // The same seeded rotation the Monday e-mail uses, from the same cache
        // key — so a supporter clicking "Discover more birthdays" lands on the
        // page they were just shown, in the same order.
        $creators = $birthdays->featuredForWeek($weekStart);

        $minimum = $birthdays->collectionMinCreators();
        $ready = count($creators) >= $minimum;

        /*
         * ⚠️ `SeoMeta` has no `setTitle`/`setDescription` — the title is set
         * through `addTag('title', …)` (which REPLACES, where every other tag
         * appends) and the description is a plain meta tag. Getting that wrong
         * appends a second <title> rather than failing.
         */
        SeoMeta::addTag('title', 'Birthdays This Week | Spenny Piggy');
        SeoMeta::addTag('meta', [
            'name' => 'description',
            'content' => 'Creators with a birthday this week on Spenny Piggy. See what they have published.',
        ]);
        SeoMeta::setCanonical(url('/discover/birthdays'));

        /*
         * ⚠️ `noindex` while the collection is not ready. A greyed page listing
         * nothing is not a search result anybody benefits from, and indexing it
         * now means Google holds the coming-soon copy for weeks after the real
         * page goes live.
         */
        if (! $ready) {
            SeoMeta::setRobots('noindex,follow');
        }

        return Inertia::render('discover/Birthdays', [
            /*
             * ⚠️ Cards are only sent when the page is READY. Handing the
             * component a short list plus a boolean invites a future edit that
             * renders "just the two we have" behind the coming-soon copy — the
             * exact thing the minimum exists to prevent.
             *
             * 🚨 Tagged server-side with `birthdays-this-week`. The component
             * could build the link with `discoveryLink()`, but the e-mail cannot,
             * and one source of truth for the tag beats two — a surface that is
             * not tagged is invisible for ever, with no backfill.
             */
            'creators' => $ready
                ? array_values(BirthdayDiscoveryService::tag($creators, 'birthdays-this-week'))
                : [],
            'ready' => $ready,
            // 🚨 Day and month only, both ends. No year.
            'weekLabel' => $weekStart->format('j M').' – '.$weekEnd->format('j M'),
            /*
             * How many more are needed. Shown as a quiet line on the coming-soon
             * state so the page explains itself instead of just being grey.
             * ⚠️ It reveals only a COUNT of opted-in creators, never who they are
             * — a creator who has not opted in is not named here, and neither is
             * one who has.
             */
            'needed' => max(0, $minimum - count($creators)),
            'discoverUrl' => route('discover'),
            /*
             * Exposed so the page can name the source it tags with, for the same
             * reason the JS helper mirrors the PHP list: a key the client offers
             * that the server refuses is dropped in silence.
             */
            'source' => DiscoverySources::normalise('birthdays-this-week'),
        ]);
    }
}
