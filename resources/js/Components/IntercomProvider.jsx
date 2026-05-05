import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * IntercomProvider
 * 
 * A robust Intercom integration that handles authentication,
 * identity verification, and prevents session leakage.
 */
export default function IntercomProvider() {
    const { props } = usePage();
    const intercom = props?.intercom || {};
    const appId = intercom?.appId || 'xomg14o9';
    const bootData = intercom?.boot || {};
    const isEnabled = intercom?.enabled !== false;
    const loggedInUserId = bootData?.user_id || null;
    
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!isEnabled || !appId) {
            if (typeof window.Intercom === 'function') {
                window.Intercom('shutdown');
                initializedRef.current = false;
            }
            return;
        }

        // 1. Initialize Intercom stub if it doesn't exist
        if (typeof window.Intercom !== 'function') {
            var i = function() { i.c(arguments); };
            i.q = [];
            i.c = function(args) { i.q.push(args); };
            window.Intercom = i;
        }

        // 2. Define loading function
        const loadScript = () => {
            if (document.getElementById('intercom-js')) return;
            const s = document.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.id = 'intercom-js';
            s.src = `https://widget.intercom.io/widget/${appId}`;
            const x = document.getElementsByTagName('script')[0];
            x.parentNode.insertBefore(s, x);
        };

        // 3. User changed or logged out? Shutdown first.
        if (initializedRef.current && (window.Intercom.lastUserId !== loggedInUserId)) {
            if (typeof window.Intercom === 'function') {
                window.Intercom('shutdown');
            }
            initializedRef.current = false;
            window.Intercom.lastUserId = null;
        }

        // 4. Boot Intercom
        if (!initializedRef.current) {
            const settings = loggedInUserId 
                ? { ...bootData, app_id: appId } 
                : { app_id: appId, custom_launcher_selector: ".livechat" };
            
            if (typeof window.Intercom === 'function') {
                window.Intercom('boot', settings);
                window.Intercom.lastUserId = loggedInUserId;
                initializedRef.current = true;
                loadScript();
            }
        } else if (loggedInUserId) {
            // Update existing session
            if (typeof window.Intercom === 'function') {
                window.Intercom('update', bootData);
            }
        }

    }, [appId, isEnabled, loggedInUserId, JSON.stringify(bootData)]);

    return null;
}
