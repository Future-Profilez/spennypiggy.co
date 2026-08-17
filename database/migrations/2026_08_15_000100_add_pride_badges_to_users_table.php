<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pride badges get their OWN column, deliberately not a second key inside
 * `users.creator_category`.
 *
 * 🚨 These are GDPR Article 9 special-category data (sexual orientation and
 * gender identity). Two SEO keyword builders concatenate `creator_category`
 * straight into a public `<meta name="keywords">` tag — see
 * `SeoTemplateService::setCreatorMeta()` and
 * `AuthenticatedSessionController::setSeoMetaTags()` — so sharing that column
 * would publish a creator's identity to every crawler the moment they picked a
 * badge. A separate column makes the exclusion structural: a surface has to ASK
 * for this data, rather than a reviewer having to remember to strip it.
 *
 * Nullable, and NOT added to `User::$fillable` — both write paths set it
 * explicitly after validating against `App\Support\Badges`, so it can never be
 * set by a stray `update($request->all())`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'pride_badges')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            // longText to match `creator_category`, which every reader on both
            // apps already handles as "JSON, possibly stored as a string".
            $table->longText('pride_badges')->nullable()->after('creator_category');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'pride_badges')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pride_badges');
        });
    }
};
