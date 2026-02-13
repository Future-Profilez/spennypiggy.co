import React, { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import IntercomProviderFixed from '@/Components/IntercomProviderFixed';

export default function TestIntercom() {
    const { props } = usePage();
    const intercom = props?.intercom || {};

    useEffect(() => {
        
        // The IntercomProvider will automatically handle loading
        // We just need to wait and test if it works
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkIntercom = () => {
            attempts++;
            
            if (window.Intercom) {
                
                // Check if the widget is actually visible
                const widget = document.querySelector('iframe[name*="intercom"]');
                
                return; // Stop checking
            } else {
                
                if (attempts < maxAttempts) {
                    setTimeout(checkIntercom, 1000);
                } else {
                    console.log('Check if IntercomProvider is working correctly');
                }
            }
        };
        
        setTimeout(checkIntercom, 2000); // Give IntercomProvider time to load
    }, []);

    const handleTestIntercom = () => {
        if (window.Intercom) {
            window.Intercom('show');
        } else {
            console.log('Intercom not available yet - check if INTERCOM_ENABLED=true and you are a creator');
        }
    };

    const handleUpdateIntercom = () => {
        if (window.Intercom) {
            window.Intercom('update', {
                ...window.intercomSettings,
                name: 'Updated Test User',
                custom_attributes: {
                    ...window.intercomSettings?.custom_attributes,
                    test_update: new Date().toISOString()
                }
            });
            console.log('Intercom updated with new data');
        } else {
            console.log('Intercom not available for update');
        }
    };

    return (
        <>
            <Head title="Test Intercom" />
            <IntercomProviderFixed />
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Intercom Test Page</h1>
                    
                    <div className="bg-white rounded-[40px]   shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Intercom Status</h2>
                        <p className="text-gray-600 mb-4">
                            This page tests the new IntercomProvider integration. Check the browser console for detailed logs.
                        </p>
                        
                        <div className="space-x-2 mb-4">
                            <button 
                                onClick={handleTestIntercom}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Show Intercom Widget
                            </button>
                            
                            <button 
                                onClick={handleUpdateIntercom}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Test Intercom Update
                            </button>
                        </div>

                        <div className="text-sm text-gray-500">
                            <p><strong>Status:</strong> {intercom?.enabled ? '✅ Enabled' : '❌ Disabled'}</p>
                            {!intercom?.enabled && (
                                <p className="text-orange-600 mt-2">
                                    💡 Intercom is disabled. Make sure INTERCOM_ENABLED=true and you're logged in as a creator.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px]   shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Configuration Details</h2>
                        <div className="space-y-2 text-sm">
                            <p><strong>User Authenticated:</strong> {props.auth?.user ? 'Yes' : 'No'}</p>
                            {props.auth?.user && (
                                <>
                                    <p><strong>User ID:</strong> {props.auth.user.id}</p>
                                    <p><strong>User Name:</strong> {props.auth.user.name}</p>
                                    <p><strong>User Email:</strong> {props.auth.user.email}</p>
                                    <p><strong>User Role:</strong> {props.auth.user.role} ({props.auth.user.role === 0 ? 'Gifter' : props.auth.user.role === 1 ? 'Creator' : 'Unknown'})</p>
                                    <p><strong>Created At:</strong> {props.auth.user.created_at}</p>
                                </>
                            )}
                            <p><strong>Enabled:</strong> {intercom?.enabled ? 'Yes' : 'No'}</p>
                            <p><strong>App ID:</strong> {intercom?.appId || 'Not set'}</p>
                            <p><strong>User Hash:</strong> {intercom?.boot?.user_hash ? '✅ Present' : '❌ Not set'}</p>
                        </div>
                        
                        {intercom?.boot?.custom_attributes && (
                            <details className="mt-4">
                                <summary className="cursor-pointer font-medium">View Custom Attributes</summary>
                                <pre className="mt-2 p-2 bg-gray-100 text-xs rounded overflow-x-auto">
                                    {JSON.stringify(intercom.boot.custom_attributes, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}