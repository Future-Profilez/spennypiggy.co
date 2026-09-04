<?php

/**
 * The three ways a creator earns on Spenny Piggy, named once.
 *
 * 🚨 THIS EXISTS BECAUSE THE LIST WAS WRITTEN TWICE AND DRIFTED. The home page's
 * `WaysToGetPaid` and `/creators` both carried their own hand-typed copy of the
 * seven products, in their own order, and in BOTH of them Memberships was the
 * seventh and last card. The client's note (4 Sep 2026) is that Memberships and
 * Paid Requests are what separate this platform from a gifting site, and they
 * were the two a reader reached only by scrolling past five other things.
 *
 * A pillar is NOT a product — it is the SHAPE of the money. Seven products sit
 * under three shapes, and the shape is what a creator is choosing between:
 *
 *   recurring — the same amount every month, from the same people
 *   requests  — a price for a specific thing somebody asks for
 *   listings  — a one-off sale of something already made
 *
 * ⚠️ `route` is a route NAME or null. Null renders the card without a link
 * rather than pointing at a page that does not exist yet — the same rule
 * `creators/Index.jsx` already follows for its reasons grid. Paid requests and
 * listings have no landing page of their own today; when one ships, name it
 * here and every surface picks it up.
 *
 * ⚠️ The accents are the home page's own three (`Ledger.jsx` ACCENT), not a
 * palette invented for this file.
 */

return [

    'pillars' => [

        [
            'key' => 'memberships',
            'name' => 'Memberships',
            'shape' => 'Recurring monthly revenue',
            'line' => 'Supporters pay you the same amount every month for ongoing access. Income that carries over instead of restarting.',
            'products' => 'Memberships · Recurring content',
            'accent' => '#05EFB8',
            'route' => 'creators.memberships',
        ],

        [
            'key' => 'requests',
            'name' => 'Paid requests',
            'shape' => 'Paid for a specific ask',
            'line' => 'Somebody asks for something particular and pays your price for it. You set what you will make and what it costs.',
            'products' => 'Paid requests',
            'accent' => '#FF007F',
            'route' => null,
        ],

        [
            'key' => 'listings',
            'name' => 'Content listings',
            'shape' => 'Sold direct to supporters',
            'line' => 'List what you have already made and sell it straight to the people who follow you. No middle step.',
            'products' => 'Exclusive content · Content goals · Piggy Bank · Your shop',
            'accent' => '#8C52FF',
            'route' => 'creators.features',
        ],

    ],

];
