import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import GlobalUploader from "@/uploadcare/Uploader";

export default function Order({ auth, purchase, task, isCreator, isSupporter }) {
    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploadProcessing, errors: uploadErrors } = useForm({
        proof_file: null,
        notes: '',
    });

    console.log("task",task)

    const { data: reviewData, setData: setReviewData, post: postReview, processing: reviewProcessing, errors: reviewErrors } = useForm({
        action: '',
        reason: '',
    });

    const [showRejectForm, setShowRejectForm] = useState(false);

    const handleUpload = (e) => {
        e.preventDefault();
        postUpload(route('task.upload-proof', purchase.uuid));
    };

    const handleProofUpload = (file) => {
        setUploadData('proof_file', file);
    };

    const handleAccept = () => {
        if (confirm('Are you sure you want to accept this proof? This will release the funds to the creator.')) {
            reviewData.action = 'accept';
            postReview(route('task.review-proof', purchase.uuid));
        }
    };

    const handleReject = (e) => {
        e.preventDefault();
        reviewData.action = 'reject';
        postReview(route('task.review-proof', purchase.uuid));
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            paid: 'bg-gray-100 text-gray-800',
            assigned: 'bg-blue-100 text-blue-800',
            pending_review: 'bg-yellow-100 text-yellow-800',
            rejected_once: 'bg-red-100 text-red-800',
            escalated: 'bg-red-200 text-red-900',
            completed_accepted: 'bg-green-100 text-green-800',
            delivered: 'bg-green-100 text-green-800',
        };
        return (
            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${colors[status] || 'bg-gray-100'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title={`Order #${purchase.id}`} />
            <div className="py-12 bg-white mx-auto px-4 sm:px-6 lg:px-8">
                <div className='container max-w-[700px]'>
                    <div className='flex items-center justify-between'>
                        <h1 className="text-3xl font-black uppercase font-fre tracking-[1px] font-light text-gray-900">Order #{purchase.uuid.substring(0, 8)}</h1>
                        <StatusBadge status={purchase.status} />
                    </div>
                    <p className="text-gray-600 mt-2 text-xl">Task: <Link href={route('task.show', task.uuid)} className="text-pink-600 hover:underline font-bold">{task.title}</Link></p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                        <span className="px-3 py-1 bg-gray-100 border-2 border-black rounded-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            TYPE: <span className="uppercase text-pink-600">{task.type}</span>
                        </span>
                        <span className="px-3 py-1 bg-gray-100 border-2 border-black rounded-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            PRICE: <span className="text-green-600">${purchase.amount}</span>
                        </span>
                        <span className="px-3 py-1 bg-gray-100 border-2 border-black rounded-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            SLA Hours : <span className="text-green-600">{purchase.sla_hours} hours</span>
                        </span>
                    </div>
                        
                    {task.type === 'timed' && (
                        <div>
                            <h2 className="text-2xl font-black capitalize font-bold font-poppins pb-3 mt-12">Fulfillment Status</h2>
                            
                            {/* CREATOR ACTIONS */}
                            {isCreator && (
                                <div>
                                    {['assigned', 'rejected_once'].includes(purchase.status) ? (
                                        <div className="bg-blue-50 p-6 rounded-[22px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <h3 className="font-black text-xl uppercase text-blue-900 mb-4">
                                                {purchase.status === 'rejected_once' ? 'Proof Rejected - Please Re-upload' : 'Action Required: Upload Proof'}
                                            </h3>
                                            
                                            {purchase.status === 'rejected_once' && (
                                                <div className="bg-red-50 p-3 rounded-[20px] border-2 border-red-200 mb-6 text-red-800">
                                                    <strong>Supporter Reason:</strong> {purchase.rejection_reason}
                                                </div>
                                            )}

                                            <form onSubmit={handleUpload} className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold uppercase text-gray-900 mb-2">Proof File (Image, PDF, etc.)</label>
                                                    <div className="bg-white border-2 border-black rounded-[15px] p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)]">
                                                        <GlobalUploader
                                                            ctxName="task-proof"
                                                            type="minimal"
                                                            sendFile={handleProofUpload}
                                                            accept="image/*,video/*,application/pdf,text/plain,application/zip,application/x-zip-compressed,application/x-rar-compressed"
                                                            imgonly={false}
                                                        />
                                                        {uploadData.proof_file && (
                                                            <div className="mt-2 text-sm text-green-600 font-bold bg-green-50 p-2 rounded border border-green-200 inline-block">
                                                                ✓ File selected: {uploadData.proof_file.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {uploadErrors.proof_file && <div className="text-red-500 text-sm font-bold mt-1">{uploadErrors.proof_file}</div>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold uppercase text-gray-900 mb-2">Notes (Optional)</label>
                                                    <textarea 
                                                        value={uploadData.notes}
                                                        onChange={e => setUploadData('notes', e.target.value)}
                                                        className="w-full border-2 border-black rounded-[15px] p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] focus:border-pink-500 transition-all"
                                                        rows="3"
                                                    ></textarea>
                                                </div>
                                                <button 
                                                    type="submit" 
                                                    disabled={uploadProcessing}
                                                    className="button b w-full"
                                                >
                                                    {uploadProcessing ? 'Uploading...' : 'Submit Proof'}
                                                </button>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="text-gray-600 font-medium text-lg text-center py-8">
                                            {purchase.status === 'pending_review' && "Waiting for supporter review."}
                                            {purchase.status === 'completed_accepted' && "Order completed successfully!"}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SUPPORTER ACTIONS */}
                            {isSupporter && (
                                <div>
                                    {['pending_review', 'completed_accepted', 'rejected_once', 'escalated'].includes(purchase.status) && purchase.proof_content ? (
                                        <div className="border-2 border-black p-6 rounded-[22px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] mb-6">
                                            <h3 className="font-black uppercase text-lg mb-4">Uploaded Proof</h3>
                                                <a 
                                                    href={purchase.proof_content.is_external ? purchase.proof_content.file : `/storage/${purchase.proof_content.file}`} 
                                                    target="_blank" 
                                                    className="text-pink-600 underline font-bold text-lg hover:text-pink-800"
                                                >
                                                    View Proof File {purchase.proof_content.name ? `(${purchase.proof_content.name})` : ''}
                                                </a>
                                                {purchase.proof_content.notes && (
                                                    <div className="mt-4 p-3 bg-white border border-gray-300 rounded-lg">
                                                        <p className="text-sm text-gray-500 uppercase font-bold text-xs mb-1">Notes from Creator:</p>
                                                        <p className="text-gray-800">{purchase.proof_content.notes}</p>
                                                    </div>
                                                )}
                                                <p className="mt-2 text-xs text-gray-400 font-mono">Uploaded: {new Date(purchase.proof_content.uploaded_at).toLocaleString()}</p>

                                            {purchase.status === 'pending_review' && (
                                                <div className="mt-6 pt-6">
                                                    <h4 className="font-black uppercase text-sm mb-2">Your Action Needed:</h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        <button 
                                                            onClick={handleAccept}
                                                            className="bg-green-500 text-white px-4 !py-[10px] rounded-[15px] font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                                                            disabled={reviewProcessing}
                                                        >
                                                            Accept & Complete 
                                                        </button>
                                                        <button 
                                                            onClick={() => setShowRejectForm(!showRejectForm)}
                                                            className="bg-red-500 text-white px-4 !py-[10px] ] rounded-[15px] font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>

                                                    {showRejectForm && (
                                                        <form onSubmit={handleReject} className="mt-6 ">
                                                            <label className="block text-sm font-bold uppercase text-red-800 mb-2">Reason for rejection</label>
                                                            <textarea 
                                                                value={reviewData.reason}
                                                                onChange={e => setReviewData('reason', e.target.value)}
                                                                className="w-full border-2 bg-red-100 border-black rounded-[15px] p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] focus:border-red-500 transition-all"
                                                                rows="3"
                                                                required
                                                            ></textarea>
                                                            <div className="mt-4">
                                                                <button 
                                                                    type="submit" 
                                                                    className="bg-red-700 text-white px-4 py-3 rounded-[20px] w-full font-bold border-2  shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] border-black hover:bg-red-800 uppercase text-sm"
                                                                    disabled={reviewProcessing}
                                                                >
                                                                    Submit Rejection
                                                                </button>
                                                            </div>
                                                        </form>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                            <p className="text-gray-500 italic font-medium">Waiting for creator to upload proof...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {task.type === 'instant' && (
                        <div>
                            <div className="bg-green-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 rounded-xl text-center">
                                {isCreator ? (
                                    <>
                                        <h2 className="text-3xl font-black text-green-800 mb-2 uppercase">Order Completed!</h2>
                                        <p className="text-green-700 mb-8 font-medium text-lg">
                                            This is an instant delivery task. The content has been automatically delivered to the supporter.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-black text-green-800 mb-2 uppercase">Content Unlocked!</h2>
                                        <p className="text-green-700 mb-8 font-medium text-lg">Your purchase was successful.</p>
                                        <a 
                                            href={route('task.download', task.uuid)} 
                                            className="inline-block bg-green-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                        >
                                            Download Content
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                </div>
                
            </div>
        </Guest>
    );
}
