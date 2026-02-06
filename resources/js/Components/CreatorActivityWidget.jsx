import React from 'react';
import { Link, usePage } from '@inertiajs/react';

const CreatorActivityWidget = (props) => {
    const pge = usePage().props;
    const { activityStatus, className = "" } = props;
    if (!activityStatus || activityStatus.status === 'not_creator') {
        return null;
    }
    if (activityStatus.status === 'not_fully_verified') {
        return (
            <div className={`rounded-xl  border-2 p-4 bg-yellow-100 border-yellow-300 text-yellow-800 ${className}`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl" role="img" aria-label="status">
                            ⏳
                        </span>
                        <div>
                            <h3 className="font-semibold text-lg">Complete Your Verification</h3>
                            <p className="text-sm opacity-90">
                                Complete your identity verification and profile approval to start earning with activity requirements.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/creator/activity"
                        className="text-sm underline hover:no-underline opacity-80 hover:opacity-100"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'grace_period':
                return 'bg-white sshadow-pink border-black text-blue-600';
            case 'active':
                return 'bg-green-100 border-green-300 text-green-800';
            case 'insufficient_content':
                return 'bg-red-100 border-red-300 text-red-800';
            case 'grace_period_ending':
                return 'bg-yellow-100 border-yellow-300 text-yellow-800';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'grace_period':
                return '🆕';
            case 'active':
                return '✅';
            case 'insufficient_content':
                return '⚠️';
            case 'grace_period_ending':
                return '⏰';
            default:
                return 'ℹ️';
        }
    };

    const getStatusMessage = (status, contentCount, daysRemaining) => {
        switch (status) {
            case 'grace_period':
                return `Welcome! You're in your grace period (${daysRemaining || 0} days left). Payments are enabled.`;
            case 'active':
                return `Great job! You have ${contentCount} active content items. Payments are enabled.`;
            case 'insufficient_content':
                return `Payments are paused. You need ${3 - contentCount} more content items to reactivate payments.`;
            case 'grace_period_ending':
                return `Your grace period ends in ${daysRemaining || 0} days. You have ${contentCount} content items.`;
            default:
                return 'Activity status unknown';
        }
    };

    const getSuggestions = (status, contentCount) => {
        const suggestions = [];
        
        if (status === 'insufficient_content' || (status === 'grace_period_ending' && contentCount < 3)) {
            const needed = 3 - contentCount;
            if (needed > 0) {
                suggestions.push(`Create ${needed} more ${needed === 1 ? 'item' : 'items'}`);
            }
        }

        return suggestions;
    };

    const suggestions = getSuggestions(activityStatus.status, activityStatus.content_count || activityStatus.current_content || 0);
    return (
        <>
        <div className={`rounded-xl  shadow-pink border-2 p-3 ${getStatusColor(activityStatus.status)} ${className}`}>
            <div className="lg:flex items-center justify-between">
                <div className="md:flex items-center gap-3 lg:max-w-[70%] me-3">
                    <div>
                        <h3 className=" text-xl font-gulfs uppercase">
                        <span className="me-2" role="img" aria-label="status">
                        {getStatusIcon(activityStatus.status)} </span> Activity Status</h3>
                        <p className="text-normal opacity-90 mt-2">
                            {getStatusMessage(
                                activityStatus.status, 
                                activityStatus.content_count || activityStatus.current_content || 0,
                                activityStatus.days_remaining || 0
                            )}
                        </p>
                    </div>
                </div>
                <div className='!mt-3'>
                    <Link
                        href="/creator/activity"
                        className="text-center block lg:inline w-full lg:w-auto whitespace-nowrap text-normal bg-white text-black  px-3 py-2 rounded-xl text-sm  hover:underline opacity-80 hover:opacity-100"
                    >
                        View Details
                    </Link>
                </div>
            </div>

            {activityStatus.status === 'insufficient_content' && (
                <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className="text-normal opacity-90">
                        <strong>Note:</strong> Once you add the required content, payments will resume automatically within a few minutes.
                    </p>
                </div>
            )}
        </div>
        </>
    );
};

export default CreatorActivityWidget;
