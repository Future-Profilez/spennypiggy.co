import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, Calendar, Mail, Tag } from 'lucide-react';

export default function Statement({ summary, dates, profile, user }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 text-[#0F172A] p-4 md:p-8 font-sans print:p-0 print:bg-white">
            <Head title={`Income Statement ${dates.label}`} />
            <style>{`
                @media print {
                    @page { margin: 0.5cm; size: portrait; }
                    html, body { 
                        width: 100%;
                        margin: 0 !important; 
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        background: white !important;
                    }
                    .print-container {
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        box-shadow: none !important;
                        background: white !important;
                        border: none !important;
                    }
                    .print\\:hidden { display: none !important; }
                    .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                }
            `}</style>
            
            {/* Action Bar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Link href={route('financial.dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-[#0F172A] text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800 transition shadow-lg text-sm"
                >
                    <Printer size={16} />
                    Print / Save PDF
                </button>
            </div>

            {/* Document Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8 md:p-12 print:shadow-none print:max-w-none print:w-full print:rounded-none print-container">
                
                {/* Header Section */}
                <table className="w-full mb-12 border-collapse">
                    <tbody>
                        <tr>
                            <td className="align-top">
                                <table className="mb-8 w-full">
                                    <tbody>
                                        <tr>
                                            <td className="w-20 pr-6 align-middle">
                                                <img src="/img/logo.png" alt="Spenny Piggy Logo" className="w-20 h-auto object-contain" />
                                            </td>
                                            <td className="align-middle">
                                                <h1 className="text-2xl font-extrabold text-[#0F172A] uppercase tracking-tight m-0">Income Statement</h1>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest m-0 mt-1">Official Financial Record</p>
                                            </td>
                                            <td className="align-middle text-right">
                                                <div className="inline-flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                                                        <Tag size={10} /> Tax Year
                                                    </div>
                                                    <p className="text-xl font-bold text-[#0F172A]">{dates.label}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="border-t border-slate-100 mb-10"></div>

                {/* Details Grid */}
                <table className="w-full mb-16 border-collapse">
                    <tbody>
                        <tr>
                            <td className="align-top w-1/2">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    Prepared For
                                </h3>
                                <div className="text-[#0F172A]">
                                    <p className="text-xl font-bold mb-2">{profile?.business_name || user.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Mail size={14} className="text-slate-300" />
                                        {user.email}
                                    </div>
                                </div>
                            </td>
                            <td className="align-top w-1/2 text-right">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-right">
                                    Statement Details
                                </h3>
                                <table className="ml-auto text-sm border-separate border-spacing-y-1.5">
                                    <tbody>
                                        <tr>
                                            <td className="text-slate-400 pr-8 text-right">Date Generated</td>
                                            <td className="font-bold text-[#0F172A] text-right">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-slate-400 pr-8 text-right">Period Start</td>
                                            <td className="font-bold text-[#0F172A] text-right">{new Date(dates.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-slate-400 pr-8 text-right">Period End</td>
                                            <td className="font-bold text-[#0F172A] text-right">{new Date(dates.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-slate-400 pr-8 text-right">Currency</td>
                                            <td className="text-right">
                                                <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-xs font-bold text-[#0F172A]">GBP (£)</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Revenue Section */}
                <div className="mb-16 break-inside-avoid">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-6">
                        Revenue Breakdown
                    </h3>
                    
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Description</th>
                                <th className="text-right py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <tr>
                                <td className="py-4 font-bold text-[#0F172A]">Gross Earnings (Sales, Tips, Subscriptions)</td>
                                <td className="py-4 text-right font-bold text-[#0F172A]">£{Number(summary.gross_income).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td className="py-4 pl-6 text-slate-400 italic">Less: Platform & Processing Fees</td>
                                <td className="py-4 text-right text-slate-400 italic">-£{Number(summary.fees).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {summary.vat_collected > 0 && (
                                <tr>
                                    <td className="py-4 pl-6 text-slate-400 italic">Less: VAT Collected (Liability)</td>
                                    <td className="py-4 text-right text-slate-400 italic">-£{Number(summary.vat_collected).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            <tr className="border-t-2 border-[#0F172A]">
                                <td className="py-5 font-bold text-[#0F172A] uppercase text-xs tracking-wider">Net Revenue</td>
                                <td className="py-5 text-right font-bold text-[#0F172A] text-lg">£{Number(summary.net_income).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Expenses Section */}
                <div className="mb-16 break-inside-avoid">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-6">
                        Operating Expenses
                    </h3>

                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Description</th>
                                <th className="text-right py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-4 text-slate-500">Total Logged Expenses</td>
                                <td className="py-4 text-right text-[#0F172A] font-medium">£{Number(summary.expenses).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="border-t-2 border-[#0F172A]">
                                <td className="py-5 font-bold text-[#0F172A] uppercase text-xs tracking-wider">Total Expenses</td>
                                <td className="py-5 text-right font-bold text-red-600 text-lg">£{Number(summary.expenses).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Net Profit Summary */}
                <div className="mb-16 break-inside-avoid">
                    <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-100">
                        <h3 className="text-lg font-bold text-[#0F172A] mb-1">Net Profit</h3>
                        <p className="text-slate-400 text-xs mb-6 font-medium">Taxable Income before personal allowance</p>
                        <p className="text-6xl font-bold text-[#0F172A] tracking-tighter">
                            £{Number(summary.profit).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="mt-20 text-center space-y-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Confidential Financial Document • Generated by Spenny Piggy Platform
                    </p>
                    <div className="max-w-xl mx-auto">
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                            This income statement is generated automatically based on the transactions and expenses recorded in your Spenny Piggy account. 
                            It is intended for informational purposes and to assist with self-assessment tax returns. 
                            Please consult a qualified accountant for professional advice.
                        </p>
                    </div>
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} Spenny Piggy Ltd. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}