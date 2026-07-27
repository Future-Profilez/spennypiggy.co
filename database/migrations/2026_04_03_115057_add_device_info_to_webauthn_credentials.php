<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('webauthn_credentials', function (Blueprint $table) {

            $table->string('device_name')
                ->nullable()
                ->after('transports');

            $table->string('browser')
                ->nullable();

            $table->string('platform')
                ->nullable();

            $table->string('ip_address')
                ->nullable();

            $table->text('user_agent')
                ->nullable();

            $table->timestamp('last_used_at')
                ->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('webauthn_credentials', function (Blueprint $table) {

            $table->dropColumn([

                'device_name',
                'browser',
                'platform',
                'ip_address',
                'user_agent',
                'last_used_at',

            ]);
        });
    }
};
