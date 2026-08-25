<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intercom Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .status {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .log {
            background: #f8f8f8;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #0056b3;
        }
        .error { color: red; }
        .success { color: green; }
        .warning { color: orange; }
    </style>
</head>
<body>
    <h1>🧪 Intercom Diagnostic Test</h1>
    
    <div class="status">
        <h2>Test Status</h2>
        <p><strong>App ID:</strong> xomg14o9</p>
        <p><strong>User:</strong> {{ auth()->check() ? auth()->user()->name . ' (ID: ' . auth()->user()->id . ', Role: ' . auth()->user()->role . ')' : 'Not logged in' }}</p>
        <p><strong>Current Time:</strong> <span id="current-time"></span></p>
    </div>

    <div class="status">
        <h2>Actions</h2>
        {{-- ⚠️ `data-action`, not `onclick`. An inline event handler is governed by
             `script-src-attr` and CANNOT carry a nonce — an attribute has nowhere to
             put one — so it is refused outright. The listener is wired in the nonced
             script below. --}}
        <button type="button" data-action="testBasicIntercom">🔵 Test Basic Intercom</button>
        <button type="button" data-action="testWithUser">👤 Test With User Data</button>
        <button type="button" data-action="showIntercom">💬 Show Intercom</button>
        <button type="button" data-action="clearLog">🗑️ Clear Log</button>
    </div>

    <div class="status">
        <h2>Debug Log</h2>
        <div id="log" class="log"></div>
    </div>

    {{-- ⚠️ Nonced like every other inline block. This view is local/testing only
         (where the CSP is skipped), but a blade with no nonce is a pattern the next
         person copies. --}}
    <script nonce="{{ $cspNonce ?? '' }}">
        document.addEventListener('click', function (event) {
            var trigger = event.target.closest('[data-action]');
            if (!trigger) return;
            var fn = window[trigger.dataset.action];
            if (typeof fn === 'function') fn();
        });

        let logElement = document.getElementById('log');
        
        function updateTime() {
            document.getElementById('current-time').textContent = new Date().toLocaleString();
        }
        
        function log(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const className = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : '';
            logElement.innerHTML += `<span class="${className}">[${timestamp}] ${message}</span>\n`;
            logElement.scrollTop = logElement.scrollHeight;
        }
        
        function clearLog() {
            logElement.innerHTML = '';
        }
        
        function testBasicIntercom() {
            log('🧪 Starting Basic Intercom Test...');
            
            // Check if Intercom is already loaded
            if (window.Intercom) {
                log('✅ Intercom already loaded!', 'success');
                return;
            }
            
            log('📥 Loading Intercom script...');
            
            // Set up basic Intercom settings
            window.intercomSettings = {
                api_base: "https://api-iam.intercom.io",
                app_id: "xomg14o9"
            };
            
            // Intercom loading script
            (function() {
                var w = window;
                var ic = w.Intercom;
                if (typeof ic === "function") {
                    ic("reattach_activator");
                    ic("update", w.intercomSettings);
                } else {
                    var d = document;
                    var i = function() {
                        i.c(arguments);
                    };
                    i.q = [];
                    i.c = function(args) {
                        i.q.push(args);
                    };
                    w.Intercom = i;
                    
                    var l = function() {
                        var s = d.createElement("script");
                        s.type = "text/javascript";
                        s.async = true;
                        s.src = "https://widget.intercom.io/widget/xomg14o9";
                        s.onload = function() {
                            log('✅ Intercom script loaded successfully!', 'success');
                            setTimeout(() => {
                                checkIntercomWidget();
                            }, 2000);
                        };
                        s.onerror = function() {
                            log('❌ Failed to load Intercom script!', 'error');
                        };
                        var x = d.getElementsByTagName("script")[0];
                        x.parentNode.insertBefore(s, x);
                    };
                    
                    if (document.readyState === "complete") {
                        l();
                    } else if (w.attachEvent) {
                        w.attachEvent("onload", l);
                    } else {
                        w.addEventListener("load", l, false);
                    }
                }
            })();
        }
        
        function testWithUser() {
            @if(auth()->check())
            log('👤 Testing with authenticated user data...');
            
            window.intercomSettings = {
                api_base: "https://api-iam.intercom.io",
                app_id: "xomg14o9",
                user_id: "{{ auth()->user()->id }}",
                name: "{{ auth()->user()->name }}",
                email: "{{ auth()->user()->email }}",
                created_at: {{ auth()->user()->created_at ? auth()->user()->created_at->timestamp : 'null' }},
                custom_attributes: {
                    role: "{{ auth()->user()->role }}",
                    user_type: {{ auth()->user()->role }} == 0 ? "gifter" : {{ auth()->user()->role }} == 1 ? "creator" : "unknown"
                }
            };
            
            log('📊 User settings: ' + JSON.stringify(window.intercomSettings, null, 2));
            
            if (window.Intercom) {
                window.Intercom('boot', window.intercomSettings);
                log('🔄 Updated Intercom with user data', 'success');
            } else {
                log('⚠️ Intercom not loaded yet. Loading with user data...', 'warning');
                testBasicIntercom();
            }
            @else
            log('❌ No authenticated user found!', 'error');
            @endif
        }
        
        function showIntercom() {
            if (window.Intercom) {
                log('💬 Attempting to show Intercom widget...');
                window.Intercom('show');
            } else {
                log('❌ Intercom not loaded. Try "Test Basic Intercom" first.', 'error');
            }
        }
        
        function checkIntercomWidget() {
            const widget = document.querySelector('iframe[name*="intercom"]') || 
                          document.querySelector('.intercom-lightweight-app') ||
                          document.querySelector('#intercom-frame');
            
            if (widget) {
                log('✅ Intercom widget found in DOM!', 'success');
                log(`📐 Widget details: ${widget.tagName}, ${widget.style.display !== 'none' ? 'visible' : 'hidden'}`);
            } else {
                log('❌ Intercom widget not found in DOM', 'error');
                log('🔍 Checking for Intercom elements...');
                
                // Check for any Intercom-related elements
                const intercomElements = document.querySelectorAll('[class*="intercom"], [id*="intercom"]');
                if (intercomElements.length > 0) {
                    log(`🔍 Found ${intercomElements.length} Intercom-related elements:`);
                    intercomElements.forEach((el, index) => {
                        log(`  ${index + 1}. ${el.tagName}${el.className ? '.' + el.className : ''}${el.id ? '#' + el.id : ''}`);
                    });
                } else {
                    log('❌ No Intercom-related elements found', 'error');
                }
            }
        }
        
        // Initialize
        updateTime();
        setInterval(updateTime, 1000);
        log('🚀 Intercom Diagnostic Test Ready');
        
        // Auto-run basic test after 2 seconds
        setTimeout(() => {
            log('🤖 Auto-running basic test...');
            testBasicIntercom();
        }, 2000);
    </script>
</body>
</html>