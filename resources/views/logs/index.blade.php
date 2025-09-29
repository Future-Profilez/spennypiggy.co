<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Log Viewer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .log-entry {
            border-left: 4px solid #e5e7eb;
        }
        .log-emergency { border-left-color: #dc2626; }
        .log-alert { border-left-color: #dc2626; }
        .log-critical { border-left-color: #dc2626; }
        .log-error { border-left-color: #dc2626; }
        .log-warning { border-left-color: #f59e0b; }
        .log-notice { border-left-color: #3b82f6; }
        .log-info { border-left-color: #06b6d4; }
        .log-debug { border-left-color: #6b7280; }
        
        .badge-emergency { @apply bg-red-100 text-red-800; }
        .badge-alert { @apply bg-red-100 text-red-800; }
        .badge-critical { @apply bg-red-100 text-red-800; }
        .badge-error { @apply bg-red-100 text-red-800; }
        .badge-warning { @apply bg-yellow-100 text-yellow-800; }
        .badge-notice { @apply bg-blue-100 text-blue-800; }
        .badge-info { @apply bg-cyan-100 text-cyan-800; }
        .badge-debug { @apply bg-gray-100 text-gray-800; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-6 max-w-7xl">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow mb-6">
            <div class="px-6 py-4 border-b border-gray-200">
                <h1 class="text-2xl font-bold text-gray-900">Laravel Log Viewer</h1>
                <p class="text-sm text-gray-600 mt-1">Production log monitoring and debugging</p>
                @if(isset($totalLogs))
                    <p class="text-xs text-gray-500 mt-1">Total logs: {{ number_format($totalLogs) }}</p>
                @endif
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow mb-6">
            <div class="px-6 py-4">
                <form method="GET" action="{{ route('logs.index') }}" class="flex flex-wrap gap-4">
                    <!-- Search -->
                    <div class="flex-1 min-w-64">
                        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input 
                            type="text" 
                            name="search" 
                            id="search"
                            value="{{ $search }}" 
                            placeholder="Search in logs..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                    </div>

                    <!-- Level Filter -->
                    <div class="min-w-48">
                        <label for="level" class="block text-sm font-medium text-gray-700 mb-1">Level</label>
                        <select 
                            name="level" 
                            id="level"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Levels</option>
                            <option value="emergency" {{ $level === 'emergency' ? 'selected' : '' }}>Emergency</option>
                            <option value="alert" {{ $level === 'alert' ? 'selected' : '' }}>Alert</option>
                            <option value="critical" {{ $level === 'critical' ? 'selected' : '' }}>Critical</option>
                            <option value="error" {{ $level === 'error' ? 'selected' : '' }}>Error</option>
                            <option value="warning" {{ $level === 'warning' ? 'selected' : '' }}>Warning</option>
                            <option value="notice" {{ $level === 'notice' ? 'selected' : '' }}>Notice</option>
                            <option value="info" {{ $level === 'info' ? 'selected' : '' }}>Info</option>
                            <option value="debug" {{ $level === 'debug' ? 'selected' : '' }}>Debug</option>
                        </select>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex items-end">
                        <button 
                            type="submit"
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Filter
                        </button>
                    </div>

                    <!-- Clear Button -->
                    <div class="flex items-end">
                        <a 
                            href="{{ route('logs.index') }}"
                            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Clear
                        </a>
                    </div>
                </form>
            </div>
        </div>

        <!-- Actions -->
        <div class="bg-white rounded-lg shadow mb-6">
            <div class="px-6 py-4 flex flex-wrap gap-2">
                <a 
                    href="{{ route('logs.download') }}"
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                    📥 Download Log
                </a>
                <form method="POST" action="{{ route('logs.clear') }}" class="inline">
                    @csrf
                    <button 
                        type="submit"
                        onclick="return confirm('Are you sure you want to clear all logs? This action cannot be undone.')"
                        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        🗑️ Clear Logs
                    </button>
                </form>
            </div>
        </div>

        <!-- Messages -->
        @if($message)
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">{{ $message }}</p>
                    </div>
                </div>
            </div>
        @endif

        @if(session('success'))
            <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-green-700">{{ session('success') }}</p>
                    </div>
                </div>
            </div>
        @endif

        @if(session('error'))
            <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">{{ session('error') }}</p>
                    </div>
                </div>
            </div>
        @endif

        <!-- Log Entries -->
        <div class="bg-white rounded-lg shadow mb-6">
            @if($logs->count() > 0)
                <div class="divide-y divide-gray-200">
                    @foreach($logs as $log)
                        <div class="log-entry log-{{ strtolower($log['level']) }} p-6">
                            <div class="flex flex-wrap items-start gap-4">
                                <!-- Timestamp -->
                                <div class="flex-shrink-0">
                                    <span class="text-sm text-gray-500 font-mono">{{ $log['timestamp'] }}</span>
                                </div>

                                <!-- Level Badge -->
                                <div class="flex-shrink-0">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium badge-{{ strtolower($log['level']) }}">
                                        {{ strtoupper($log['level']) }}
                                    </span>
                                </div>

                                <!-- Environment -->
                                <div class="flex-shrink-0">
                                    <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{{ $log['environment'] }}</span>
                                </div>

                                <!-- Message -->
                                <div class="flex-1 min-w-0">
                                    <pre class="text-sm text-gray-900 whitespace-pre-wrap font-mono overflow-x-auto break-words">{{ $log['full_message'] }}</pre>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="p-12 text-center">
                    <div class="mx-auto h-12 w-12 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No log entries found</h3>
                    <p class="mt-1 text-sm text-gray-500">
                        @if($search || $level)
                            Try adjusting your search criteria or filters.
                        @else
                            The log file is empty or doesn't exist.
                        @endif
                    </p>
                </div>
            @endif
        </div>

        <!-- Pagination -->
        @if($pagination && $pagination->hasPages())
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4">
                    {{ $pagination->appends(request()->query())->links() }}
                </div>
            </div>
        @endif

        <!-- Footer -->
        <div class="mt-8 text-center text-xs text-gray-500">
            <p>Laravel Log Viewer - Last updated: {{ date('Y-m-d H:i:s') }}</p>
        </div>
    </div>

    <!-- Auto-refresh option -->
    <script>
        // Auto-refresh every 30 seconds if no search/filter is applied
        @if(!$search && !$level)
            setTimeout(function() {
                if (confirm('Refresh the page to see new logs?')) {
                    window.location.reload();
                }
            }, 30000);
        @endif
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search').focus();
            }
            
            // Escape to clear search
            if (e.key === 'Escape') {
                document.getElementById('search').value = '';
                document.getElementById('level').value = '';
            }
        });
        
        // Add search on enter key
        document.getElementById('search').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                this.form.submit();
            }
        });
    </script>
</body>
</html>