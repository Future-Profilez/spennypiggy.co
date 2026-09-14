<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('creator_referrals')) {
            return;
        }

        Schema::table('creator_referrals', function (Blueprint $table): void {
            if (! Schema::hasColumn('creator_referrals', 'referred_name')) {
                $table->string('referred_name')->nullable()->after('referred_creator_id');
            }

            if (! Schema::hasColumn('creator_referrals', 'referred_username')) {
                $table->string('referred_username')->nullable()->after('referred_name');
            }

            if (! Schema::hasColumn('creator_referrals', 'referred_joined_at')) {
                $table->timestamp('referred_joined_at')->nullable()->after('referred_username');
            }
        });

        // Preserve details for existing referrals before a referred account can
        // disappear. Rows whose user is already gone cannot be reconstructed.
        DB::table('creator_referrals as referrals')
            ->join('users', 'users.id', '=', 'referrals.referred_creator_id')
            ->whereNull('referrals.referred_name')
            ->select([
                'referrals.id',
                'users.name',
                'users.username',
                'users.created_at',
            ])
            ->orderBy('referrals.id')
            ->get()
            ->each(function (object $row): void {
                DB::table('creator_referrals')
                    ->where('id', $row->id)
                    ->update([
                        'referred_name' => $row->name,
                        'referred_username' => $row->username,
                        'referred_joined_at' => $row->created_at,
                    ]);
            });
    }

    public function down(): void
    {
        // Shared production databases may already contain these columns.
    }
};
