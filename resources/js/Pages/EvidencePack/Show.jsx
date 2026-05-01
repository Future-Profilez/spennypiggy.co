import React from 'react';
import { Head } from '@inertiajs/react';
import { Download, ShieldCheck, Printer } from 'lucide-react';

export default function Show({ evidence }) {
    const handlePrint = () => {
        window.print();
    };

    if (!evidence) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white border-[3px] border-black rounded-[30px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-2xl font-black uppercase text-red-500 mb-2">Error</h1>
                    <p className="font-bold text-gray-600 uppercase tracking-widest">Evidence pack data is missing or unavailable.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
            <Head title={`Evidence Pack - ${evidence?.transaction_id || 'N/A'}`} />

            <div className="max-w-3xl mx-auto">
                {/* Action Buttons - Hidden in Print */}
                <div className="flex justify-end mb-6 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs transition-all"
                    >
                        <Printer size={18} className="stroke-[2.5px]" />
                        Print / Save PDF
                    </button>
                </div>

                {/* Main Evidence Document */}
                <div className="bg-white border-[3px] border-black rounded-[32px] overflow-hidden print:border-none print:shadow-none print:rounded-none">
                    
                    {/* Header Banner */}
                    <div className="bg-black text-white p-8 sm:p-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center border-[2px] border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]">
                                <ShieldCheck size={36} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">
                                    Evidence Pack
                                </h1>
                                <p className="text-pink-400 font-black uppercase tracking-[0.15em] text-[10px] mt-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></span>
                                    Official Transaction Record
                                </p>
                            </div>
                        </div>
                        <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-6 w-full md:w-auto">
                            <div className="text-2xl font-black uppercase tracking-tighter">{evidence.platform_name || 'SPENNYPIGGY'}</div>
                            <div className="text-gray-400 font-bold text-xs mt-0.5">{evidence.platform_url || 'spennypiggy.co'}</div>
                            <div className="inline-block mt-3 px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">
                                Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 sm:p-12 space-y-10">
                        {/* Transaction Overview Card */}
                        <div className="relative">
                            <div className="absolute -inset-1.5 bg-yellow-100 rounded-[28px] -z-10 opacity-40"></div>
                            <div className="bg-white border-[2px] border-black rounded-[24px] p-6 sm:p-8">
                                <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2.5">
                                    <span className="w-6 h-1 bg-black rounded-full"></span>
                                    Transaction Overview
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="sm:col-span-2 lg:col-span-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] block mb-1.5">Transaction ID</label>
                                        <p className="font-bold text-sm break-all leading-relaxed">{evidence.transaction_id}</p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] block mb-1.5">Date & Time</label>
                                        <p className="font-bold text-sm leading-relaxed">{evidence.date}</p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] block mb-1.5">Status</label>
                                        <span className="inline-block px-3 py-1 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {evidence.status}
                                        </span>
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] block mb-1.5">Gross Amount</label>
                                        <p className="font-black text-3xl text-[#00A84E] tracking-tighter">
                                            {evidence.amount} <span className="text-sm text-gray-400">{evidence.currency}</span>
                                        </p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] block mb-1.5">Description</label>
                                        <p className="font-bold text-base text-gray-800 leading-snug">{evidence.description}</p>
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-50 border-[1.5px] border-black rounded text-[9px] font-black uppercase tracking-widest text-gray-500">
                                            {evidence.service_type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Processor Details */}
                        <div className="border-l-[4px] border-pink-500 pl-6 py-1">
                            <h2 className="text-xl font-black uppercase tracking-tight mb-5">Processor References</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] block mb-1.5">Stripe Session ID</label>
                                    <p className="font-mono text-[11px] font-bold bg-gray-50 p-2.5 rounded-lg border border-gray-100 break-all">
                                        {evidence.stripe_session_id || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] block mb-1.5">Payment Intent ID</label>
                                    <p className="font-mono text-[11px] font-bold bg-gray-50 p-2.5 rounded-lg border border-gray-100 break-all">
                                        {evidence.stripe_payment_intent_id || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Parties Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Creator Side */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border-[1.5px] border-black">
                                        <span className="text-xl font-black">S</span>
                                    </div>
                                    <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">Creator</h2>
                                </div>
                                {evidence.creator ? (
                                    <div className="space-y-3 bg-blue-50/20 p-5 rounded-[30px] border border-blue-100">
                                        <div>
                                            <label className="text-[8px] font-black uppercase text-blue-400 tracking-[0.15em] block mb-0.5">Full Name</label>
                                            <p className="font-black text-base text-black">{evidence.creator.name}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[8px] font-black uppercase text-blue-400 tracking-[0.15em] block mb-0.5">Handle</label>
                                                <p className="font-bold text-xs text-gray-600">@{evidence.creator.username}</p>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black uppercase text-blue-400 tracking-[0.15em] block mb-0.5">Email</label>
                                                <p className="font-bold text-xs text-gray-800 truncate">{evidence.creator.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center p-6 bg-gray-50 rounded-[30px] border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold italic text-xs">Creator data unavailable</p>
                                    </div>
                                )}
                            </div>

                            {/* Supporter Side */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center border-[1.5px] border-black">
                                        <span className="text-xl font-black">B</span>
                                    </div>
                                    <h2 className="text-lg font-black uppercase tracking-tight text-pink-600">Supporter</h2>
                                </div>
                                {evidence.supporter ? (
                                    <div className="space-y-3 bg-pink-50/20 p-5 rounded-[30px] border border-pink-100">
                                        <div>
                                            <label className="text-[8px] font-black uppercase text-pink-400 tracking-[0.15em] block mb-0.5">Full Name</label>
                                            <p className="font-black text-base text-black">{evidence.supporter.name}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[8px] font-black uppercase text-pink-400 tracking-[0.15em] block mb-0.5">Handle</label>
                                                <p className="font-bold text-xs text-gray-600">@{evidence.supporter.username}</p>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black uppercase text-pink-400 tracking-[0.15em] block mb-0.5">Network IP</label>
                                                <p className="font-mono text-[10px] font-bold text-gray-800">{evidence.supporter.ip_address}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black uppercase text-pink-400 tracking-[0.15em] block mb-0.5">Email</label>
                                            <p className="font-bold text-xs text-gray-800 truncate">{evidence.supporter.email}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center p-6 bg-gray-50 rounded-[30px] border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold italic text-xs">Guest or System Generated</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Certification */}
                        <div className="mt-16 pt-10 text-center">
                            <div className="inline-block px-6 py-3 bg-gray-50 rounded-[30px] border border-gray-100">
                                <p className="text-xs font-black text-gray-800 mb-1.5 uppercase">
                                    CERTIFIED RECORD BY {evidence.platform_name ? evidence.platform_name.toUpperCase() : 'SPENNYPIGGY'}
                                </p>
                                <p className="text-[9px] font-bold text-gray-400 leading-relaxed max-w-md mx-auto uppercase tracking-wide">
                                    This document certifies the transaction detailed above occurred on our platform. 
                                    All data presented is pulled directly from our encrypted transaction logs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
