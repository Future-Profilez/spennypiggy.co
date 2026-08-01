<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fourteen `users` columns exist on every deployed database but had no migration, so a database
 * built from migrations alone did not have them and `php artisan migrate:fresh` produced a schema
 * the application could not register a user against — the first insert died on
 * "table users has no column named gender", then on `creator_category`, and so on.
 *
 * That is why `store()` has never had a feature test: it could not run. `RegistrationValidationTest`
 * only exercises the validation endpoint, which touches none of these.
 *
 * Same class of gap as `users.role` (fixed by 2026_06_23_000000) and `users.cover_approved`
 * (fixed by 2026_07_27_000002), and fixed the same way. Every column is added individually and
 * guarded with `hasColumn`, so this is a **no-op on every real environment** — it exists to bring
 * a fresh database in line with the deployed ones, nothing more.
 *
 * Types and defaults were read from the production schema, not guessed.
 */
return new class extends Migration
{
    /**
     * column => closure that adds it. Kept as data so the guard cannot be forgotten for one of
     * them, which is how the list drifted in the first place.
     */
    private function columns(): array
    {
        return [
            // Pronoun: he / she / they. Optional at signup, so nullable.
            'gender' => fn (Blueprint $t) => $t->string('gender', 20)->nullable(),
            // The Google2FA secret generated at registration.
            'tfa_key' => fn (Blueprint $t) => $t->string('tfa_key')->nullable(),
            'is_2fa' => fn (Blueprint $t) => $t->tinyInteger('is_2fa')->default(0),
            // Identity/KYC provider references.
            'applicant_id' => fn (Blueprint $t) => $t->string('applicant_id')->nullable(),
            'inspection_id' => fn (Blueprint $t) => $t->string('inspection_id')->nullable(),
            'kyc_verification_status' => fn (Blueprint $t) => $t->tinyInteger('kyc_verification_status')->default(0),
            // JSON array of the creator's chosen categories.
            'creator_category' => fn (Blueprint $t) => $t->longText('creator_category')->nullable(),
            'min_surprise_amount' => fn (Blueprint $t) => $t->double('min_surprise_amount')->default(0),
            'promo_code_id' => fn (Blueprint $t) => $t->unsignedBigInteger('promo_code_id')->nullable(),
            'notification_send' => fn (Blueprint $t) => $t->tinyInteger('notification_send')->default(1),
            'push_noti_enabled' => fn (Blueprint $t) => $t->tinyInteger('push_noti_enabled')->nullable()->default(0),
            'passwordless_login_token' => fn (Blueprint $t) => $t->string('passwordless_login_token')->nullable(),
            'vat_amount_percentage' => fn (Blueprint $t) => $t->integer('vat_amount_percentage')->nullable(),
            'show_piggy_bank' => fn (Blueprint $t) => $t->tinyInteger('show_piggy_bank')->default(0),
            'profile_reject_reason' => fn (Blueprint $t) => $t->longText('profile_reject_reason')->nullable(),
        ];
    }

    public function up(): void
    {
        $missing = array_filter(
            $this->columns(),
            fn ($_, $column) => ! Schema::hasColumn('users', $column),
            ARRAY_FILTER_USE_BOTH
        );

        if ($missing === []) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($missing) {
            foreach ($missing as $add) {
                $add($table);
            }
        });
    }

    public function down(): void
    {
        // Intentionally empty. This migration only ever adds what a deployed database already
        // has, so rolling it back would drop columns holding live data.
    }
};
