import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiRefreshCw, FiCalendar, FiDollarSign, FiUsers, FiTrendingUp, FiUser, FiEye, FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import PriceFormat from '@/includes/PriceFormat';

export default function Index({ auth, mySubscriptions, subscribersToMe, subscriptionStats }) {
    const [activeTab, setActiveTab] = useState('my-subscriptions');
    const [cancellingSubscriptions, setCancellingSubscriptions] = useState(new Set());
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const { formatMultiPrice } = PriceFormat();
    const { global_currency, flash } = usePage().props;

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            showToastMessage(flash.success, 'success');
        } else if (flash?.error) {
            showToastMessage(flash.error, 'error');
        }
    }, [flash]);
    
    const showToastMessage = (message, type) => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    };
    
    const handleCancelSubscription = async (subscriptionId) => {
        if (cancellingSubscriptions.has(subscriptionId)) return;
        
        const confirmed = window.confirm('Are you sure you want to cancel this subscription? You will lose access to exclusive content at the end of your current billing period.');
        if (!confirmed) return;
        
        setCancellingSubscriptions(prev => new Set([...prev, subscriptionId]));
        
        router.post(`/subscriptions/${subscriptionId}/cancel`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setCancellingSubscriptions(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(subscriptionId);
                    return newSet;
                });
            }
        });
    };

    const getStatusBadge = (subscription) => {
        if (subscription.cancel_at_period_end) {
            return <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">Canceling</span>;
        } else if (subscription.status === 'active') {
            return <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">Active</span>;
        } else {
            return <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">Inactive</span>;
        }
    };

    const renderSubscriptionCard = (subscription) => {
        const isCancelling = cancellingSubscriptions.has(subscription.id);
        const getFormattedDate = (dateValue) => {
            if (!dateValue) return 'N/A';
            
            try {
                let date;
                // Handle Unix timestamp (if it's a number)
                if (typeof dateValue === 'number') {
                    date = new Date(dateValue * 1000);
                } else {
                    // Handle string date
                    date = new Date(dateValue);
                }
                
                // Check if date is valid
                if (isNaN(date.getTime())) {
                    return 'N/A';
                }
                
                return date.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            } catch (error) {
                console.error('Date formatting error:', error, dateValue);
                return 'N/A';
            }
        };
        
        const nextPaymentDate = getFormattedDate(subscription.next_payment || subscription.current_period_end);

        return (
            <div key={subscription.id} className="bg-white rounded-[30px]   shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 mb-4 border-l-4 border-purple-400">
                <div className="lg:flex flex-col md:flex-row">
                    {/* Left side - Image */}
                    <div className="relative w-full h-[200px] lg:h-auto lg:max-w-[200px] bg-purple-50 flex items-center justify-center p-4">
                        <span className='absolute top-4 left-4'>
                            <FiRefreshCw size={'30px'} className="mr-2 text-purple-500" />
                        </span>
                        {subscription.wish_item?.image_url ? (
                            <img src={subscription.wish_item.image_url} 
                                alt={subscription.wish_item.wishname} 
                                className="h-12 w-12 object-cover rounded-[30px] "
                            />
                        ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-purple-50 rounded-[30px] ">
                                <FiRefreshCw className="h-12 w-12 text-purple-500" />
                            </div>
                        )}
                    </div>
                    
                    {/* Right side - Details */}
                    <div className="w-full p-4">
                        <div className="lg:flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-gulfs uppercase text-gray-800">
                                    {subscription.wish_item?.wishname || 'Subscription'}
                                </h3>
                                <p className="text-normal mt-2 text-gray-600">
                                    Creator: {subscription.creator?.name || 'Unknown'}
                                </p>
                                {subscription.creator?.username && (
                                    <Link href={`/${subscription.creator.username}`} className="text-normal text-purple-500 hover:underline">
                                        @{subscription.creator.username}
                                    </Link>
                                )}
                            </div>
                            
                            <div className='lg:flex lg:items-center justify-center gap-2 flex-wrap'>
                                <p className='me-4 text-lg font-bold'>
                                    {formatMultiPrice(subscription.amount, subscription.currency || auth.user.default_currency || global_currency)}
                                    {subscription.recurring_for === 'continue' && '/month'}
                                </p>
                                {getStatusBadge(subscription)}
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                <FiCalendar className="mr-2" />
                                <span>
                                    {subscription.recurring_for === 'onetime' ? (
                                        subscription.expires_at ? 
                                            `Expires: ${getFormattedDate(subscription.expires_at)}` : 
                                            'One-time purchase'
                                    ) : subscription.cancel_at_period_end ? (
                                        `Ends on: ${nextPaymentDate}`
                                    ) : (
                                        `Next payment: ${nextPaymentDate}`
                                    )}
                                </span>
                            </div>
                            
                            {subscription.status === 'active' && (
                                <div className="mb-3">
                                    <Link href={`/${subscription.creator?.username}`} 
                                        className="text-[15px] text-purple-600 hover:underline mr-4"
                                    >
                                        🎉 Access Exclusive Posts
                                    </Link>
                                    <Link href={`/subscriptions/${subscription.id}`} 
                                        className="text-[15px] text-blue-600 hover:underline"
                                    >
                                        <FiEye className="inline mr-1" />View Details
                                    </Link>
                                </div>
                            )}
                            
                            {subscription.recent_events && subscription.recent_events.length > 0 && (
                                <div className="text-xs text-gray-500 mb-2">
                                    Recent: {subscription.recent_events[0].event_type} on {new Date(subscription.recent_events[0].event_date).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                            <p className='text-sm text-gray-500'>
                                Started: {new Date(subscription.created_at).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                            
                            {subscription.can_cancel && (
                                <button
                                    onClick={() => handleCancelSubscription(subscription.id)}
                                    disabled={isCancelling}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-[30px]  hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                                </button>
                            )}
                            
                            {subscription.cancel_at_period_end && (
                                <span className="text-sm text-orange-600 font-medium">
                                    Will cancel at period end
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSubscriberCard = (subscription) => {
        return (
            <div key={subscription.id} className="bg-white rounded-[30px]   shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 mb-4 border-l-4 border-green-400">
                <div className="lg:flex flex-col md:flex-row">
                    {/* Left side - Subscriber info */}
                    <div className="relative w-full h-[200px] lg:h-auto lg:max-w-[200px] bg-green-50 flex items-center justify-center p-4">
                        <span className='absolute top-4 left-4'>
                            <FiUsers size={'30px'} className="mr-2 text-green-500" />
                        </span>
                        {subscription.subscriber?.avatar_url ? (
                            <img src={subscription.subscriber.avatar_url} 
                                alt={subscription.subscriber.name} 
                                className="h-12 w-12 object-cover rounded-full"
                            />
                        ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-green-50 rounded-full">
                                <FiUser className="h-8 w-8 text-green-500" />
                            </div>
                        )}
                    </div>
                    
                    {/* Right side - Details */}
                    <div className="w-full p-4">
                        <div className="lg:flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-gulfs uppercase text-gray-800">
                                    {subscription.wish_item.wishname}
                                </h3>
                                <p className="text-normal mt-2 text-gray-600">
                                    Subscriber: {subscription.subscriber.name}
                                </p>
                                {subscription.subscriber.username && (
                                    <p className="text-sm text-gray-500">@{subscription.subscriber.username}</p>
                                )}
                            </div>
                            
                            <div className='lg:flex lg:items-center justify-center gap-2 flex-wrap'>
                                <p className='me-4 text-lg font-bold text-green-600'>
                                    {formatMultiPrice(subscription.amount, subscription.currency)}
                                    {subscription.recurring_for === 'continue' && '/month'}
                                </p>
                                {getStatusBadge(subscription)}
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Total Revenue:</span>
                                    <p className="font-medium text-green-600">
                                        {formatMultiPrice(subscription.total_revenue, subscription.currency)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Payments:</span>
                                    <p className="font-medium">{subscription.payments_count || 1}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Status:</span>
                                    <p className="font-medium capitalize">{subscription.status}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Started:</span>
                                    <p className="font-medium">
                                        {new Date(subscription.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-3">
                                <Link href={`/subscriptions/${subscription.id}`} 
                                    className="text-[15px] text-blue-600 hover:underline"
                                >
                                    <FiEye className="inline mr-1" />View Full Details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const StatCard = ({ icon, title, value, subtitle, color = "blue" }) => {
        const colorClasses = {
            blue: 'border-blue-500 text-blue-600 bg-blue-100',
            green: 'border-green-500 text-green-600 bg-green-100',
            purple: 'border-purple-500 text-purple-600 bg-purple-100',
            orange: 'border-orange-500 text-orange-600 bg-orange-100',
            pink: 'border-[#FF007F] text-[#FF007F] bg-pink-100',
        };
        const classes = colorClasses[color] || colorClasses.blue;
        const [borderClass, textClass, bgClass] = classes.split(' ');

        return (
            <div className={`bg-white rounded-[30px]  shadow-md p-6 border-t-4 ${borderClass}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <p className={`text-2xl font-bold ${textClass}`}>{value}</p>
                        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    <div className={`p-3 ${bgClass} rounded-full`}>
                        {icon}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            auth={auth}
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-[#FF007F] leading-tight">Subscription Management</h2>}
        >
            <Head title="Subscriptions" />
            
            <div className="py-12">
                <div className="containerbox mx-auto">
                    <div className="py-8">
                        {/* Stats Overview */}
                        <div className="mb-8">
                            <h1 className="text-3xl text-white font-gulfs uppercase mb-6">Subscription Overview</h1>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard
                                    icon={<FiRefreshCw className="h-8 w-8 text-blue-600" />}
                                    title="Active Subscriptions"
                                    value={subscriptionStats.as_subscriber.active_count}
                                    subtitle="Subscriptions you have"
                                    color="blue"
                                />
                                <StatCard
                                    icon={<FiDollarSign className="h-8 w-8 text-green-600" />}
                                    title="Monthly Cost"
                                    value={formatMultiPrice(subscriptionStats.as_subscriber.monthly_cost, auth?.user?.default_currency || global_currency)}
                                    subtitle="Your recurring payments"
                                    color="green"
                                />
                                <StatCard
                                    icon={<FiUsers className="h-8 w-8 text-purple-600" />}
                                    title="Your Subscribers"
                                    value={subscriptionStats.as_creator.active_subscribers}
                                    subtitle="People subscribing to you"
                                    color="purple"
                                />
                                <StatCard
                                    icon={<FiTrendingUp className="h-8 w-8 text-orange-600" />}
                                    title="Monthly Revenue"
                                    value={formatMultiPrice(subscriptionStats.as_creator.monthly_revenue, auth?.user?.default_currency || global_currency)}
                                    subtitle="Your recurring income"
                                    color="orange"
                                />
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex space-x-4 mb-6">
                            <button
                                onClick={() => setActiveTab('my-subscriptions')}
                                className={`px-6 py-3 rounded-[30px]   font-medium transition-colors ${
                                    activeTab === 'my-subscriptions' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                My Subscriptions ({mySubscriptions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('subscribers')}
                                className={`px-6 py-3 rounded-[30px]   font-medium transition-colors ${
                                    activeTab === 'subscribers' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                My Subscribers ({subscribersToMe.length})
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'my-subscriptions' && (
                            <div>
                                <div className="md:flex justify-between items-center mb-6">
                                    <h2 className="text-2xl text-white font-gulfs uppercase">My Subscriptions</h2>
                                </div>
                                
                                {mySubscriptions.length > 0 ? (
                                    <div className="space-y-4">
                                        {mySubscriptions.map(subscription => renderSubscriptionCard(subscription))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white rounded-[30px]  ">
                                        <FiRefreshCw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
                                        <p className="text-gray-600 mb-4">Start supporting your favorite creators by subscribing to their content.</p>
                                        <Link
                                            href="/"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-[30px]  shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                                        >
                                            Browse Creators
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'subscribers' && (
                            <div>
                                <div className="md:flex justify-between items-center mb-6">
                                    <h2 className="text-2xl text-white font-gulfs uppercase">My Subscribers</h2>
                                </div>
                                
                                {subscribersToMe.length > 0 ? (
                                    <div className="space-y-4">
                                        {subscribersToMe.map(subscription => renderSubscriberCard(subscription))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white rounded-[30px]  ">
                                        <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers yet</h3>
                                        <p className="text-gray-600 mb-4">Create subscription wish items to start getting subscribers and earning recurring revenue.</p>
                                        <Link
                                            href="/profile"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-[30px]  shadow-sm text-white bg-green-600 hover:bg-green-700"
                                        >
                                            Create Subscription Content
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Toast Notification */}
            {showToast && (
                <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
                    showToast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}>
                    <div className={`rounded-[30px]   p-4 shadow-lg ${
                        toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {toastType === 'success' ? (
                                    <FiCheckCircle className="h-5 w-5" />
                                ) : (
                                    <FiXCircle className="h-5 w-5" />
                                )}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">{toastMessage}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        onClick={() => setShowToast(false)}
                                        className="inline-flex rounded-[30px]  p-1.5 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                    >
                                        <span className="sr-only">Dismiss</span>
                                        <FiX className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
