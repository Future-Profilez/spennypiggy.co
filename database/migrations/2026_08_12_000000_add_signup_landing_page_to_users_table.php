<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which paid-ads landing page a creator signed up from.
 *
 * `users.utm_source` already records the CHANNEL that paid for the click. This
 * records the PAGE that earned it — the two are different questions, and only
 * this one can answer "is the Founder Bonus advert converting better than the
 * Keep 100% one", which is the whole reason six separate ad landing pages
 * exist.
 *
 * Values are the page types in `VisitTracker::AD_LANDING_ROUTES`, so the admin
 * funnel can join signups here against visits in `site_visit_stats.page_type`
 * with no mapping table in between.
 *
 * NULL means the signup did not come through an ad landing page — which is
 * most of them, and is not the same as "unknown".
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'signup_landing_page')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            // Indexed: the admin report groups by it across the whole user
            // table, and it is a low-cardinality column on a table that only
            // grows.
            $table->string('signup_landing_page', 32)->nullable()->index();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'signup_landing_page')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['signup_landing_page']);
            $table->dropColumn('signup_landing_page');
        });
    }
};
