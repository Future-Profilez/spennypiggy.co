import React, { useState, useEffect } from 'react';
import OfflinePage from './OfflinePage';

const ConnectivityListener = ({ children }) => {
    // Initial check
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== 'undefined' ? !navigator.onLine : false
    );

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        
        // Listen to window events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Also listen to custom 'offline' event dispatched by axios interceptor
        // Note: The axios interceptor dispatches to 'window', but standard offline event is also on window
        // This is redundant but safe.

        // Periodic check for mobile devices where events might not fire reliably
        const intervalId = setInterval(() => {
            if (navigator.onLine === false && !isOffline) {
                setIsOffline(true);
            } else if (navigator.onLine === true && isOffline) {
                // Double check with a ping if we think we are back online?
                // For now just trust navigator.onLine to avoid false positives
                setIsOffline(false);
            }
        }, 3000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId);
        };
    }, [isOffline]);

    if (isOffline) {
        return <OfflinePage />;
    }

    return children;
};

export default ConnectivityListener;
