import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';

export default function Show({ auth, task, purchase, isCreator, deliverableUrl }) {
    const { post, processing } = useForm();

    const handlePurchase = () => {
        post(route('task.purchase', task.uuid));
    };

    return (
        <Guest auth={auth?.user} user={auth?.user}>
            <Head title={task.title} />
            <div className="loginPage blackbg px-3 py-5 min-h-screen">
                <div className="max-w-3xl mx-auto">
                    {/* Back Button */}
                    <Link href={route('task.dashboard')} className="inline-block mb-6 text-white font-bold uppercase tracking-widest hover:text-pink-500 transition-colors">
                        &larr; Back to Dashboard
                    </Link>

                    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
                        {/* Retro Header */}
                        <div className='p-4 bg-pink-100 flex border-b-2 border-black items-center justify-between'>
                            <div className="flex items-center gap-2">
                                <span className='border-2 border-black bg-red-500 w-4 h-4 rounded-full block'></span>
                                <span className='border-2 border-black bg-yellow-400 w-4 h-4 rounded-full block'></span>
                                <span className='border-2 border-black bg-green-400 w-4 h-4 rounded-full block'></span>
                            </div>
                            <h3 className="font-bold text-lg uppercase tracking-tight">Task Details</h3>
                            <div></div>
                        </div>

                        {/* Media Cover */}
                        {task.media_url && (
                            <div className="border-b-2 border-black">
                                <img src={task.media_url} alt={task.title} className="w-full h-80 object-cover" />
                            </div>
                        )}

                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div className="uppercase tracking-wide text-sm font-bold text-pink-500 bg-pink-100 px-3 py-1 rounded-full border border-pink-200 inline-block">
                                    {task.category || 'Paid Task'}
                                </div>
                                <span className="text-3xl font-black text-black font-anton tracking-wider">
                                    ${task.price}
                                </span>
                            </div>

                            <h1 className="mt-2 text-4xl font-black text-gray-900 font-anton leading-tight uppercase tracking-wide text-shadow-black text-pink-500 stroke-black">
                                {task.title}
                            </h1>
                            
                            <div className="mt-6 prose prose-lg text-gray-600 leading-relaxed border-l-4 border-pink-300 pl-4">
                                {task.description}
                            </div>
                            
                            <div className="mt-8 flex items-center gap-4">
                                <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-800 uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                    {task.type} Delivery
                                </span>
                                {task.type === 'timed' && (
                                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-yellow-100 text-yellow-800 uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                        ⏱ {task.sla_hours} Hour SLA
                                    </span>
                                )}
                            </div>

                            {/* Action Area */}
                            <div className="mt-10 border-t-2 border-dashed border-gray-300 pt-8">
                                {isCreator ? (
                                    <div className="text-center bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                                        <p className="mb-4 text-gray-600 font-medium">You are the creator of this task.</p>
                                        <a href={route('task.dashboard')} className="btn-pink shadow-mint inline-block px-8 py-3 text-white font-bold rounded-lg border-2 border-black uppercase">
                                            Manage Orders
                                        </a>
                                    </div>
                                ) : (
                                    <div>
                                        {purchase ? (
                                            <div className="text-center">
                                                <div className="bg-green-100 text-green-800 px-6 py-4 rounded-xl border-2 border-green-300 mb-6 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
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
                                                                className="block w-full text-center bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 font-black uppercase tracking-widest text-lg border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Download Content 📥
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <a 
                                                        href={route('task.order', purchase.uuid)} 
                                                        className="block w-full text-center bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 font-black uppercase tracking-widest text-lg border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                                                    >
                                                        View Order Status & Proof
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handlePurchase}
                                                disabled={processing}
                                                className="w-full btn-pink shadow-mint text-white px-6 py-5 rounded-xl font-black uppercase tracking-widest text-xl border-2 border-black hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? 'Processing...' : (task.type === 'instant' ? 'Pay to Unlock 🔓' : 'Pay to Assign 📝')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {!auth?.user && !purchase && (
                            <div className="bg-gray-50 p-4 text-center border-t-2 border-black">
                                <p className="text-sm text-gray-600 font-bold">
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
