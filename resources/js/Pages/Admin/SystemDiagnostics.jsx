import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function SystemDiagnostics({ auth, app_version, php_version, laravel_version }) {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [overallStatus, setOverallStatus] = useState(null);
    const [lastRun, setLastRun] = useState(null);

    const runDiagnostics = async () => {
        setRunning(true);
        setResults(null);
        setOverallStatus(null);
        
        const toastId = toast.loading('Running system diagnostics...');
        
        try {
            const response = await axios.post('/admin/system-diagnostics/run');
            setResults(response.data.results);
            setOverallStatus(response.data.status);
            setLastRun(response.data.timestamp);
            
            if (response.data.status === 'passed') {
                toast.success('All systems operational!', { id: toastId });
            } else if (response.data.status === 'warning') {
                toast.success('Diagnostics completed with warnings.', { id: toastId });
            } else {
                toast.error('System diagnostics failed!', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to run diagnostics. Check server logs.', { id: toastId });
            setOverallStatus('error');
        } finally {
            setRunning(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                );
            case 'failed':
                return (
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                );
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'passed': return 'bg-green-50 text-green-700 border-green-200';
            case 'failed': return 'bg-red-50 text-red-700 border-red-200';
            case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">System Diagnostics</h2>}
        >
            <Head title="System Diagnostics" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Card */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Health Check Dashboard</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Run complete end-to-end tests for core platform functionalities including sign-up flow, Stripe Connect ID verification, and Payments.
                                </p>
                            </div>
                            <div>
                                <button
                                    onClick={runDiagnostics}
                                    disabled={running}
                                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${running ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {running ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Running Diagnostics...
                                        </>
                                    ) : (
                                        'Run Full Diagnostics'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Environment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4 flex items-center justify-between border-l-4 border-blue-500">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">App Version</p>
                                <p className="text-lg font-medium text-gray-900">{app_version}</p>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4 flex items-center justify-between border-l-4 border-indigo-500">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PHP Version</p>
                                <p className="text-lg font-medium text-gray-900">{php_version}</p>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4 flex items-center justify-between border-l-4 border-red-500">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Laravel</p>
                                <p className="text-lg font-medium text-gray-900">{laravel_version}</p>
                            </div>
                        </div>
                    </div>

                    {/* Results Area */}
                    {overallStatus && (
                        <div className={`mb-6 p-4 rounded-md border ${overallStatus === 'passed' ? 'bg-green-50 border-green-200' : overallStatus === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    {getStatusIcon(overallStatus)}
                                </div>
                                <div className="ml-3">
                                    <h3 className={`text-sm font-medium ${overallStatus === 'passed' ? 'text-green-800' : overallStatus === 'warning' ? 'text-yellow-800' : 'text-red-800'}`}>
                                        {overallStatus === 'passed' ? 'All Systems Operational' : overallStatus === 'warning' ? 'Systems Operational with Warnings' : 'System Issues Detected'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${overallStatus === 'passed' ? 'text-green-700' : overallStatus === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>
                                        Last run: {lastRun}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {results && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <ul className="divide-y divide-gray-200">
                                
                                {/* Database */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.database.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Database Connectivity</p>
                                                <p className="text-sm text-gray-500">{results.database.message}</p>
                                            </div>
                                        </div>
                                        {results.database.time_ms && (
                                            <div className="text-sm text-gray-500">{results.database.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Cache */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.cache.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Cache / Redis</p>
                                                <p className="text-sm text-gray-500">{results.cache.message}</p>
                                            </div>
                                        </div>
                                        {results.cache.time_ms && (
                                            <div className="text-sm text-gray-500">{results.cache.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Signup Flow */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.signup_flow.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">User Sign Up Flow</p>
                                                <p className="text-sm text-gray-500">{results.signup_flow.message}</p>
                                            </div>
                                        </div>
                                        {results.signup_flow.time_ms && (
                                            <div className="text-sm text-gray-500">{results.signup_flow.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Wish Items */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.wish_items.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Wish Items (Add/Edit/Delete)</p>
                                                <p className="text-sm text-gray-500">{results.wish_items.message}</p>
                                            </div>
                                        </div>
                                        {results.wish_items.time_ms && (
                                            <div className="text-sm text-gray-500">{results.wish_items.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Bills */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.bills.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Bills (Add/Edit/Delete)</p>
                                                <p className="text-sm text-gray-500">{results.bills.message}</p>
                                            </div>
                                        </div>
                                        {results.bills.time_ms && (
                                            <div className="text-sm text-gray-500">{results.bills.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Memberships */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.memberships.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Memberships (Add/Edit/Delete)</p>
                                                <p className="text-sm text-gray-500">{results.memberships.message}</p>
                                            </div>
                                        </div>
                                        {results.memberships.time_ms && (
                                            <div className="text-sm text-gray-500">{results.memberships.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Shop Items */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.shop_items.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Shop Items (Add/Edit/Delete)</p>
                                                <p className="text-sm text-gray-500">{results.shop_items.message}</p>
                                            </div>
                                        </div>
                                        {results.shop_items.time_ms && (
                                            <div className="text-sm text-gray-500">{results.shop_items.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Tasks */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.tasks.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Tasks (Add/Edit/Delete)</p>
                                                <p className="text-sm text-gray-500">{results.tasks.message}</p>
                                            </div>
                                        </div>
                                        {results.tasks.time_ms && (
                                            <div className="text-sm text-gray-500">{results.tasks.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Cart Flow */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.cart_flow.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Add to Cart Flow</p>
                                                <p className="text-sm text-gray-500">{results.cart_flow.message}</p>
                                            </div>
                                        </div>
                                        {results.cart_flow.time_ms && (
                                            <div className="text-sm text-gray-500">{results.cart_flow.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Social Flow */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.social_flow.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Social Flow (Follow/Unfollow)</p>
                                                <p className="text-sm text-gray-500">{results.social_flow.message}</p>
                                            </div>
                                        </div>
                                        {results.social_flow.time_ms && (
                                            <div className="text-sm text-gray-500">{results.social_flow.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Profile Update */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.profile_update.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Profile Management (Update Bio/Name/Media)</p>
                                                <p className="text-sm text-gray-500">{results.profile_update.message}</p>
                                            </div>
                                        </div>
                                        {results.profile_update.time_ms && (
                                            <div className="text-sm text-gray-500">{results.profile_update.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Search Engine */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.search_engine.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Platform Search Engine</p>
                                                <p className="text-sm text-gray-500">{results.search_engine.message}</p>
                                            </div>
                                        </div>
                                        {results.search_engine.time_ms && (
                                            <div className="text-sm text-gray-500">{results.search_engine.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Stripe ID Flow */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.stripe_id_flow.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Stripe Connect & ID Verification</p>
                                                <p className="text-sm text-gray-500">{results.stripe_id_flow.message}</p>
                                            </div>
                                        </div>
                                        {results.stripe_id_flow.time_ms && (
                                            <div className="text-sm text-gray-500">{results.stripe_id_flow.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Stripe Payments */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.stripe_payments.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Stripe Payments Processing</p>
                                                <p className="text-sm text-gray-500">{results.stripe_payments.message}</p>
                                            </div>
                                        </div>
                                        {results.stripe_payments.time_ms !== undefined && (
                                            <div className="text-sm text-gray-500">{results.stripe_payments.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Emails */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.email.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Email Service</p>
                                                <p className="text-sm text-gray-500">{results.email.message}</p>
                                            </div>
                                        </div>
                                        {results.email.time_ms !== undefined && (
                                            <div className="text-sm text-gray-500">{results.email.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Push Notifications */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.push_notifications.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Push Notifications (MagicBell)</p>
                                                <p className="text-sm text-gray-500">{results.push_notifications.message}</p>
                                            </div>
                                        </div>
                                        {results.push_notifications.time_ms !== undefined && (
                                            <div className="text-sm text-gray-500">{results.push_notifications.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Uploadcare */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.uploadcare.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Image Hosting (Uploadcare)</p>
                                                <p className="text-sm text-gray-500">{results.uploadcare.message}</p>
                                            </div>
                                        </div>
                                        {results.uploadcare.time_ms !== undefined && (
                                            <div className="text-sm text-gray-500">{results.uploadcare.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                                {/* Intercom */}
                                <li className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {getStatusIcon(results.intercom.status)}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Support Chat (Intercom)</p>
                                                <p className="text-sm text-gray-500">{results.intercom.message}</p>
                                            </div>
                                        </div>
                                        {results.intercom.time_ms !== undefined && (
                                            <div className="text-sm text-gray-500">{results.intercom.time_ms}ms</div>
                                        )}
                                    </div>
                                </li>

                            </ul>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}