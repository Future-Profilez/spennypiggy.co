import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, ShieldCheck, QrCode } from 'lucide-react';

export default function Certificate({ profile, user, metrics }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 p-4 md:p-8 font-serif print:p-0 print:bg-white flex flex-col items-center justify-center">
            <Head title="Verified Proof of Income" />
            <style>{`
                @media print {
                    @page { margin: 0; size: landscape; }
                    html, body { 
                        width: 100%;
                        height: 100%;
                        margin: 0 !important; 
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        background: white !important;
                    }
                    .print\\:hidden { display: none !important; }
                    /* Make certificate responsive to print page */
                    .print-content { 
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: white !important;
                        display: block !important;
                    }
                    /* Adjust padding for print to avoid clipping */
                    .print-content > .relative.z-10 {
                        padding: 40px !important;
                    }
                    /* Hide gray background elements in print */
                    .print\\:bg-transparent { background-color: transparent !important; }
                    .print\\:text-slate-900 { color: #0f172a !important; }
                    .print\\:border-slate-900 { border-color: #0f172a !important; }
                }
            `}</style>
            
            {/* Action Bar (Hidden in Print) */}
            <div className="w-full max-w-4xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <Link href={route('financial.dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-sans font-medium text-sm">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-[#05EFB8] text-slate-900 px-6 py-2.5 rounded-full font-sans font-bold hover:bg-[#04d6a5] transition shadow-lg shadow-[#05EFB8]/20 text-sm"
                >
                    <Printer size={18} /> Print Certificate
                </button>
            </div>

            {/* Certificate Container */}
            <div className="bg-[#fffdf5] w-full max-w-4xl aspect-[1.414/1] shadow-2xl shadow-slate-900/20 relative print:shadow-none print:w-full print:h-screen print:m-0 print:border-none overflow-hidden text-slate-900 print-content border-8 border-double border-slate-900 print:border-none">
                
                {/* Decorative Corners */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-slate-900 print:hidden"></div>
                <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-slate-900 print:hidden"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-slate-900 print:hidden"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-slate-900 print:hidden"></div>

                {/* Background Pattern - Subtle Guilloche Effect */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
                     <div className="w-[120%] h-[120%] border-[60px] border-slate-900 rounded-full opacity-10"></div>
                     <div className="absolute w-[90%] h-[90%] border-[30px] border-slate-900 rounded-full opacity-10"></div>
                     <div className="absolute w-[60%] h-[60%] border-[15px] border-slate-900 rounded-full opacity-10"></div>
                </div>

                {/* Content - Table Based Layout */}
                <div className="relative z-10 h-full p-12 md:p-16">
                    <table className="w-full h-full border-collapse">
                        <tbody>
                            {/* Header Row */}
                            <tr className="h-1/4">
                                <td className="align-top text-center">
                                    <table className="mx-auto mb-4 opacity-90" style={{ margin: '0 auto' }}>
                                        <tbody>
                                            <tr>
                                                <td className="pr-3 align-middle">
                                                    <img src="/img/logo.png" alt="Spenny Piggy Logo" className="w-8 h-auto object-contain" />
                                                </td>
                                                <td className="align-middle">
                                                    <span className="font-sans font-bold tracking-[0.2em] uppercase text-xs text-slate-700">Spenny Piggy Financial</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    
                                    <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest mb-2 text-slate-900 font-serif text-center">Certificate of Income</h1>
                                    
                                    <table className="mx-auto mb-1" style={{ margin: '0 auto' }}>
                                        <tbody>
                                            <tr>
                                                <td className="align-middle"><div className="h-px bg-slate-300 w-12"></div></td>
                                                <td className="px-4 align-middle">
                                                    <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] font-sans font-bold text-center">Official Verified Statement</p>
                                                </td>
                                                <td className="align-middle"><div className="h-px bg-slate-300 w-12"></div></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            {/* Body Row */}
                            <tr className="h-2/4">
                                <td className="align-middle text-center">
                                    <div className="flex flex-col justify-center items-center space-y-4">
                                        <p className="text-lg text-slate-500 italic font-serif text-center">This document formally certifies that</p>
                                        
                                        <div className="py-2 px-4 text-center w-full">
                                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 font-serif inline-block border-b-2 border-slate-900 pb-2 max-w-full break-words text-center">
                                                {profile?.business_name || user.name}
                                            </h2>
                                        </div>
                                        
                                        <p className="text-base text-slate-600 font-serif max-w-2xl mx-auto leading-relaxed px-8 text-center">
                                            has been an active creator on the <strong className="text-slate-900">Spenny Piggy</strong> platform since <strong className="text-slate-900">{metrics.member_since}</strong> and has generated verified income through digital content sales, subscriptions, and supporter contributions.
                                        </p>

                                        {/* Metrics Box - Compact Table */}
                                        <div className="max-w-xl mx-auto mt-6 w-full flex justify-center">
                                            <table className="w-full bg-slate-100 border border-slate-200 border-collapse">
                                                <tbody>
                                                    <tr>
                                                        <td className="w-1/2 bg-white/50 p-4 text-center border-r border-slate-200">
                                                            <p className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1">Average Monthly</p>
                                                            <p className="text-2xl font-bold text-slate-900 font-mono">£{Number(metrics.average_monthly).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </td>
                                                        <td className="w-1/2 bg-white/50 p-4 text-center">
                                                            <p className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1">Total Lifetime</p>
                                                            <p className="text-2xl font-bold text-slate-900 font-mono">£{Number(metrics.total_earnings).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            {/* Footer Row */}
                            <tr className="h-1/4">
                                <td className="align-bottom">
                                    <div className="border-t border-slate-200/50 pt-4">
                                        <table className="w-full">
                                            <tbody>
                                                <tr>
                                                    <td className="w-1/3 align-bottom text-center">
                                                        <div className="mb-2 h-12 flex items-end justify-center">
                                                            <span className="font-serif text-2xl italic text-slate-600 transform -rotate-3 font-bold opacity-80 inline-block">Spenny Piggy Team</span>
                                                        </div>
                                                        <div className="w-40 h-px bg-slate-900 mb-1 mx-auto"></div>
                                                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest text-center">Authorized Signature</p>
                                                    </td>
                                                    
                                                    <td className="w-1/3 align-bottom text-center relative">
                                                        {/* Gold Seal - Centered */}
                                                        <div className="flex justify-center -mt-6">
                                                            <div className="w-24 h-24 bg-transparent rounded-full flex items-center justify-center shadow-none text-slate-900 font-bold text-[9px] text-center p-2 border-4 border-slate-900 border-double">
                                                                <div className="border border-slate-900 rounded-full w-full h-full flex items-center justify-center flex-col">
                                                                    <ShieldCheck size={20} className="mb-1" />
                                                                    <span className="tracking-widest block">OFFICIAL</span>
                                                                    <span className="text-[10px] tracking-widest block">VERIFIED</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="w-1/3 align-bottom text-right">
                                                         <div className="mb-2 flex justify-end">
                                                            <div className="bg-white p-2 border border-slate-200 inline-block">
                                                                <QrCode size={48} className="text-slate-900" />
                                                            </div>
                                                         </div>
                                                         <div className="space-y-0.5 text-right">
                                                             <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Verification ID</p>
                                                             <p className="text-xs font-mono font-bold text-slate-900">{metrics.verification_id}</p>
                                                             <p className="text-[9px] text-slate-400">{metrics.generated_at}</p>
                                                         </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <p className="mt-8 text-slate-400 text-xs font-sans print:hidden">
                &copy; {new Date().getFullYear()} Spenny Piggy Ltd. All rights reserved.
            </p>
        </div>
    );
}