<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class AuditExportController extends Controller
{
    /**
     * GET /admin/export/audit-pack
     * Generate ZIP with CSVs
     */
    public function export(Request $request)
    {
        $range = $request->input('range', '30d');
        $days = ($range === '90d') ? 90 : 30;
        $cutoff = Carbon::now()->subDays($days);
        
        $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
        $tempDir = storage_path('app/temp_export_' . $timestamp);
        if (!is_dir($tempDir)) mkdir($tempDir, 0755, true);
        
        // 1. Disputes CSV
        $disputes = \App\Models\Dispute::where('created_at', '>=', $cutoff)->get();
        $this->generateCsv($tempDir . '/disputes.csv', $disputes->toArray());
        
        // 2. Refunds CSV (Payments with status refunded)
        $refunds = \App\Models\Payment::where('status', 'refunded')
            ->where('created_at', '>=', $cutoff)
            ->get();
        $this->generateCsv($tempDir . '/refunds.csv', $refunds->toArray());
        
        // 3. Platform State History
        $states = \App\Models\PlatformRiskState::where('created_at', '>=', $cutoff)->get();
        $this->generateCsv($tempDir . '/platform_states.csv', $states->toArray());
        
        // 4. Confirmation Logs (Step-Up)
        $confLogs = \App\Models\ConfirmationLog::where('created_at', '>=', $cutoff)->get();
        $this->generateCsv($tempDir . '/step_up_logs.csv', $confLogs->toArray());
        
        // 5. Creator Metrics
        $creatorMetrics = \App\Models\CreatorMetric::all();
        $this->generateCsv($tempDir . '/creator_metrics.csv', $creatorMetrics->toArray());
        
        // 6. Top 50 Identities by Spend
        $topIdentities = \App\Models\IdentityRollup::orderBy('spend_30d', 'desc')
            ->take(50)
            ->get();
        // Fallback: If spend_30d doesn't exist, use spend_7d or calculate from payments
        if ($topIdentities->isEmpty() || !isset($topIdentities[0]->spend_30d)) {
            $topIdentities = DB::select("
                SELECT risk_identity_id, SUM(amount) as total_spend, COUNT(id) as tx_count
                FROM payments
                WHERE status = 'succeeded' AND created_at >= ?
                GROUP BY risk_identity_id
                ORDER BY total_spend DESC
                LIMIT 50
            ", [$cutoff]);
        }
        $this->generateCsv($tempDir . '/top_50_identities.csv', is_array($topIdentities) ? json_decode(json_encode($topIdentities), true) : $topIdentities->toArray());

        // 7. Webhook Processing Logs
        if (\Illuminate\Support\Facades\Schema::hasTable('stripe_webhook_status')) {
            $webhooks = \App\Models\StripeWebhookStatus::where('created_at', '>=', $cutoff)
                ->select('event_id', 'event_type', 'created_at')
                ->get();
            $this->generateCsv($tempDir . '/webhook_logs.csv', $webhooks->toArray());
        }

        // 8. Platform Summary
        $txCount = \App\Models\Payment::where('created_at', '>=', $cutoff)->whereIn('status', ['succeeded', 'review_hold', 'refunded', 'disputed'])->count();
        $disputeCount = \App\Models\Dispute::where('created_at', '>=', $cutoff)->count();
        $refundCount = \App\Models\Payment::where('created_at', '>=', $cutoff)->where('status', 'refunded')->count();
        $summary = [
            [
                'metric' => 'Total Transactions',
                'value' => $txCount
            ],
            [
                'metric' => 'Total Disputes',
                'value' => $disputeCount
            ],
            [
                'metric' => 'Dispute Rate (%)',
                'value' => $txCount > 0 ? round(($disputeCount / $txCount) * 100, 3) : 0
            ],
            [
                'metric' => 'Total Refunds',
                'value' => $refundCount
            ],
            [
                'metric' => 'Refund Rate (%)',
                'value' => $txCount > 0 ? round(($refundCount / $txCount) * 100, 3) : 0
            ]
        ];
        $this->generateCsv($tempDir . '/platform_summary.csv', $summary);
        
        // Zip It
        $zipPath = storage_path("app/audit_pack_{$timestamp}.zip");
        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE) === TRUE) {
            $files = glob($tempDir . '/*.csv');
            foreach ($files as $file) {
                $zip->addFile($file, basename($file));
            }
            $zip->close();
        }
        
        // Clean up temp
        array_map('unlink', glob("$tempDir/*.*"));
        rmdir($tempDir);
        
        // Log Audit
        AuditLog::create([
            'actor' => $request->user() ? $request->user()->id : 'admin',
            'action_type' => 'AUDIT_EXPORT_GENERATED',
            'metadata_json' => ['range' => $range]
        ]);
        
        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
    
    private function generateCsv($path, $data)
    {
        if (empty($data)) return;
        
        $fp = fopen($path, 'w');
        
        // Header
        $header = array_keys((array)$data[0]);
        fputcsv($fp, $header);
        
        foreach ($data as $row) {
            // Flatten array/json fields if needed
            $row = array_map(function($item) {
                return is_array($item) ? json_encode($item) : $item;
            }, (array)$row);
            fputcsv($fp, $row);
        }
        
        fclose($fp);
    }
}
