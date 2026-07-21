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

# LAN address of this machine, so phones / other devices on the same wifi can
# reach the dev server. Falls back to localhost when offline.
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)"

# Bind to 0.0.0.0, not the default 127.0.0.1 — loopback-only means nothing
# except this machine can open the site.
open_tab "php artisan serve --host=0.0.0.0 --port=8000"
sleep 0.5

open_tab "php artisan queue:work --tries=3 --timeout=60"
sleep 0.5

open_tab "php artisan schedule:work"
sleep 0.5

open_tab "npm run dev"

echo ""
echo "All processes started in Terminal tabs:"
echo "  Laravel Server : http://localhost:8000"
echo "  On this wifi   : http://${LAN_IP}:8000"
echo "  Queue Worker   : processing jobs & emails"
echo "  Scheduler      : running scheduled commands"
echo "  Vite           : compiling assets (HMR host ${LAN_IP})"
echo ""
echo "Testing from a phone? Set APP_URL=http://${LAN_IP}:8000 in .env so"
echo "emailed and queued links resolve — then change it back afterwards."
