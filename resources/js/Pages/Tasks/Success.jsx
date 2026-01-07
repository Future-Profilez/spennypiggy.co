import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import PriceFormat from "@/includes/PriceFormat";

export default function Success({ auth, purchase, task, currencySymbol }) {
    const { formatMultiPrice } = PriceFormat();

    if (!purchase) {
        return (
            <Guest auth={auth.user} user={auth.user}>
                <Head title="Payment Processing" />
                <div className="bg-white py-8 mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-[700px] mx-auto bg-white p-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 border-2 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)]">
                            <svg className="h-10 w-10 text-yellow-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        
                        <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase">Payment Processing...</h2>
                        <p className="text-gray-600 mb-8 font-medium">
                            We've received your payment for <strong className="text-pink-600">{task.title}</strong> and are creating your order. 
                            <br/>This usually takes a few seconds.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                             <Link 
                                href={window.location.href}
                                className="inline-flex justify-center items-center px-6 py-[13px] border-2 border-black text-sm font-black rounded-[20px] text-white bg-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                            >
                                Refresh Status
                            </Link>

                            <Link 
                                href={route('task.dashboard')}
                                className="inline-flex justify-center items-center px-6 py-[13px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-black rounded-[20px] text-gray-900 bg-white hover:bg-gray-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                Go to My Tasks
                            </Link>
                        </div>
                    </div>
                </div>
            </Guest>
        );
    }

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title="Payment Successful" />
            <div className="bg-white py-8  mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-[700px] mx-auto bg-white p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 border-2 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)]">
                        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase">Payment Successful!</h2>
                    <p className="text-gray-600 mb-8 font-medium">
                        Thank you for your purchase. Your order for <strong className="text-pink-600">{task.title}</strong> has been confirmed.
                    </p>

                    <div className="bg-gray-50 border-2 border-black rounded-[22px]  mb-8 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)]">
                        <h3 className="p-6 text-normal font-bold !pb-4 font-black text-black uppercase tracking-wider border-b-2 border-gray-200 pb-2">Order Details</h3>
                        <div className="space-y-4 p-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-bold uppercase text-sm">Task</span>
                                <span className="font-bold text-gray-900">{task.title}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-bold uppercase text-sm">Order ID</span>
                                <span className="font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-300">#{purchase.uuid.substring(0, 8)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-bold uppercase text-sm">Amount</span>
                                <span className="font-black text-xl text-green-600">{formatMultiPrice(purchase.amount, task.currency || 'USD')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-bold uppercase text-sm">Creator</span>
                                <span className="font-black capitalize text-xl text-green-600"> <Link href={route('user.show', { username: task.creator.username })} className="text-sm font-bold text-blue-600 hover:underline">
                                    {task.creator.name}'s Profile
                                </Link></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-bold uppercase text-sm">Status</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-800 uppercase border border-black shadow-sm">
                                    {purchase.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* <div className="bg-gray-50 border-2 border-black rounded-[22px]  mb-8 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)]">
                        <h3 className="p-6 text-normal font-bold !pb-4 font-black text-black uppercase tracking-wider border-b-2 border-gray-200 pb-2">Creator</h3>
                        <div className="p-6 flex items-center gap-4">
                            <img src={task.creator.avatar_url || task.creator.avatar} alt={task.creator.name} className="w-16 h-16 rounded-full border-2 border-black shadow-sm object-cover" />
                            <div>
                                <h4 className="font-bold text-lg text-gray-900">{task.creator.name}</h4>
                                <Link href={route('user.show', { username: task.creator.username })} className="text-sm font-bold text-blue-600 hover:underline">
                                    View Profile
                                </Link>
                            </div>
                        </div>
                    </div> */}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            href={route('task.order', purchase.uuid)}
                            className="inline-flex justify-center items-center px-6 py-[13px] border-2 border-black text-sm font-black rounded-[20px] text-white bg-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all uppercase" > View Order Details
                        </Link>
                        
                        <Link 
                            href={route('task.dashboard')}
                            className="inline-flex justify-center items-center px-6 py-[13px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-black rounded-[20px] text-gray-900 bg-white hover:bg-gray-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            Go to My Tasks
                        </Link>
                    </div>
                </div>
            </div>
        </Guest>
    );
}
