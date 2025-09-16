import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';

export default function CreatorSubscriptionWidget({ className = '', onStatusChange = null }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubscriptionStatus = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/creator/subscription/status');
            setStatus(response.data);
            
            // Notify parent component if callback provided
            if (onStatusChange) {
                onStatusChange(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch subscription status:', err);
            setError('Unable to load subscription status');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionStatus();
    }, []);

    if (loading) {
        return (
            <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
                <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center text-red-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            </div>
        );
    }

    if (!status || status.eligible) {
        // Don't show widget if subscription is valid
        return null;
    }

    // Determine alert style based on status
    const getAlertStyle = () => {
        switch (status.status) {
            case 'no_subscription':
                return {
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    textColor: 'text-red-800',
                    iconColor: 'text-red-600',
                    buttonColor: 'bg-red-600 hover:bg-red-700'
                };
            case 'trial_active':
                if (status.action_required) {
                    return {
                        bgColor: 'bg-yellow-50',
                        borderColor: 'border-yellow-200',
                        textColor: 'text-yellow-800',
                        iconColor: 'text-yellow-600',
                        buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
                    };
                }
                return null; // Don't show for normal trial
            default:
                return {
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    textColor: 'text-orange-800',
                    iconColor: 'text-orange-600',
                    buttonColor: 'bg-orange-600 hover:bg-orange-700'
                };
        }
    };

    console.log("sdhjfkhd")

    const alertStyle = getAlertStyle();
    if (!alertStyle) return null;

    return (
        <div className={`${alertStyle.bgColor} border ${alertStyle.borderColor} rounded-lg p-4 ${className}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg className={`w-5 h-5 ${alertStyle.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${alertStyle.textColor}`}>
                        Subscription Required
                    </h3>
                    <div className={`mt-1 text-sm ${alertStyle.textColor}`}>
                        <p>{status.message}</p>
                        {status.status === 'no_subscription' && (
                            <p className="mt-2 text-xs">
                                You need an active subscription to receive payments from supporters.
                            </p>
                        )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {status.suggestions && status.suggestions.length > 0 && (
                            status.suggestions.map((suggestion, index) => (
                                <Link
                                    key={index}
                                    href={suggestion.action_url}
                                    className={`inline-flex items-center px-3 py-2 text-xs font-medium text-white ${alertStyle.buttonColor} rounded-md transition-colors duration-200`}
                                >
                                    {suggestion.title}
                                    {suggestion.estimated_time && (
                                        <span className="ml-1 text-xs opacity-75">
                                            ({suggestion.estimated_time})
                                        </span>
                                    )}
                                </Link>
                            ))
                        )}
                        
                        {status.status === 'no_subscription' && (
                            <Link
                                href="/subscription/plans"
                                className={`inline-flex items-center px-3 py-2 text-xs font-medium text-white ${alertStyle.buttonColor} rounded-md transition-colors duration-200`}
                            >
                                View Plans
                            </Link>
                        )}
                    </div>

                    {/* Additional info for specific statuses */}
                    {status.subscription_status !== undefined && (
                        <div className="mt-2 text-xs opacity-75">
                            Status Code: {status.subscription_status}
                        </div>
                    )}
                </div>
                
                {/* Dismiss button (optional) */}
                <div className="flex-shrink-0 ml-3">
                    <button
                        onClick={() => setStatus({ ...status, eligible: true })}
                        className={`inline-flex ${alertStyle.textColor} hover:bg-white hover:bg-opacity-20 rounded-md p-1.5 transition-colors duration-200`}
                        title="Dismiss temporarily"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Progress indicator for subscription status */}
            {status.subscription_status !== undefined && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className={alertStyle.textColor}>Subscription Status</span>
                        <span className={`font-medium ${alertStyle.textColor}`}>
                            {status.subscription_status === 0 ? 'Inactive' : 
                             status.subscription_status === 1 ? 'Active' : 
                             status.subscription_status === 2 ? 'Trial' : 'Unknown'}
                        </span>
                    </div>
                    <div className="mt-1 w-full bg-white bg-opacity-50 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                                status.subscription_status === 1 ? 'bg-green-500 w-full' :
                                status.subscription_status === 2 ? 'bg-yellow-500 w-3/4' :
                                'bg-red-500 w-1/4'
                            }`}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
}
