<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class LogViewerController extends Controller
{
    public function index(Request $request)
    {
        $logPath = storage_path('logs/laravel.log');
        
        if (!File::exists($logPath)) {
            return view('logs.index', [
                'logs' => collect(),
                'pagination' => null,
                'search' => '',
                'level' => '',
                'message' => 'Log file not found.',
            ]);
        }
        
        // Get search and filter parameters
        $search = $request->get('search', '');
        $level = $request->get('level', '');
        $perPage = 100;
        $currentPage = Paginator::resolveCurrentPage('page');
        
        // Read and parse log file
        $logs = $this->parseLogs($logPath, $search, $level);
        
        // Reverse to show latest first
        $logs = $logs->reverse();
        
        // Paginate results
        $offset = ($currentPage - 1) * $perPage;
        $currentPageLogs = $logs->slice($offset, $perPage)->values();
        
        $pagination = new LengthAwarePaginator(
            $currentPageLogs,
            $logs->count(),
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'pageName' => 'page',
                'query' => $request->query(),
            ]
        );
        
        return view('logs.index', [
            'logs' => $currentPageLogs,
            'pagination' => $pagination,
            'search' => $search,
            'level' => $level,
            'message' => null,
            'totalLogs' => $logs->count(),
        ]);
    }
    
    private function parseLogs($logPath, $search = '', $level = '')
    {
        $logs = collect();
        $file = fopen($logPath, 'r');
        
        if (!$file) {
            return $logs;
        }
        
        $currentLog = null;
        
        while (($line = fgets($file)) !== false) {
            $line = rtrim($line);
            
            // Check if this line starts a new log entry
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.+)/', $line, $matches)) {
                // Save previous log if exists
                if ($currentLog !== null) {
                    $logs->push($currentLog);
                }
                
                // Start new log entry
                $currentLog = [
                    'timestamp' => $matches[1],
                    'environment' => $matches[2],
                    'level' => $matches[3],
                    'message' => $matches[4],
                    'full_message' => $matches[4],
                ];
            } else {
                // This is a continuation of the previous log entry
                if ($currentLog !== null) {
                    $currentLog['full_message'] .= "\n" . $line;
                }
            }
        }
        
        // Add the last log entry
        if ($currentLog !== null) {
            $logs->push($currentLog);
        }
        
        fclose($file);
        
        // Apply filters
        if (!empty($search)) {
            $logs = $logs->filter(function ($log) use ($search) {
                return Str::contains(strtolower($log['full_message']), strtolower($search)) ||
                       Str::contains(strtolower($log['level']), strtolower($search));
            });
        }
        
        if (!empty($level)) {
            $logs = $logs->filter(function ($log) use ($level) {
                return strtolower($log['level']) === strtolower($level);
            });
        }
        
        return $logs;
    }
    
    public function download()
    {
        $logPath = storage_path('logs/laravel.log');
        
        if (!File::exists($logPath)) {
            abort(404, 'Log file not found');
        }
        
        return response()->download($logPath, 'laravel-' . date('Y-m-d-H-i-s') . '.log');
    }
    
    public function clear()
    {
        $logPath = storage_path('logs/laravel.log');
        
        if (File::exists($logPath)) {
            File::put($logPath, '');
            return redirect()->route('logs.index')->with('success', 'Log file cleared successfully.');
        }
        
        return redirect()->route('logs.index')->with('error', 'Log file not found.');
    }
}