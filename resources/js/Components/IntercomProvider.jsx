import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * IntercomProvider
 * 
 * A robust Intercom integration that handles authentication,
 * identity verification, and prevents the "blank screen" issue.
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
        // If user changed, shutdown first to prevent session leakage or blank screens
        if (initializedRef.current && window.Intercom.lastUserId !== loggedInUserId) {
            console.log('Intercom: User changed or logged out, forcing shutdown');
            window.Intercom('shutdown');
            initializedRef.current = false;
            window.Intercom.lastUserId = null;
        }

        if (!isEnabled || !appId) {
            return;
        }

        if (!loggedInUserId) {
            // For guest users, we can boot as anonymous if needed, 
            // but for now we ensure it's shutdown if it was logged in
            return;
        }

        // 1. Initialize Intercom function if it doesn't exist
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

        // 3. Boot or Update
        const settings = {
            ...bootData,
            app_id: appId
        };

        if (initializedRef.current && window.Intercom.lastUserId !== loggedInUserId) {
            window.Intercom('shutdown');
            initializedRef.current = false;
        }

        if (!initializedRef.current) {
            window.Intercom('boot', settings);
            window.Intercom.lastUserId = loggedInUserId;
            initializedRef.current = true;
            loadScript();
        } else {
            window.Intercom('update', settings);
        }

    }, [appId, isEnabled, JSON.stringify(bootData)]);

    return null;
}
