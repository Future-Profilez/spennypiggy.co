<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Laravel') }} - Log Management</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        .log-line {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            white-space: pre-wrap;
            word-break: break-all;
        }
        .log-container {
            max-height: 600px;
            overflow-y: auto;
            background: #1a1a1a;
            color: #e0e0e0;
        }
        .loading {
            display: none;
        }
        .loading.active {
            display: inline-block;
        }
        .btn {
            @apply px-4 py-2 rounded font-medium transition-colors duration-200;
        }
        .btn-primary {
            @apply bg-blue-600 hover:bg-blue-700 text-white;
        }
        .btn-danger {
            @apply bg-red-600 hover:bg-red-700 text-white;
        }
        .btn-success {
            @apply bg-green-600 hover:bg-green-700 text-white;
        }
        .btn-secondary {
            @apply bg-gray-600 hover:bg-gray-700 text-white;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                <i class="fas fa-file-alt text-blue-600 mr-2"></i>
                Log Management System
            </h1>
            <p class="text-gray-600">Monitor and manage application logs in real-time</p>
            
            @if(config('app.env') === 'production')
            <div class="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">
                            <strong>Production Environment:</strong> Access is secured with LOG_DEBUG_TOKEN.
                            @if(request('token'))
                                <span class="text-green-600">✓ Valid token provided</span>
                            @else
                                <span class="text-red-600">⚠ No token provided</span>
                            @endif
                        </p>
                    </div>
                </div>
            </div>
            @endif
        </div>

        <!-- Log File Info Card -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
                <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                Log File Information
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-600">Status</div>
                    <div class="text-lg font-medium">
                        @if($logExists)
                            <span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Available</span>
                        @else
                            <span class="text-red-600"><i class="fas fa-exclamation-circle mr-1"></i>Not Found</span>
                        @endif
                    </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-600">File Size</div>
                    <div class="text-lg font-medium">{{ $logSize }}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-600">Last Modified</div>
                    <div class="text-lg font-medium">{{ $lastModified ?? 'N/A' }}</div>
                </div>
            </div>
        </div>

        <!-- Controls Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
                <i class="fas fa-cogs text-blue-500 mr-2"></i>
                Log Controls
            </h2>
            
            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-3 mb-6">
                <button id="refreshBtn" class="btn btn-primary">
                    <i class="fas fa-sync-alt mr-2"></i>
                    Refresh Logs
                </button>
                <button id="clearBtn" class="btn btn-danger">
                    <i class="fas fa-trash mr-2"></i>
                    Clear Logs
                </button>
                <a href="/api/debug/logs/download{{ request('token') ? '?token=' . request('token') : '' }}" class="btn btn-success" target="_blank">
                    <i class="fas fa-download mr-2"></i>
                    Download Logs
                </a>
                <button id="autoRefreshBtn" class="btn btn-secondary" data-enabled="false">
                    <i class="fas fa-play mr-2"></i>
                    Auto Refresh (Off)
                </button>
            </div>

            <!-- Search and Filter Controls -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Search Logs</label>
                    <input 
                        type="text" 
                        id="searchInput" 
                        placeholder="Search for errors, warnings, etc..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Number of Lines</label>
                    <select 
                        id="linesSelect" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="50">50 lines</option>
                        <option value="100" selected>100 lines</option>
                        <option value="200">200 lines</option>
                        <option value="500">500 lines</option>
                        <option value="1000">1000 lines</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                    <div class="flex gap-2">
                        <button class="filter-btn btn btn-secondary text-xs px-2 py-1" data-filter="ERROR">Errors</button>
                        <button class="filter-btn btn btn-secondary text-xs px-2 py-1" data-filter="WARNING">Warnings</button>
                        <button class="filter-btn btn btn-secondary text-xs px-2 py-1" data-filter="INFO">Info</button>
                        <button class="filter-btn btn btn-secondary text-xs px-2 py-1" data-filter="">All</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Log Display Section -->
        <div class="bg-white rounded-lg shadow-md">
            <div class="p-4 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-semibold text-gray-800">
                        <i class="fas fa-terminal text-blue-500 mr-2"></i>
                        Log Contents
                    </h2>
                    <div class="flex items-center gap-3">
                        <span id="logStats" class="text-sm text-gray-600">Ready to load logs</span>
                        <div class="loading" id="loadingSpinner">
                            <i class="fas fa-spinner fa-spin text-blue-500"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="logContainer" class="log-container p-4">
                <div class="text-gray-400 text-center py-8">
                    <i class="fas fa-file-alt text-4xl mb-4"></i>
                    <p>Click "Refresh Logs" to load the latest log entries</p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 text-center text-gray-500 text-sm">
            <p>Log file path: <code class="bg-gray-100 px-2 py-1 rounded">{{ $logPath }}</code></p>
        </div>
    </div>

    <!-- Confirmation Modal -->
    <div id="confirmModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-lg max-w-md w-full p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Confirm Action</h3>
                <p id="confirmMessage" class="text-gray-600 mb-6"></p>
                <div class="flex justify-end gap-3">
                    <button id="cancelBtn" class="btn btn-secondary">Cancel</button>
                    <button id="confirmBtn" class="btn btn-danger">Confirm</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let autoRefreshInterval = null;
        let currentSearch = '';
        let currentLines = 100;
        const debugToken = new URLSearchParams(window.location.search).get('token');
        
        // DOM Elements
        const refreshBtn = document.getElementById('refreshBtn');
        const clearBtn = document.getElementById('clearBtn');
        const autoRefreshBtn = document.getElementById('autoRefreshBtn');
        const searchInput = document.getElementById('searchInput');
        const linesSelect = document.getElementById('linesSelect');
        const logContainer = document.getElementById('logContainer');
        const logStats = document.getElementById('logStats');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const confirmModal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');

        // Event Listeners
        refreshBtn.addEventListener('click', loadLogs);
        clearBtn.addEventListener('click', showClearConfirmation);
        autoRefreshBtn.addEventListener('click', toggleAutoRefresh);
        searchInput.addEventListener('input', debounce(onSearchChange, 500));
        linesSelect.addEventListener('change', onLinesChange);
        cancelBtn.addEventListener('click', hideModal);
        
        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                searchInput.value = filter;
                currentSearch = filter;
                loadLogs();
                
                // Update button states
                filterBtns.forEach(b => b.classList.remove('btn-primary'));
                filterBtns.forEach(b => b.classList.add('btn-secondary'));
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-primary');
            });
        });

        // Functions
        function showLoading() {
            loadingSpinner.classList.add('active');
        }

        function hideLoading() {
            loadingSpinner.classList.remove('active');
        }

        function showModal() {
            confirmModal.classList.remove('hidden');
        }

        function hideModal() {
            confirmModal.classList.add('hidden');
        }

        function showClearConfirmation() {
            confirmMessage.textContent = 'Are you sure you want to clear all log files? This action cannot be undone.';
            confirmBtn.onclick = clearLogs;
            showModal();
        }

        async function loadLogs() {
            showLoading();
            
            try {
                const params = new URLSearchParams();
                if (currentSearch) params.append('search', currentSearch);
                if (currentLines) params.append('lines', currentLines);
                if (debugToken) params.append('token', debugToken);
                
                const headers = {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                };
                if (debugToken) {
                    headers['X-Log-Debug-Token'] = debugToken;
                }
                
                const response = await fetch(`/api/debug/logs?${params}`, {
                    headers: headers
                });
                
                if (!response.ok) throw new Error('Failed to fetch logs');
                
                const data = await response.json();
                displayLogs(data);
                
            } catch (error) {
                console.error('Error loading logs:', error);
                logContainer.innerHTML = `
                    <div class="text-red-500 text-center py-8">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p>Error loading logs: ${error.message}</p>
                    </div>
                `;
            } finally {
                hideLoading();
            }
        }

        async function clearLogs() {
            showLoading();
            hideModal();
            
            try {
                const params = debugToken ? `?token=${debugToken}` : '';
                const headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                };
                if (debugToken) {
                    headers['X-Log-Debug-Token'] = debugToken;
                }
                
                const response = await fetch(`/api/debug/logs/clear${params}`, {
                    method: 'POST',
                    headers: headers
                });
                
                if (!response.ok) throw new Error('Failed to clear logs');
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    logContainer.innerHTML = `
                        <div class="text-green-500 text-center py-8">
                            <i class="fas fa-check-circle text-4xl mb-4"></i>
                            <p>${data.message}</p>
                        </div>
                    `;
                    logStats.textContent = 'Logs cleared successfully';
                }
                
            } catch (error) {
                console.error('Error clearing logs:', error);
                logContainer.innerHTML = `
                    <div class="text-red-500 text-center py-8">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p>Error clearing logs: ${error.message}</p>
                    </div>
                `;
            } finally {
                hideLoading();
            }
        }

        function displayLogs(data) {
            if (data.logs && data.logs.length > 0) {
                const logsHtml = data.logs.map((log, index) => 
                    `<div class="log-line mb-1 p-2 hover:bg-gray-800 rounded">${escapeHtml(log)}</div>`
                ).join('');
                
                logContainer.innerHTML = logsHtml;
                
                const searchText = data.search ? ` (filtered by "${data.search}")` : '';
                logStats.textContent = `Showing ${data.total_lines} lines${searchText}`;
                
                // Auto-scroll to bottom
                logContainer.scrollTop = logContainer.scrollHeight;
            } else {
                logContainer.innerHTML = `
                    <div class="text-gray-400 text-center py-8">
                        <i class="fas fa-file text-4xl mb-4"></i>
                        <p>No log entries found</p>
                    </div>
                `;
                logStats.textContent = 'No logs found';
            }
        }

        function toggleAutoRefresh() {
            const isEnabled = autoRefreshBtn.dataset.enabled === 'true';
            
            if (isEnabled) {
                clearInterval(autoRefreshInterval);
                autoRefreshBtn.dataset.enabled = 'false';
                autoRefreshBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Auto Refresh (Off)';
                autoRefreshBtn.classList.remove('btn-primary');
                autoRefreshBtn.classList.add('btn-secondary');
            } else {
                autoRefreshInterval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
                autoRefreshBtn.dataset.enabled = 'true';
                autoRefreshBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>Auto Refresh (On)';
                autoRefreshBtn.classList.remove('btn-secondary');
                autoRefreshBtn.classList.add('btn-primary');
                loadLogs(); // Load immediately when enabling
            }
        }

        function onSearchChange(e) {
            currentSearch = e.target.value;
            loadLogs();
        }

        function onLinesChange(e) {
            currentLines = e.target.value;
            loadLogs();
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, function(m) { return map[m]; });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Auto-load logs on page load
            loadLogs();
        });
    </script>
</body>
</html>