import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { ensureScript } from '../utils/thirdPartyScriptManager';

export default function IntercomProvider() {
    const { props } = usePage();
    const intercom = props?.intercom || {};
    const appId = intercom?.appId;
    const boot = intercom?.boot || {};
    const loggedInUserId = boot?.user_id || null;
    const bootedRef = useRef(false);
    const currentUserIdRef = useRef(null);
    
    // Debug logging (only for development)
    if (process.env.NODE_ENV === 'development') {
        console.log('IntercomProvider rendered with:', {
            enabled: intercom?.enabled,
            appId,
            userId: loggedInUserId
        });
    }

    // Boot/Update Intercom
    useEffect(() => {
        if (!intercom?.enabled || !appId) {
            return;
        }

        console.log('🚀 Initializing Intercom with appId:', appId);
        console.log('📊 Boot data:', boot);
        
        // Use the standard Intercom initialization approach
        const initializeIntercom = () => {
            // Set global settings
            window.intercomSettings = boot;
            console.log('Set window.intercomSettings:', window.intercomSettings);
            
            // Initialize Intercom function if not exists
            if (typeof window.Intercom !== 'function') {
                window.Intercom = function() {
                    window.Intercom.q = window.Intercom.q || [];
                    window.Intercom.q.push(arguments);
                };
                window.Intercom.q = [];
            }
            
            // Load the Intercom script
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = `https://widget.intercom.io/widget/${appId}`;
            
            script.onload = () => {
                console.log('✅ Intercom script loaded successfully');
                
                setTimeout(() => {
                    try {
                        console.log('🔍 Checking Intercom function:', typeof window.Intercom);
                        console.log('🔍 window.Intercom:', window.Intercom);
                        
                        if (typeof window.Intercom === 'function') {
                            if (!bootedRef.current || currentUserIdRef.current !== loggedInUserId) {
                                console.log('🚀 Booting Intercom with settings:');
                                console.log('  - App ID:', boot.app_id);
                                console.log('  - User ID:', boot.user_id);
                                console.log('  - Email:', boot.email);
                                console.log('  - Name:', boot.name);
                                console.log('  - Full boot object:', boot);
                                
                                window.Intercom('boot', boot);
                                bootedRef.current = true;
                                currentUserIdRef.current = loggedInUserId;
                                console.log('✅ Intercom booted successfully');
                                
                                // Try to show the messenger to test if it's working
                                setTimeout(() => {
                                    try {
                                        window.Intercom('show');
                                        console.log('📨 Attempted to show Intercom messenger');
                                    } catch (e) {
                                        console.warn('⚠️ Could not show messenger:', e);
                                    }
                                }, 1000);
                                
                            } else {
                                console.log('🔄 Updating Intercom with:', boot);
                                window.Intercom('update', boot);
                                console.log('✅ Intercom updated successfully');
                            }
                            
                            // Check widget presence after delays
                            setTimeout(() => {
                                console.log('🔍 Checking for Intercom DOM elements...');
                                const launcher = document.querySelector('.intercom-launcher');
                                const messenger = document.querySelector('.intercom-messenger');
                                const frame = document.querySelector('iframe[name*="intercom"]');
                                const allFrames = document.querySelectorAll('iframe');
                                
                                console.log('DOM Elements found:', {
                                    launcher: !!launcher,
                                    messenger: !!messenger,
                                    intercomFrame: !!frame,
                                    totalFrames: allFrames.length
                                });
                                
                                // List all iframes for debugging
                                allFrames.forEach((iframe, index) => {
                                    console.log(`  Frame ${index}:`, {
                                        src: iframe.src,
                                        name: iframe.name,
                                        id: iframe.id
                                    });
                                });
                                
                                // Try to get Intercom status
                                try {
                                    const status = window.Intercom('getVisitorId');
                                    console.log('🎯 Intercom visitor ID:', status);
                                } catch (e) {
                                    console.log('⚠️ Could not get visitor ID:', e.message);
                                }
                                
                            }, 5000);
                        } else {
                            console.error('❌ Intercom function not available after script load');
                        }
                    } catch (error) {
                        console.error('❌ Error initializing Intercom:', error);
                    }
                }, 500); // Increased timeout to allow script to fully initialize
            };
            
            script.onerror = (error) => {
                console.error('Failed to load Intercom script:', error);
            };
            
            // Only add script if it doesn't exist
            if (!document.getElementById('intercom-script')) {
                script.id = 'intercom-script';
                document.head.appendChild(script);
                console.log('Intercom script added to DOM');
            }
        };
        
        initializeIntercom();

        return () => {
            // Cleanup is handled by user change effect
        };
    }, [appId, intercom?.enabled, JSON.stringify(boot)]);

    // Handle user logout or change
    useEffect(() => {
        if (!bootedRef.current) return;
        
        // If user logged out (no user_id) or user changed, shutdown
        if (!loggedInUserId || currentUserIdRef.current !== loggedInUserId) {
            if (typeof window.Intercom === 'function') {
                window.Intercom('shutdown');
            }
            bootedRef.current = false;
            currentUserIdRef.current = null;
        }
    }, [loggedInUserId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (bootedRef.current && typeof window.Intercom === 'function') {
                window.Intercom('shutdown');
            }
        };
    }, []);

    return null; // This is a utility component with no UI
}