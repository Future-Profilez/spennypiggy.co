<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class LogManagementController extends Controller
{
    /**
     * Display the log management interface
     */
    public function index()
    {
        // Get log file info
        $logPath = storage_path('logs/laravel.log');
        $logExists = File::exists($logPath);
        $logSize = $logExists ? File::size($logPath) : 0;
        $lastModified = $logExists ? File::lastModified($logPath) : null;
        
        return view('admin.logs.index', [
            'logExists' => $logExists,
            'logSize' => $this->formatBytes($logSize),
            'lastModified' => $lastModified ? date('Y-m-d H:i:s', $lastModified) : null,
            'logPath' => $logPath
        ]);
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}