import React from 'react';
import { Head } from '@inertiajs/react';
import IntercomProvider from '@/Components/IntercomProvider';

export default function IntercomDebug({ scenarios, config, users }) {
    return (
        <>
            <Head title="Intercom Debug" />
            <IntercomProvider />
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Intercom Debug Information</h1>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Configuration */}
                        <div className="bg-white rounded-[30px] md:rounded-[40px]   shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4 text-green-800">Configuration</h2>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <strong>Services Config:</strong>
                                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(config['services.intercom'], null, 2)}
                                    </pre>
                                </div>
                                <div>
                                    <strong>Environment Variables:</strong>
                                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(config.env_vars, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Test Users */}
                        <div className="bg-white rounded-[30px] md:rounded-[40px]   shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4 text-blue-800">Available Test Users</h2>
                            <div className="space-y-3 text-sm">
                                {Object.entries(users).map(([key, user]) => (
                                    <div key={key} className="p-2 border rounded">
                                        <strong className="capitalize">{key.replace('_', ' ')}:</strong>
                                        {user ? (
                                            <div className="mt-1 text-gray-600">
                                                ID: {user.id}, Name: {user.name}, Role: {user.role}
                                            </div>
                                        ) : (
                                            <div className="mt-1 text-red-500">Not found</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Scenarios */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Object.entries(scenarios).map(([scenario, settings]) => (
                            <div key={scenario} className="bg-white rounded-[30px] md:rounded-[40px]   shadow-md p-6">
                                <h3 className="text-lg font-semibold mb-3 capitalize text-purple-800">
                                    {scenario.replace('_', ' ')} Scenario
                                </h3>
                                <div className="text-sm">
                                    <p className="mb-2">
                                        <strong>Enabled:</strong> 
                                        <span className={`ml-2 px-2 py-1 rounded text-white ${settings?.enabled ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {settings?.enabled ? 'Yes' : 'No'}
                                        </span>
                                    </p>
                                    
                                    {settings && (
                                        <details className="mt-3">
                                            <summary className="cursor-pointer font-medium text-gray-700">
                                                View Full Settings
                                            </summary>
                                            <pre className="mt-2 p-3 bg-gray-100 text-xs rounded overflow-x-auto max-h-60">
                                                {JSON.stringify(settings, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-6">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-3">How to Test Intercom</h3>
                        <div className="text-sm text-yellow-700 space-y-2">
                            <p><strong>1. Check the console</strong> for IntercomProvider debug logs</p>
                            <p><strong>2. For Intercom to show, you need:</strong></p>
                            <ul className="ml-6 list-disc space-y-1">
                                <li>INTERCOM_ENABLED=true</li>
                                <li>Valid INTERCOM_APP_ID</li>
                                <li>Be logged in as a creator (role=1) or admin (role=0)</li>
                            </ul>
                            <p><strong>3. The widget appears</strong> in the bottom-right corner as a chat bubble</p>
                            <p><strong>4. Check browser dev tools</strong> for any JavaScript errors</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}