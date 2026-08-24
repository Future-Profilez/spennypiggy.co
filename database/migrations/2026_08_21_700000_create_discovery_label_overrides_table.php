<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The no-deploy KILL SWITCH for a Discovery marketing label.
 *
 * Developer Master Plan, 19 Aug 2026, §F: "Feature flags for anything 'Coming
 * soon'. Flip = config change, no deploy."
 *
 * 🚨 WHY THIS EXISTS AT ALL: `config/discovery.php` holds 26 labels and 25 of
 * them are hardcoded strings. On Vapor a config edit IS a deploy, and so is an
 * environment change — so the rule above was never actually satisfied, only
 * made cheaper. That gap is recorded in the config file itself and in the
 * Infrastructure Scaling Plan. This table closes it.
 *
 * 🚨 IT CAN ONLY TURN A LABEL OFF, NEVER ON — and that is the whole design, not
 * a limitation.
 *
 * Marking something LIVE NOW is a PUBLIC CLAIM on three marketing pages, and the
 * standing client prohibition is that nothing may be labelled live that is not
 * live in the product. `DiscoveryMarketingTest` enforces that by requiring every
 * live key to carry recorded evidence — and it reads the CONFIG. A database
 * switch that could set `live` would walk straight past that guard, which is the
 * one thing standing between a marketing page and a false claim.
 *
 * Turning a label OFF needs no evidence and is the safe direction: it can only
 * ever under-claim. It is also the urgent case — "this is showing something it
 * should not, hide it now" — while turning one on has never been urgent.
 *
 * ⚠️ A MISSING ROW MEANS "USE THE CONFIG". The table ships empty and every label
 * behaves exactly as it does today. Same rule as the collection switches.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('discovery_label_overrides')) {
            return;
        }

        Schema::create('discovery_label_overrides', function (Blueprint $table) {
            $table->id();

            // A key from `config('discovery.labels')`.
            $table->string('label_key', 60)->unique();

            /*
             * ⚠️ THERE IS NO `state` COLUMN, DELIBERATELY. A row means "force
             * this label to COMING SOON"; there is no other value it could hold,
             * and a column offering one would be an invitation to add `live`
             * later without re-reading why that is unsafe.
             */
            $table->string('note', 500);

            $table->unsignedBigInteger('created_by_admin_id')->nullable();
            $table->string('created_by_name', 120)->nullable();

            $table->timestamps();
        });
    }

    /**
     * ⚠️ Dropping the table restores every label to its config value, which is
     * the safe direction only because the config can never over-claim without
     * the evidence test failing first.
     */
    public function down(): void
    {
        Schema::dropIfExists('discovery_label_overrides');
    }
};
