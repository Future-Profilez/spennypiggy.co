<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddCredentialIdToWebauthnCredentials extends Migration
{
    public function up()
    {
        Schema::table('webauthn_credentials', function (Blueprint $table) {
            // Check if column doesn't exist before adding
            if (! Schema::hasColumn('webauthn_credentials', 'credential_id')) {
                $table->string('credential_id')->nullable()->after('id');
            }
        });

        // Copy id values to credential_id for existing records
        DB::table('webauthn_credentials')->update([
            'credential_id' => DB::raw('id'),
        ]);
    }

    public function down()
    {
        Schema::table('webauthn_credentials', function (Blueprint $table) {
            if (Schema::hasColumn('webauthn_credentials', 'credential_id')) {
                $table->dropColumn('credential_id');
            }
        });
    }
}
