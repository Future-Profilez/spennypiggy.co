<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $row = DB::table('risk_settings')
            ->where('key', 'risk_consequences')
            ->first();

        if (! $row) {
            return;
        }

        if ($row->last_updated_by !== null && $row->last_updated_by !== '') {
            return;
        }

        $value = json_decode($row->value, true);
        if (! is_array($value)) {
            return;
        }

        if (! array_key_exists('low_payout_delay', $value)) {
            return;
        }

        $lowDelay = (int) $value['low_payout_delay'];
        if ($lowDelay === 0) {
            return;
        }

        $value['low_payout_delay'] = 0;

        DB::table('risk_settings')
            ->where('key', 'risk_consequences')
            ->update([
                'value' => json_encode($value),
                'updated_at' => now(),
            ]);

        DB::table('creator_metrics')
            ->where(function ($q) {
                $q->whereNull('is_overridden')->orWhere('is_overridden', false);
            })
            ->where(function ($q) {
                $q->whereNull('risk_level')->orWhere('risk_level', 'low');
            })
            ->where('reserve_percent', 0)
            ->update([
                'payout_delay_days' => 0,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        $row = DB::table('risk_settings')
            ->where('key', 'risk_consequences')
            ->first();

        if (! $row) {
            return;
        }

        if ($row->last_updated_by !== null && $row->last_updated_by !== '') {
            return;
        }

        $value = json_decode($row->value, true);
        if (! is_array($value)) {
            return;
        }

        $value['low_payout_delay'] = 7;

        DB::table('risk_settings')
            ->where('key', 'risk_consequences')
            ->update([
                'value' => json_encode($value),
                'updated_at' => now(),
            ]);

        DB::table('creator_metrics')
            ->where(function ($q) {
                $q->whereNull('is_overridden')->orWhere('is_overridden', false);
            })
            ->where(function ($q) {
                $q->whereNull('risk_level')->orWhere('risk_level', 'low');
            })
            ->where('reserve_percent', 0)
            ->update([
                'payout_delay_days' => 7,
                'updated_at' => now(),
            ]);
    }
};
