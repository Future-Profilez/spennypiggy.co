<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('risk_identities', function (Blueprint $table) {
            $cols = [];
            foreach (['trust_tier_locked', 'trust_tier'] as $c) {
                if (Schema::hasColumn('risk_identities', $c)) {
                    $cols[] = $c;
                }
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }

    public function down(): void
    {
        Schema::table('risk_identities', function (Blueprint $table) {
            if (! Schema::hasColumn('risk_identities', 'trust_tier')) {
                $table->unsignedTinyInteger('trust_tier')->default(0)->after('is_guest');
            }
            if (! Schema::hasColumn('risk_identities', 'trust_tier_locked')) {
                $table->boolean('trust_tier_locked')->default(false)->after('trust_tier');
            }
        });
    }
};
