#!/bin/bash

# Spenny Piggy - Dev Start Script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

open_tab() {
    local cmd="$1"
    osascript <<EOF
tell application "Terminal"
    activate
    tell application "System Events" to keystroke "t" using {command down}
    delay 0.4
    do script "cd '$DIR' && $cmd" in front window
end tell
EOF
}

echo "Starting Spenny Piggy Dev Environment..."

open_tab "php artisan serve"
sleep 0.5

open_tab "php artisan queue:work --tries=3 --timeout=60"
sleep 0.5

open_tab "php artisan schedule:work"
sleep 0.5

open_tab "npm run dev"

echo ""
echo "All processes started in Terminal tabs:"
echo "  Laravel Server : http://127.0.0.1:8000"
echo "  Queue Worker   : processing jobs & emails"
echo "  Scheduler      : running scheduled commands"
echo "  Vite           : compiling assets"
