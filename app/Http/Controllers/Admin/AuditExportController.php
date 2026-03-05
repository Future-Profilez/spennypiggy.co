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
