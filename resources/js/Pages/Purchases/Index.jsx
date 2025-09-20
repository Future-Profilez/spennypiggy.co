import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Popup from '@/Components/Popup';
import { FiPackage, FiGift, FiClock, FiCheck, FiX, FiArrowUp, FiArrowDown, FiEye } from 'react-icons/fi';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';

export default function Index({ auth, sentDeliverables, receivedDeliverables }) {
    console.log("Sent Deliverables:", sentDeliverables);
    console.log("Received Deliverables:", receivedDeliverables);

    const [selectedDeliverable, setSelectedDeliverable] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const { formatMultiPrice } = PriceFormat();
    const { global_currency } = usePage().props;
    
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
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    const renderDeliverableCard = (deliverable) => {
        const metadata = deliverable.metadata || {};
        const type = deliverable.type;
        const person = type === 'sent' ? deliverable.creator : deliverable.gifter;
        const statusClass = getStatusClass(deliverable.status);
        
        // Get item based on product_type
        let itemName = "Gift Item";
        let itemImage = null;
        
        if (deliverable.wish_item) {
            itemName = deliverable.wish_item.wishname;
            itemImage = deliverable.wish_item.image_url;
        } else if (metadata.item_name) {
            itemName = metadata.item_name;
        }
        
        // Border color based on type (sent vs received)
        const borderClass = type === 'sent' 
            ? 'border-l-4 border-blue-500' 
            : 'border-l-4 border-pink-500';
        
        return (
            <div key={deliverable.id} className={`bg-white rounded-3xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 mb-4 border-l-4 border-pink-400`}>
                <div className="lg:flex flex-col md:flex-row">
                    {/* Left side - Image */}
                    <div className="relative w-full h-[200px] lg:h-auto lg:max-w-[200px] bg-pink-50 flex items-center justify-center p-4">
                        <span className='absolute top-4 left-4'>
                            {type === 'sent' ? (
                                <FiArrowUp size={'30px'} className="mr-2 text-blue-500" />
                            ) : (
                                <FiArrowDown size={'30px'} className="mr-2 text-pink-500" />
                            )}
                        </span>
                        {itemImage ? (
                            <img  src={itemImage} 
                                alt={itemName} 
                                className="h-12 w-12 object-cover rounded-md"
                            />
                        ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-pink-50 rounded-md">
                                <FiPackage className="h-12 w-12 text-pink-500" />
                            </div>
                        )}
                    </div>
                    
                    {/* Right side - Details */}
                    <div className="w-full p-4">
                        <div className="t">
                                <div className='lg:flex items-center justify-between  mb-2'>
                                    <div>
                                        <h3 className="text-xl font-gulfs uppercase text-gray-800"> {itemName} </h3>

                                        <p className="text-normal mt-2 text-gray-600">
                                            {type === 'sent' ? `To: ${person?.name || 'Unknown'}` : `From: ${person?.name || 'Unknown'}`}
                                        </p>
                                        {deliverable.customer_email && (
                                            <p className="text-normal text-gray-500 break-long-words">
                                               {deliverable.customer_email}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <h2 className='text-lg font-bold  '>
                                        <div className='lg:flex lg:items-center justify-center gap-2 flex-wrap'>
                                            <p className='me-4 text-lg font-bold'>{formatMultiPrice(deliverable.transaction_amount, deliverable.payment_currency || auth.user.default_currency || global_currency)}</p>
                                            <span className={`capitalize px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(deliverable.status)}`}>
                                                Content {deliverable.status || 'Processing'}
                                            </span>
                                        </div>
                                        <div className="mt-4">
                                            <ul>
                                                <li className='flex items-center flex-wrap'>
                                                    <Popup space="2 md:p-4"  
                                                        classes="text-[15px] text-pink ms-2"
                                                        text={<>🎉 View Exclusive Content</>} >
                                                            <img src={deliverable.deliverable_url} alt={deliverable.wish_item?.wishname} className="w-full h-full max-h-[90vh] object-cover rounded-md" />
                                                    </Popup>
                                                </li>
                                                {deliverable?.wish_item?.subscription == 1 ?
                                                    <li className='flex items-center flex-wrap'>
                                                        <Link href={`/${deliverable?.creator?.username}`} 
                                                        className="ms-2 text-[15px] text-pink" >🎉 Get Subscribers Only Post Access</Link>
                                                    </li>
                                                : ''}
                                            </ul>
                                            <p></p>
                                        </div>

                                    </h2>
                                </div>

                                
                                    
                                <p className='mt-4'>         
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
                                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-700 italic">"{deliverable.message}"</p>
                                </div>
                            )}
                        </p>
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
            
            <div className="py-12">
                <div className="containerbox mx-auto ">
                    <div className="py-8">
                        <div className="md:flex justify-between items-center mb-6">
                            <h1 className="text-3xl text-white font-gulfs uppercase">All Purchases</h1>
                            <div className="mt-4 md:mt-0 flex space-x-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <FiArrowUp className="mr-1" /> Sent
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                    <FiArrowDown className="mr-1" /> Received
                                </span>
                            </div>
                        </div>
                        
                        {!allDeliverables.length > 0 ? (
                            <div className="space-y-4">
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
                                    <p className="font-medium">{formatMultiPrice(selectedDeliverable.transaction_amount, selectedDeliverable.payment_currency || auth.user.default_currency || global_currency)}</p>
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
        </AuthenticatedLayout>
    );
}