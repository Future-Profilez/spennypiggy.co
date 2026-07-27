<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FixWebauthnCredentialsUserId extends Migration
{
    public function up()
    {
        Schema::table('webauthn_credentials', function (Blueprint $table) {
            // If user_id exists but is not being used properly
            if (Schema::hasColumn('webauthn_credentials', 'user_id')) {
                // Update any null user_id to use authenticatable_id
                DB::table('webauthn_credentials')
                    ->whereNull('user_id')
                    ->whereNotNull('authenticatable_id')
                    ->update([
                        'user_id' => DB::raw('authenticatable_id'),
                    ]);
            }
        });
    }

    public function down()
    {
        // No need to revert
    }
}
