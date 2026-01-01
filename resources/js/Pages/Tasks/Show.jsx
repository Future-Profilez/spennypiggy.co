import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import PriceFormat from "@/includes/PriceFormat";

export default function Show({ auth, task, purchase, isCreator, deliverableUrl, currencySymbol }) {
    const { post, processing } = useForm();
    const { formatMultiPrice } = PriceFormat();

    const handlePurchase = () => {
        post(route('task.purchase', task.uuid));
    };

    return (
        <Guest auth={auth?.user} user={auth?.user}>
            <Head title={task.title} />
            <div className="bg-white px-3 py-3 min-h-screen">
                <div className="max-w-3xl mx-auto">
                    {/* Back Button */}
                    <Link href={route('task.dashboard')} className="inline-block mb-6 text-white font-bold uppercase tracking-widest hover:text-pink-500 transition-colors">
                        &larr; Back to Dashboard
                    </Link>

                    <div className="bg-white border-2 !border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[22px] overflow-hidden">
                        {/* Retro Header */}
                        <div className='p-3 bg-pink-100 flex !border-b-2 !border-black items-center justify-between'>
                            <h3 className="font-bold text-xl uppercase font-anton  tracking-wide">Task Details</h3>
                            <div className="flex items-center gap-2">
                                <span className='border-2 border-black bg-red-500 w-4 h-4 rounded-full block'></span>
                                <span className='border-2 border-black bg-yellow-400 w-4 h-4 rounded-full block'></span>
                                <span className='border-2 border-black bg-green-400 w-4 h-4 rounded-full block'></span>
                            </div>
                        </div>

                        {/* Media Cover */}
                        {/* {task.media_url && (
                            <div className="border-b-2 border-black">
                                <img src={task.media_url} alt={task.title} className="w-full h-80 object-cover" />
                            </div>
                        )} */}

                        <div className="p-8">
                            <div className='flex justify-between items-start'>
                                <div>
                                    <h1 className="text-3xl font-black font-fre uppercase font-light  text-gray-900  ">
                                        {task.title}
                                    </h1>
                                    <div className="mt-2 mb-4 prose prose-lg text-gray-600 leading-relaxed border-l-4 border-pink-300 pl-4">
                                        {task.description}
                                    </div>
                                </div>

                                <span className="text-3xl font-black text-pink font-anton tracking-wider">
                                    {formatMultiPrice(task.price, task.currency || 'USD')}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4 mb-4">
                                <span className={`uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    task.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }`}>{task.status}
                                </span>
                                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-blue-100 text-blue-800 !border-blue-200">
                                    {task.type} Delivery
                                </span>
                                {task?.sla_hours ? <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-yellow-100 text-yellow-800 !border-yellow-200">
                                    {task.sla_hours} Hours
                                </span>: ''}
                                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-pink-100 text-pink-800 !border-pink-200">
                                    {task.category || 'Paid Task'}
                                </span>
                            </div>

                            {/* Creator Info */}
                            <div className=" items-center gap-4 ">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Created By</p>
                                <div className='flex'>
                                    <Link href={route('user.show', task.creator.username)} className="flex items-center gap-4 group">
                                        <img 
                                            src={task.creator.avatar_url} 
                                            alt={task.creator.name} 
                                            className="w-14 h-14 rounded-full border-2 border-black object-cover"
                                        />
                                        <div>
                                            <h4 className="text-lg font-black font-anton tracking-wide leading-none group-hover:text-pink-500 transition-colors">
                                                {task.creator.name}
                                            </h4>
                                            <p className="text-sm text-gray-600 font-medium">@{task.creator.username}</p>
                                            <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-wider">
                                                On {new Date(task.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            
                            {/* Action Area */}
                            <div className="mt-4 border-t-2 border-dashed border-gray-300 pt-4">
                                {isCreator ? (
                                    <div className="text-center  rounded-xl py-6">
                                        <p className="mb-4 text-gray-600 font-medium">You are the creator of this task.</p>
                                        <a href={route('task.dashboard')} className="button b">
                                            Manage Orders
                                        </a>
                                    </div>
                                ) : (
                                    <div>
                                        {purchase ? (
                                            <div className="text-center">
                                                <div className="bg-green-100 text-green-800 px-4 py-3 rounded-[20px] border-2 border-green-300 mb-6 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0)]">
                                                    ✓ Purchased Successfully
                                                </div>
                                                
                                                {task.type === 'instant' ? (
                                                    <div className="space-y-4">
                                                        {task.deliverable_note && (
                                                            <div className="bg-white border-2 border-black rounded-xl p-6 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                                <h4 className="font-black text-gray-900 mb-3 uppercase tracking-wide">Note from Creator:</h4>
                                                                <p className="whitespace-pre-wrap text-gray-700 font-medium">{task.deliverable_note}</p>
                                                            </div>
                                                        )}
                                                        {deliverableUrl && (
                                                            <a 
                                                                href={deliverableUrl} 
                                                                className="block w-full text-center bg-gray-300 text-black px-4 py-3 rounded-[20px] hover:bg-gray-100 cursor-pointer font-black uppercase tracking-widest text-sm border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Download Content 📥
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <a 
                                                        href={route('task.order', purchase && purchase.uuid || task.uuid)} 
                                                        className="block w-full text-center bg-green-600 text-white px-4 py-3 rounded-[20px] hover:bg-green-700 font-black uppercase tracking-widest text-[14px] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all" >
                                                        View Order Status & Proof
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handlePurchase}
                                                disabled={processing}
                                                className="button b pinkbg !py-[16px] !text-white w-full"
                                            >
                                                {processing ? 'Processing...' : (task.type === 'instant' ? 'Pay to Unlock 🔓' : 'Pay to Assign 📝')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {!auth?.user && !purchase && (
                            <div className="bg-gray-50 p-4 text-center !border-t-2 !border-black">
                                <p className="text-normal text-gray-600 font-bold">
                                    Please <a href={route('login')} className="text-pink-600 hover:underline">login</a> to purchase.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Guest>
    );
}
