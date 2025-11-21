import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function IntercomProviderFixed() {
    const { auth } = usePage().props;

    async function configIntercom() {
        setTimeout(() => {
            console.log('🔍 Intercom config starting...', { auth: !!auth, user: !!auth?.user });
            
            if (auth && auth.user) {
                console.log('🔍 User data for Intercom:', {
                    id: auth.user.id,
                    name: auth.user.name,
                    email: auth.user.email,
                    role: auth.user.role,
                    created_at: auth.user.created_at,
                    username: auth.user.username
                });
                
                // Temporarily allow all roles for debugging
                // Only show for creators (role=1) and admins (role=0)
                // if (auth.user.role !== 0 && auth.user.role !== 1) {
                //     console.log('❌ User role not allowed for Intercom:', auth.user.role);
                //     return;
                // }

                window.intercomSettings = {
                    api_base: "https://api-iam.intercom.io",
                    app_id: "xomg14o9",
                    user_id: auth.user.id.toString(), // Unique user identifier  
                    name: auth.user.name, // Full name
                    email: auth.user.email, // Email address
                    custom_launcher_selector: ".livechat", // Custom selector
                    created_at: auth.user.created_at ? new Date(auth.user.created_at).getTime() / 1000 : null, // Unix timestamp
                    // Add custom attributes for better support context
                    custom_attributes: {
                        role: auth.user.role === 0 ? 'gifter' : auth.user.role === 1 ? 'creator' : 'unknown',
                        account_status: 'active', // Default to active
                        user_role_id: auth.user.role,
                        username: auth.user.username || null
                    }
                };
                
                console.log('📞 Intercom settings:', window.intercomSettings);
                
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
                        
                        // Queue the boot command with settings
                        console.log('⚙️ Queuing Intercom boot command...');
                        i('boot', w.intercomSettings);
                        
                        var l = function () {
                            console.log('📦 Loading Intercom script...');
                            var s = d.createElement("script");
                            s.type = "text/javascript";
                            s.async = true;
                            s.defer = true;
                            s.src = "https://widget.intercom.io/widget/xomg14o9";
                            var x = d.getElementsByTagName("script")[0];
                            x.parentNode.insertBefore(s, x);
                            
                            s.onload = function() {
                                console.log('✅ Intercom script loaded successfully');
                                setTimeout(() => {
                                    const widget = document.querySelector('iframe[name*="intercom"]') || 
                                                   document.querySelector('.intercom-lightweight-app');
                                    console.log('📋 Widget found:', !!widget);
                                }, 2000);
                            };
                            
                            s.onerror = function() {
                                console.error('❌ Failed to load Intercom script');
                            };
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
            } else {
                console.log('❌ No authenticated user found for Intercom', { auth: !!auth, user: !!auth?.user });
                // For non-authenticated users - no Intercom
                return;
            }
        }, 1000); // Same timeout as Footer
    }

    useEffect(() => {
        configIntercom();
        console.log('📞 IntercomProviderFixed initialized for user:', auth?.user?.name || 'anonymous');
    }, [auth?.user?.id]);

    return null; // No UI component needed
}