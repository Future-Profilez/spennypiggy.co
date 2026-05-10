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

    const DiagnosticRow = ({ title, result, errors = [] }) => {
        if (!result) return null;
        return (
            <li className={`px-6 py-5 border-l-4 ${result.status === 'passed' ? 'border-green-500 bg-white' : result.status === 'failed' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center w-full">
                        <div className="flex-shrink-0 mr-4">
                            {getStatusIcon(result.status)}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900">{title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                            
                            {errors && errors.length > 0 && (
                                <div className="mt-3 bg-red-100 p-3 rounded-md border border-red-200">
                                    <h5 className="text-xs font-bold text-red-800 mb-2 uppercase tracking-wider">Error Details:</h5>
                                    <ul className="list-disc pl-5 text-xs text-red-700 space-y-1">
                                        {errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    {result.time_ms && (
                        <div className="ml-4 flex-shrink-0 text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {result.time_ms}ms
                        </div>
                    )}
                </div>
            </li>
        );
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
                        <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-200">
                            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Detailed Diagnostic Report
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Individual component test results are listed below.
                                </p>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                
                                <DiagnosticRow title="Code Syntax & Routes Integrity" result={results.routes_syntax} errors={results.routes_syntax?.errors} />
                                <DiagnosticRow title="Database Connectivity" result={results.database} />
                                <DiagnosticRow title="Cache / Redis" result={results.cache} />
                                <DiagnosticRow title="User Sign Up Flow" result={results.signup_flow} />
                                <DiagnosticRow title="Wish Items (Add/Edit/Delete)" result={results.wish_items} />
                                <DiagnosticRow title="Bills (Add/Edit/Delete)" result={results.bills} />
                                <DiagnosticRow title="Memberships (Add/Edit/Delete)" result={results.memberships} />
                                <DiagnosticRow title="Shop Items (Add/Edit/Delete)" result={results.shop_items} />
                                <DiagnosticRow title="Tasks (Add/Edit/Delete)" result={results.tasks} />
                                <DiagnosticRow title="Add to Cart Flow" result={results.cart_flow} />
                                <DiagnosticRow title="Social Flow (Follow/Unfollow)" result={results.social_flow} />
                                <DiagnosticRow title="Profile Management (Update Bio/Name/Media)" result={results.profile_update} />
                                <DiagnosticRow title="Platform Search Engine" result={results.search_engine} />
                                <DiagnosticRow title="Stripe Connect & ID Verification" result={results.stripe_id_flow} />
                                <DiagnosticRow title="Stripe Payments Processing" result={results.stripe_payments} />
                                <DiagnosticRow title="Email Service" result={results.email} />
                                <DiagnosticRow title="Push Notifications (MagicBell)" result={results.push_notifications} />
                                <DiagnosticRow title="Image Hosting (Uploadcare)" result={results.uploadcare} />
                                <DiagnosticRow title="Support Chat (Intercom)" result={results.intercom} />
                                <DiagnosticRow title="Queue Health (Failed Jobs)" result={results.queue_health} errors={results.queue_health?.errors} />
                                <DiagnosticRow title="Recent Error Log (Last 24h)" result={results.recent_errors} errors={results.recent_errors?.errors} />
                                <DiagnosticRow title="Financial Data Integrity" result={results.financial_integrity} errors={results.financial_integrity?.errors} />
                                <DiagnosticRow title="Referral & Earn System" result={results.referral_system} errors={results.referral_system?.errors} />
                                <DiagnosticRow title="Storage Permissions" result={results.storage_permissions} errors={results.storage_permissions?.errors} />
                                <DiagnosticRow title="Disk Space" result={results.disk_space} />
                                <DiagnosticRow title="Environment Variables" result={results.env_variables} errors={results.env_variables?.errors} />
                                <DiagnosticRow title="Stripe Webhook Config" result={results.stripe_webhook} errors={results.stripe_webhook?.errors} />
                                <DiagnosticRow title="Scheduled Tasks / Cron" result={results.scheduled_tasks} errors={results.scheduled_tasks?.errors} />
                                <DiagnosticRow title="Pending Database Migrations" result={results.pending_migrations} errors={results.pending_migrations?.errors} />
                                <DiagnosticRow title="Stripe Connected Accounts Health" result={results.stripe_accounts_health} errors={results.stripe_accounts_health?.errors} />
                                <DiagnosticRow title="App Homepage Response Time" result={results.app_response_time} />
                                <DiagnosticRow title="Stuck Payouts & Blocked Reserves" result={results.stuck_payouts} errors={results.stuck_payouts?.errors} />

                            </ul>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}