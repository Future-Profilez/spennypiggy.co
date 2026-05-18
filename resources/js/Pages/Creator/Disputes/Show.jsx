import React, { useState, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import GlobalUploader from "@/uploadcare/Uploader";
import { BiArrowBack, BiUpload, BiCheckCircle, BiFile, BiError, BiX, BiUser, BiCartAlt } from 'react-icons/bi';

export default function DisputeShow({ auth, dispute }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        explanation: '',
        files: [], // This will now store the Uploadcare file objects/metadata
    });

    const uploaderRef = useRef();

    const getUploadedFile = (fileData) => {
        // fileData is the metadata object constructed in GlobalUploader's checkAdult
        setData('files', [...data.files, fileData]);
    };

    const removeFile = (index) => {
        const newFiles = [...data.files];
        newFiles.splice(index, 1);
        setData('files', newFiles);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Since we are now sending Uploadcare metadata, the backend needs to handle these objects
        // The original backend expected actual files, but typically with Uploadcare we send the UUIDs or URLs
        post(route('creator.disputes.submit', dispute.id));
    };

    const isSubmitted = dispute.evidence_status === 'submitted' || dispute.has_response;
    const isClosed = dispute.status === 'won' || dispute.status === 'lost';
    const canSubmit = !isSubmitted && !isClosed;

    return (
        <AuthenticatedLayout
            auth={auth}
            user={auth.user}
        >
            <Head title={`Dispute #${dispute.stripe_dispute_id}`} />

            <div className="py-12 bg-black min-h-screen">
                <div className="containerbox max-w-6xl">
                    
                    <div className="flex items-center gap-4 mb-8">
                        <Link href={route('creator.disputes.index')} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-gray-800 flex items-center justify-center !text-gray-100 hover:text-white transition-colors">
                            <BiArrowBack size={20} />
                        </Link>
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase font-gulfs tracking-wide">Dispute Details</h2>
                            <p className="text-gray-500 text-sm">ID: {dispute.stripe_dispute_id}</p>
                        </div>
                    </div>
                    
                    {/* Status Banner */}
                    <div className={`mb-8 p-6 rounded-[30px] border ${
                        isClosed ? (dispute.status === 'won' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-gray-500/10 border-gray-500/20 !text-gray-100') :
                        isSubmitted ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        'bg-red-500/10 border-red-500/20 text-[#FF007F]'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-current/10">
                                {isClosed ? (dispute.status === 'won' ? <BiCheckCircle size={24} /> : <BiFile size={24} />) :
                                 isSubmitted ? <BiCheckCircle size={24} /> : <BiError size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg uppercase font-gulfs tracking-wider">
                                    {isClosed ? `Dispute Closed: ${dispute.status.replace('_', ' ')}` :
                                     isSubmitted ? 'Evidence Submitted - Under Review' :
                                     'Action Required: Submit Evidence'}
                                </h3>
                                {!isClosed && !isSubmitted && (
                                    <p className="mt-1 text-sm opacity-80">
                                        Please submit your evidence by <strong>{new Date(dispute.evidence_due_by).toLocaleDateString()}</strong> to prevent losing this dispute.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar: Supporter & Payment Info */}
                        <div className="space-y-6">
                            {/* Supporter Info */}
                            <div className="bg-[#1a1a1a] p-6 rounded-[30px] border border-gray-800">
                                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-6 flex items-center gap-2">
                                    <BiUser className="text-[#FF007F]" /> Supporter Info
                                </h4>
                                {dispute.payment?.supporter ? (
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden">
                                            {dispute.payment.supporter.avatar ? (
                                                <img src={dispute.payment.supporter.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-600">
                                                    {dispute.payment.supporter.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{dispute.payment.supporter.name}</div>
                                            <div className="text-[#FF007F] text-xs">@{dispute.payment.supporter.username}</div>
                                            <div className="text-gray-500 text-[10px] mt-1">{dispute.payment.supporter.email}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic text-sm mb-6">Guest / Unknown Supporter</div>
                                )}
                                
                                <div className="pt-6 border-t border-gray-800">
                                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                                        <BiCartAlt className="text-[#FF007F]" /> Transaction Info
                                    </h4>
                                    <dl className="space-y-4">
                                        <div>
                                            <dt className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Amount Disputed</dt>
                                            <dd className="text-2xl font-bold text-white mt-1">
                                                {(dispute.amount / 100).toLocaleString('en-GB', { style: 'currency', currency: dispute.currency.toUpperCase() })}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Reason</dt>
                                            <dd className="text-sm font-medium text-gray-300 capitalize mt-1">
                                                {dispute.reason ? dispute.reason.replace(/_/g, ' ') : 'General'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Date</dt>
                                            <dd className="text-sm text-gray-300 mt-1">
                                                {new Date(dispute.created_at).toLocaleDateString()}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Important Notice */}
                            <div className="bg-[#FF007F]/5 p-6 rounded-[30px] border border-[#FF007F]/20">
                                <h4 className="text-[10px] uppercase tracking-widest text-[#FF007F] font-bold mb-3">Important</h4>
                                <p className="text-xs !text-gray-100 leading-relaxed">
                                    Providing evidence doesn't guarantee a win, but it significantly increases your chances. Banks look for proof that the service was delivered as described.
                                </p>
                            </div>
                        </div>

                        {/* Main Content: Evidence Submission */}
                        <div className="lg:col-span-2">
                            <div className="bg-[#1a1a1a] p-8 rounded-[30px] border border-gray-800 h-full">
                                {canSubmit ? (
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-2 uppercase font-gulfs tracking-widest">Submit Your Evidence</h4>
                                            <p className="text-gray-500 text-sm mb-6">Tell the bank why this dispute is incorrect. Be clear and professional.</p>
                                            
                                            <div className="space-y-2">
                                                <InputLabel htmlFor="explanation" value="Explanation / Message to Bank" className="!text-gray-100 text-xs uppercase tracking-widest" />
                                                <textarea
                                                    id="explanation"
                                                    className="w-full bg-black border border-gray-800 rounded-[30px] text-white p-4 focus:border-[#FF007F] focus:ring-0 transition-all min-h-[150px] text-sm"
                                                    placeholder="Describe what the supporter purchased and any interaction you had with them..."
                                                    value={data.explanation}
                                                    onChange={(e) => setData('explanation', e.target.value)}
                                                />
                                                <InputError message={errors.explanation} className="mt-2" />
                                            </div>
                                        </div>

                                        <div>
                                            <InputLabel value="Supporting Documents (Images or PDF)" className="!text-gray-100 text-xs uppercase tracking-widest mb-3" />
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <GlobalUploader 
                                                        ctxName='dispute-evidence-context' 
                                                        ref={uploaderRef} 
                                                        view={false} 
                                                        type="minimal" 
                                                        imgonly={false}
                                                        accept="image/*,application/pdf"
                                                        sendFile={getUploadedFile} 
                                                    />
                                                </div>

                                                {data.files.length > 0 && (
                                                    <div className="space-y-2">
                                                        {data.files.map((file, idx) => (
                                                            <div key={idx} className="bg-black border border-gray-800 rounded-xl p-3 flex items-center justify-between group">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="p-2 bg-gray-900 rounded-lg">
                                                                        {file.isImage ? (
                                                                            <img src={file.url} className="w-6 h-6 object-cover rounded" alt="" />
                                                                        ) : (
                                                                            <BiFile className="text-[#FF007F] w-6 h-6" />
                                                                        )}
                                                                    </div>
                                                                    <div className="overflow-hidden">
                                                                        <div className="text-xs text-white font-bold truncate">{file.name}</div>
                                                                        <div className="text-[10px] text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => removeFile(idx)}
                                                                    className="p-1 hover:text-red-500 transition-colors text-gray-500"
                                                                >
                                                                    <BiX size={18} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <InputError message={errors.files} className="mt-2" />
                                        </div>

                                        <div className="pt-6 border-t border-gray-800 flex justify-end">
                                            <PrimaryButton 
                                                className="bg-[#FF007F] hover:bg-[#d83a7c] px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest"
                                                disabled={processing}
                                            >
                                                {processing ? 'Submitting...' : 'Submit to Stripe'}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isSubmitted ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                                            {isSubmitted ? <BiCheckCircle size={40} /> : <BiFile size={40} />}
                                        </div>
                                        <h4 className="text-2xl font-bold text-white mb-3 uppercase font-gulfs tracking-wider">
                                            {isSubmitted ? 'Evidence Submitted' : 'Dispute Finalized'}
                                        </h4>
                                        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                                            {isSubmitted 
                                                ? "You've successfully submitted evidence for this dispute. The bank is currently reviewing the documents. This process can take up to 60-90 days."
                                                : "This dispute has been closed and can no longer be contested. The final status has been recorded in your financial history."}
                                        </p>
                                        
                                        {dispute.evidence_details && (
                                            <div className="mt-12 w-full text-left bg-black border border-gray-800 rounded-3xl p-6">
                                                <h5 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4">Your Explanation</h5>
                                                <p className="text-gray-300 text-sm italic leading-relaxed">
                                                    "{dispute.evidence_details.explanation}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
