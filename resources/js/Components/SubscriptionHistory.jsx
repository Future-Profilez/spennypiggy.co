import React from 'react';

// Simple date formatting function
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return 'Invalid Date';
    }
};

const SubscriptionHistory = ({ subscriptionHistory = [] }) => {
    const getStatusBadge = (status) => {
        const statusConfig = {
            'paid': { class: 'bg-green-100 text-green-800', text: 'Paid' },
            'active': { class: 'bg-green-100 text-green-800', text: 'Active' },
            'trialing': { class: 'bg-yellow-100 text-yellow-800', text: 'Trial' },
            'incomplete': { class: 'bg-red-100 text-red-800', text: 'Incomplete' },
            'incomplete_expired': { class: 'bg-red-100 text-red-800', text: 'Expired' },
            'past_due': { class: 'bg-orange-100 text-orange-800', text: 'Past Due' },
            'canceled': { class: 'bg-gray-100 text-gray-800', text: 'Canceled' },
            'unpaid': { class: 'bg-red-100 text-red-800', text: 'Unpaid' },
            'initiated': { class: 'bg-blue-100 text-blue-800', text: 'Processing' },
        };
        
        const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', text: status || 'Unknown' };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
                {config.text}
            </span>
        );
    };

    const formatCurrency = (amount, currency = 'GBP') => {
        const currencySymbols = {
            'GBP': '£',
            'USD': '$',
            'EUR': '€'
        };
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
    };

    const getExpiryDate = (subscription) => {
        if (subscription.current_end_subscription_date) {
            return formatDate(subscription.current_end_subscription_date);
        }
        if (subscription.current_end_trial_date) {
            return formatDate(subscription.current_end_trial_date);
        }
        if (subscription.upcoming_payment) {
            return formatDate(subscription.upcoming_payment);
        }
        return 'N/A';
    };

    const getStartDate = (subscription) => {
        // Always prioritize actual subscription period dates over created_at
        if (subscription.current_start_subscription_date) {
            return formatDate(subscription.current_start_subscription_date);
        }
        if (subscription.current_start_trial_date) {
            return formatDate(subscription.current_start_trial_date);
        }
        // Only use created_at as absolute last resort
        return 'N/A';
    };

    if (!subscriptionHistory || subscriptionHistory.length === 0) {
        return (
            <div className="bg-white rounded-[30px]   shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription History</h3>
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-500">No subscription history found</p>
                    <p className="text-sm text-gray-400 mt-1">Your subscription payments will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[30px]   ">
            <div className="py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Subscription History</h3>
                <p className="text-sm text-gray-600 mt-1">Complete history of your Spenny Piggy subscription payments</p>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                           
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expires
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {subscriptionHistory.map((subscription, index) => (
                            <tr key={subscription.id || index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {getStartDate(subscription)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {formatCurrency(subscription.amount, subscription.currency)}
                                        </span>
                                        {subscription.tax && parseFloat(subscription.tax) > 0 && (
                                            <span className="text-xs text-gray-500">
                                                +{formatCurrency(subscription.tax, subscription.currency)} tax
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(subscription.status)}
                                </td>
                                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        {subscription.current_start_subscription_date && subscription.current_end_subscription_date ? (
                                            <>
                                                <span>Subscription</span>
                                                <span className="text-xs">
                                                    {formatDate(subscription.current_start_subscription_date)} - {formatDate(subscription.current_end_subscription_date)}
                                                </span>
                                            </>
                                        ) : subscription.current_start_trial_date && subscription.current_end_trial_date ? (
                                            <>
                                                <span>Trial Period</span>
                                                <span className="text-xs">
                                                    {formatDate(subscription.current_start_trial_date)} - {formatDate(subscription.current_end_trial_date)}
                                                </span>
                                            </>
                                        ) : (
                                            <span>Monthly</span>
                                        )}
                                    </div>
                                </td> */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {getExpiryDate(subscription)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {subscriptionHistory.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Showing {subscriptionHistory.length} subscription record{subscriptionHistory.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SubscriptionHistory;