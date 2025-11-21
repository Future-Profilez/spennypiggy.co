import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

export default function IntercomProviderSimple() {
    const { props } = usePage();
    const intercom = props?.intercom || {};
    const appId = intercom?.appId;
    const boot = intercom?.boot || {};
    const loggedInUserId = boot?.user_id || null;
    const initRef = useRef(false);

    useEffect(() => {
        if (!intercom?.enabled || !appId || initRef.current) {
            return;
        }

        console.log('🚀 Initializing Intercom (matching Footer method)');
        console.log('📊 Boot data:', boot);

        // Use a delay like the original Footer (but shorter for better UX)
        setTimeout(() => {
            // Set global settings exactly like Footer
            window.intercomSettings = boot;
            
            // Use the exact Footer initialization code
            (function () {
                var w = window;
                var ic = w.Intercom;
                if (typeof ic === "function") {
                    ic("reattach_activator");
                    ic("update", w.intercomSettings);
                } else {
                    var d = document;
                    var i = function () {
                        i.c(arguments);
                    };
                    i.q = [];
                    i.c = function (args) {
                        i.q.push(args);
                    };
                    w.Intercom = i;
                    var l = function () {
                        var s = d.createElement("script");
                        s.type = "text/javascript";
                        s.async = true;
                        s.defer = true;
                        s.src = `https://widget.intercom.io/widget/${appId}`;
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
            
            console.log('✅ Intercom initialized with Footer method');
            
            // Debug check
            setTimeout(() => {
                console.log('🔍 Intercom status check:');
                console.log('  - window.Intercom:', typeof window.Intercom);
                console.log('  - intercomSettings:', window.intercomSettings);
                
                const launcher = document.querySelector('.intercom-launcher');
                const frames = document.querySelectorAll('iframe');
                console.log('  - Launcher element:', !!launcher);
                console.log('  - Total iframes:', frames.length);
            }, 3000);
            
        }, 1000); // Much shorter delay than Footer's 7000ms
        
        initRef.current = true;

    }, [intercom?.enabled, appId, JSON.stringify(boot)]);

    // Handle user logout
    useEffect(() => {
        if (initRef.current && !loggedInUserId && typeof window.Intercom === 'function') {
            window.Intercom('shutdown');
            initRef.current = false;
            console.log('🔄 Intercom shut down for logout');
        }
    }, [loggedInUserId]);

    return null;
}