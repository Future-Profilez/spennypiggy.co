import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Popup from '@/Components/Popup';
import { FiPackage, FiGift, FiClock, FiCheck, FiX, FiArrowUp, FiArrowDown, FiEye, FiRefreshCw, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';

export default function Index({ auth, sentDeliverables, receivedDeliverables, activeSubscriptions = [] }) {

    const [selectedDeliverable, setSelectedDeliverable] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [cancellingSubscriptions, setCancellingSubscriptions] = useState(new Set());
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const { formatMultiPrice } = PriceFormat();
    const { global_currency, flash } = usePage().props;
    
    // Combine all deliverables into one array
    const allDeliverables = [
        ...sentDeliverables.map(d => ({ ...d, type: 'sent' })),
        ...receivedDeliverables.map(d => ({ ...d, type: 'received' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const openPopup = (deliverable) => {
        setSelectedDeliverable(deliverable);
        setShowPopup(true);
    };
    
    const closePopup = () => {
        setShowPopup(false);
    };
    
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
    
    // This is kept for backward compatibility but we'll use formatMultiPrice for display
    const formatAmount = (amount, currency = 'GBP') => {
        if (amount === null || amount === undefined) return 'N/A';
        
        const symbols = {
            'GBP': '£',
            'USD': '$',
            'EUR': '€',
        };
        
        const symbol = symbols[currency?.toUpperCase()] || currency || '£';
        // Always use transaction_amount when available
        const value = parseFloat(amount) || 0;
        const formattedValue = value >= 100 ? (value / 100).toFixed(2) : value.toFixed(2);
        return `${symbol}${formattedValue}`;
    };
    
    const getStatusClass = (status) => {
        switch(status?.toLowerCase()) {
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    const renderDeliverableCard = (deliverable) => {
        const metadata = typeof deliverable.metadata === 'string' ? JSON.parse(deliverable.metadata || '{}') : (deliverable.metadata || {});
        const type = deliverable.type;
        const person = type === 'sent' ? deliverable.creator : deliverable.gifter;
        
        // Determine display status (check purchase status first for refunds)
        const displayStatus = deliverable.purchase?.status === 'refunded' ? 'refunded' : deliverable.status;
        const statusClass = getStatusClass(displayStatus);
        
        // Get item based on product_type
        let itemName = "Gift Item";
        let itemprice = 0;
        let itemImage = null;
        
        if (deliverable.product_type === 'wish' && deliverable.wish_item) {
            itemName = deliverable.wish_item.wishname;
            itemImage = deliverable.wish_item.image_url;
            itemprice = deliverable.wish_item.price;
        } else if (deliverable.product_type === 'bill' && deliverable.bill) {
            // For bill items, show the bill name from relationship
            itemName = deliverable.bill.name;
            itemImage = deliverable.bill.perma_link;
            // Get price from bill or transaction amount
            itemprice = deliverable.bill.price || deliverable.transaction_amount || metadata.amount;
        } else if (deliverable.product_type === 'membership' && deliverable.membership) {
            // For membership items, show the membership level
            itemName = `${deliverable.membership.level} Membership`;
            itemImage = deliverable.membership.perma_link;
            itemprice = deliverable.membership.price || deliverable.transaction_amount || metadata.amount;
        } else if (deliverable.product_type === 'task' && deliverable.task) {
            // For task items
            itemName = deliverable.task.title;
            itemImage = deliverable.task.media_url;
            // For creators (received), show the task price (excluding fees). For gifters (sent), show transaction amount (total paid).
            if (type === 'received' && deliverable.task.price) {
                itemprice = deliverable.task.price;
            } else {
                itemprice = deliverable.transaction_amount || metadata.amount;
            }
        } else if (metadata.bill_name) {
            // Fallback to metadata bill_name if relationship not loaded
            itemName = metadata.bill_name;
            itemprice = metadata.amount || deliverable.transaction_amount;
        } else if (metadata.item_name) {
            itemName = metadata.item_name;
            itemprice = metadata.amount || deliverable.transaction_amount;
        }
      
        return (
            <div key={deliverable.id} className={`bg-white rounded-[40px]  
             shadow-md overflow-hidden hover:shadow-lg transition-shadow 
             duration-200 mb-2 md:mb-4 border border-2  ${type === 'sent' ? "!border-pink-400" : "border-mint"} `}>
                <div className="flex">
                    {/* Left side - Image */}
                    <div className={`hidden sm:flex relative w-full h-auto max-w-[130px] ${type === 'sent' ? "bg-pink-50" : "bg-green-50"}  flex items-center justify-center p-4`}>
                        <span className='absolute top-2 left-[40px]'>
                            {type === 'sent' ? (
                                <FiArrowUp size={'30px'} className="mr-2 text-blue-500" />
                            ) : (
                                <FiArrowDown size={'30px'} className="mr-2 text-pink-500" />
                            )}
                        </span>
                        {itemImage ? (
                            <img  src={itemImage} 
                                alt={itemName} 
                                className="h-12 w-12 object-cover rounded-[40px] "
                            />
                        ) : (
                            <div className="h-12 w-12 flex items-center justify-center  rounded-[40px] ">
                                <FiPackage className="h-12 w-12 text-pink-500" />
                            </div>
                        )}
                    </div>
                    
                    {/* Right side - Details */}
                    <div className="w-full p-3 md:p-4">
                        <div className="t">
                                <div className='mb-2'>
                                    <div className='flex flex-wrap justify-between'>
                                        <div>
                                            <h3 className="text-xl font-gulfs font-normal uppercase text-black"> {itemName} </h3>
                                            <p className=' text-gray-500 text-sm'>         
                                                {new Date(deliverable.created_at).toLocaleDateString('en-US', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })} {new Date(deliverable.created_at).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </p>
                                        </div>

                                        <div className='flex items-center justify-center gap-2 mt-2 '>
                                            <p className=' text-lg font-bold text-black mb-1 text-start'>{formatMultiPrice(
                                                deliverable.wish_item?.price || 
                                                itemprice || 
                                                deliverable.transaction_amount || 
                                                metadata.amount || 
                                                0, 
                                                (deliverable.wish_item?.currency || deliverable.payment_currency || metadata.currency || auth.user.default_currency || global_currency)
                                            )}</p>
                                            <span className={`capitalize px-3 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                                                {displayStatus === 'refunded' ? 'Refunded' : 
                                                    (deliverable.product_type === 'membership' ? 
                                                        (displayStatus === 'delivered' ? 'Content Delivered' : 'Content Processing') :
                                                        `Content ${displayStatus || 'Processing'}`
                                                    )
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className=''>
                                        <div className='lg:flex justify-between'>
                                            <div>
                                                <p className="text-normal mt-2 text-gray-500">
                                                    {type === 'sent' ? 
                                                    <a target='_blank' className='text-pink' href={deliverable?.creator?.username}>To: {person?.name || 'Unknown'}</a>
                                                    : `From: ${person?.name || 'Unknown'}`}
                                                </p>
                                                {deliverable.customer_email && (
                                                    <p className="text-normal text-gray-200 break-long-words">
                                                    {deliverable.customer_email}
                                                    </p>
                                                )}
                                                <button className='cursor-none uppercase text-xs bg-black rounded-full px-3 py-1 mt-2 text-white '>{deliverable?.product_type}</button>
                                            </div>
                                            <div className="mt-2">
                                                <ul>
                                                    <li className='flex items-center flex-wrap'>
                                                        {/* <Popup space="2 md:p-4"  
                                                            classes="text-[15px] text-pink ml-2"
                                                            text={<>🎉 View Exclusive Content</>} >
                                                                <img src={deliverable.deliverable_url} alt={deliverable.wish_item?.wishname} className="w-full h-full max-h-[90vh] object-cover rounded-[40px] " />
                                                        </Popup> */}
                                                        {deliverable?.product_type != 'support_payment' && deliverable?.product_type != 'membership' && deliverable.deliverable_url  ?
                                                            <li className='flex items-center flex-wrap'>
                                                                <a target='_blank' href={`${deliverable.deliverable_url}`} 
                                                                className="ml-2 text-[15px] text-pink" >🎉 View Exclusive Content</a>
                                                            </li> 
                                                        : ''}
                                                    </li>

                                                            
                                                    {deliverable?.product_type == 'support_payment' ?
                                                        <li className='flex items-center flex-wrap'>
                                                            <Link href={`/${deliverable?.creator?.username}`} 
                                                            className="ml-2 text-[15px] text-pink" >🎉 Get Supportors Only Post Access</Link>
                                                        </li>
                                                    : ''}

                                                    {deliverable?.product_type == 'bill'   ?
                                                        <li className='flex items-center flex-wrap'>
                                                            <Link href={`/${deliverable?.creator?.username}`} 
                                                            className="ml-2 text-[15px] text-pink" >🎉 Get Subscribers Only Post Access</Link>
                                                        </li>
                                                    : ''}
                                                    
                                                    {deliverable?.product_type == 'membership'   ?
                                                        <li className='flex items-center flex-wrap'>
                                                            <Link href={`/${deliverable?.creator?.username}`} 
                                                            className="ml-2 text-[15px] text-pink" >🎉 Get Members Only Post Access</Link>
                                                        </li>
                                                    : ''}

                                                    {deliverable?.product_type == 'task' ?
                                                        <li className='flex items-center flex-wrap'>
                                                            <Link href={deliverable?.purchase?.uuid ? route('task.order', deliverable.purchase.uuid) : `/tasks/${deliverable?.task?.uuid}`} 
                                                            className="ms-2 text-[15px] text-pink" >🎉 View Task Details</Link>
                                                        </li>
                                                    : ''}

                                                    {deliverable.certificate_url && (
                                                        <li className='flex items-center flex-wrap'>
                                                            <a target='_blank' href={deliverable.certificate_url} 
                                                            className="ml-2 text-[15px] text-green-600 hover:underline" >📜 Download Certificate</a>
                                                        </li>
                                                    )}
                                                </ul>
                                                <p></p>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                
                                    
                               
                                
                                {/* <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-500">Message:</span>
                                    <span className="font-medium text-gray-800 text-right">
                                        {deliverable.message || 'No message'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-500">Anonymous:</span>
                                    <span className="font-medium text-gray-800 text-right">
                                        {deliverable.anonymous ? 'Yes' : 'No'}
                                    </span>
                                </div> */}
                            
                        </div>
                        
                        <p>
                            {deliverable.message && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-[40px] ">
                                    <p className="text-sm text-gray-700 italic">"{deliverable.message}"</p>
                                </div>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    };
    
    const handleCancelSubscription = async (subscriptionId) => {
        if (cancellingSubscriptions.has(subscriptionId)) return;
        
        const confirmed = window.confirm('Are you sure you want to cancel this subscription? You will lose access to exclusive content at the end of your current billing period.');
        if (!confirmed) return;
        
        setCancellingSubscriptions(prev => new Set([...prev, subscriptionId]));
        
        try {
            const response = await fetch(`/subscriptions/${subscriptionId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Accept': 'application/json'
                },
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showToastMessage('Subscription will be cancelled at the end of the current billing period.', 'success');
                // Force page reload to show updated data
                setTimeout(() => {
                    router.reload({ only: ['activeSubscriptions'] });
                }, 1000);
            } else {
                showToastMessage(data.error || 'Failed to cancel subscription. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Cancellation error:', error);
            showToastMessage('Failed to cancel subscription. Please check your connection and try again.', 'error');
        } finally {
            setCancellingSubscriptions(prev => {
                const newSet = new Set(prev);
                newSet.delete(subscriptionId);
                return newSet;
            });
        }
    };
    
    const renderSubscriptionCard = (subscription) => {
        // Use the computed isActive status from backend or fallback to stripe_status check
        const isActive = subscription.is_active ?? (subscription.stripe_status === 'active');
        const canCancel = isActive && subscription.cancel_at_period_end === false && subscription.can_cancel;
        const isCancelling = cancellingSubscriptions.has(subscription.id);
        
        let statusBadge;
        if (subscription.cancel_at_period_end || subscription.is_canceling) {
            statusBadge = <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">Canceling</span>;
        } else if (isActive) {
            statusBadge = <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">Active</span>;
        } else {
            statusBadge = <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">Inactive</span>;
        }
        
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
        
        const nextPaymentDate = getFormattedDate(subscription.current_period_end || subscription.next_payment);
        
        return (
            <div key={subscription.id} className="bg-white rounded-[40px]   shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 mb-4 border-l-4 border-purple-400">
                <div className="lg:flex flex-col md:flex-row">
                    {/* Left side - Image */}
                    <div className="relative w-full h-[100px] lg:h-auto lg:min-w-[130px] lg:max-w-[130px] bg-purple-50 flex items-center justify-center p-4">
                        <span className='absolute top-4 left-4'>
                            <FiRefreshCw size={'30px'} className="mr-2 text-purple-500" />
                        </span>
                        {subscription.wish_item?.image_url ? (
                            <img src={subscription.wish_item.image_url} 
                                alt={subscription.wish_item.wishname} 
                                className="h-12 w-12 object-cover rounded-[40px] "
                            />
                        ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-purple-50 rounded-[40px] ">
                                <FiGift className="h-12 w-12 text-purple-500" />
                            </div>
                        )}
                    </div>
                    
                    {/* Right side - Details */}
                    <div className="w-full p-2">
                        <div className="lg:flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-gulfs uppercase text-gray-800">
                                    {subscription.wish_item?.wishname || subscription.item_name || 'Subscription'}
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
                                    /{subscription.recurring_type || 'month'}
                                </p>
                                {statusBadge}
                            </div>
                        </div>
                        
                        <div className="mt-1">
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
                            
                            {isActive && (
                                <div className="mb-3">
                                    <Link href={`/${subscription.creator?.username}`} 
                                        className="text-[15px] text-purple-600 hover:underline mr-4"
                                    >
                                        🎉 Access Exclusive Posts
                                    </Link>
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
                            
                            {canCancel && (
                                <button
                                    onClick={() => handleCancelSubscription(subscription.id)}
                                    disabled={isCancelling}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-[40px]  hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-pink-600 leading-tight">Purchases</h2>}
        >
            <Head title="Purchases" />
            
            <div className="md:py-12 max-w-[900px] m-auto">
                <div className="containerbox mx-auto ">
                    <div className="py-8">
                        {/* Subscriptions Section */}
                        {/* {activeSubscriptions && activeSubscriptions.length > 0 && (
                            <div className="mb-8">
                                <div className="md:flex justify-between items-center mb-6">
                                    <h1 className="text-2xl text-white  capitalize">Active Subscriptions</h1>
                                    <div className="mt-4 md:mt-0">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            <FiRefreshCw className="mr-1" /> Subscriptions
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {activeSubscriptions.map(subscription => renderSubscriptionCard(subscription))}
                                </div>
                            </div>
                        )} */}
                        
                        {/* Purchases Section */}
                        <div className="md:flex justify-between items-center mb-6">
                            <h1 className="text-2xl text-white  capitalize">All Purchases</h1>
                            <div className="mt-2 md:mt-0 flex space-x-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <FiArrowUp className="mr-1" /> Sent
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                    <FiArrowDown className="mr-1" /> Received
                                </span>
                            </div>
                        </div>
                        {allDeliverables.length > 0 ? (
                            <div className="space-y-2 md:space-y-4">
                                {allDeliverables.map(deliverable => renderDeliverableCard(deliverable))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Nocontent text="No purchases found." subheading={"Support your favorite creators by making a purchase. And don't forget to check back later for new content!"} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {showPopup && selectedDeliverable && (
                <Popup
                    show={showPopup}
                    onClose={closePopup}
                    title={`${selectedDeliverable.wishItem?.wishname || selectedDeliverable.item?.name || 'Gift Content'}`}
                    className="font-sans max-w-2xl"
                >
                    <div className="p-6">
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Gift Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">From:</p>
                                    <p className="font-medium">{selectedDeliverable.gifter?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Amount:</p>
                                    <p className="font-medium">{formatMultiPrice(selectedDeliverable.wish_item?.price || selectedDeliverable.transaction_amount, selectedDeliverable.wish_item?.currency || selectedDeliverable.payment_currency || auth.user.default_currency || global_currency)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Date:</p>
                                    <p className="font-medium" style={{ fontFamily: 'var(--para-font)', color: 'var(--pink)' }}>
                                        {new Date(selectedDeliverable.created_at).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })} {new Date(selectedDeliverable.created_at).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Status:</p>
                                    <p className="font-medium capitalize">{selectedDeliverable.status || 'Processing'}</p>
                                </div>
                            </div>
                        </div>
                        
                        {selectedDeliverable.message && (
                            <div className="mb-4 pb-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Message</h3>
                                <p className="text-gray-700 italic">"{selectedDeliverable.message}"</p>
                            </div>
                        )}
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Content</h3>
                        {selectedDeliverable.content ? (
                            <div className="prose max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: selectedDeliverable.content }} />
                            </div>
                        ) : (
                            <p className="text-gray-500">No content available for this gift.</p>
                        )}
                    </div>
                </Popup>
            )}
            
            {showToast && (
                <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
                    showToast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}>
                    <div className={`rounded-[40px]   p-4 shadow-lg ${
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
                                        className="inline-flex rounded-[40px]  p-1.5 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
