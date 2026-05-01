import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import GlobalUploader from "@/uploadcare/Uploader";
import PriceFormat from "@/includes/PriceFormat";
import userphoto from "../../../assets/siteicon.png";

const Countdown = ({ createdAt, hours, targetDate, onExpire }) => {
    // Determine target date: either passed directly or calculated
    const finalTargetDate = targetDate 
        ? new Date(targetDate) 
        : (createdAt && hours ? new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000) : null);

    if (!finalTargetDate) return null;

    const calculateTimeLeft = () => {
        const difference = +finalTargetDate - +new Date();
        
        if (difference <= 0) {
            return null;
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (!left && onExpire) {
                onExpire();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [finalTargetDate]);

    if (!timeLeft) {
        return <span className="text-red-600">Overdue</span>;
    }

    return (
        <span className="text-pink-600">
            {timeLeft.days > 0 && `${timeLeft.days}d `}
            {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
    );
};

export default function Order({ auth, purchase, task, isCreator, isSupporter, currencySymbol, gracePeriodHours = 1 }) {
    const { formatMultiPrice } = PriceFormat();
    
    // Grace Period Logic
    const GRACE_PERIOD_HOURS = gracePeriodHours;
    const slaDeadline = purchase.sla_deadline 
        ? new Date(purchase.sla_deadline) 
        : (purchase.created_at && task.sla_hours ? new Date(new Date(purchase.created_at).getTime() + task.sla_hours * 3600000) : null);
    
    const [isGraceActive, setIsGraceActive] = useState(false);
    
    useEffect(() => {
        if (slaDeadline) {
            const checkGrace = () => {
                const now = new Date();
                const isOverdue = now > slaDeadline;
                const graceEnd = new Date(slaDeadline.getTime() + GRACE_PERIOD_HOURS * 3600000);
                const isWithinGrace = isOverdue && now < graceEnd;
                const isRunningLate = purchase.status === 'running_late';
                
                setIsGraceActive(isRunningLate || isWithinGrace);
            };
            
            checkGrace();
            const timer = setInterval(checkGrace, 10000); // Check every 10s
            return () => clearInterval(timer);
        }
    }, [purchase.status, slaDeadline]);

    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploadProcessing, errors: uploadErrors } = useForm({
        proof_file: null,
        notes: '',
    });

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
            running_late: 'bg-orange-100 text-orange-800',
            escalated: 'bg-red-200 text-red-900',
            completed_accepted: 'bg-green-100 text-green-800',
            delivered: 'bg-green-100 text-green-800',
            paid_out: 'bg-green-100 text-green-800',
        };
        return (
            <span className={`px-3 py-1 rounded-[30px]   text-xs font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${colors[status] || 'bg-gray-100'}`}>
                {status === 'running_late' ? 'GRACE PERIOD' : status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title={`Order #${purchase.id}`} />
            <div className="py-12 bg-white mx-auto min-h-screen px-4 sm:px-6 lg:px-8">
                <div className='container mx-auto max-w-[700px]'>
                    <div className='md:flex items-center justify-between'>
                        <h1 className="text-3xl mb-3 md:mb-0 font-black uppercase font-anton tracking-wide tracking-[1px] font-light text-gray-900">
                            Order #{purchase.uuid.substring(0, 8)}
                        </h1>
                        <StatusBadge status={purchase.status} />
                    </div>
                    <p className="text-gray-600 mt-2 text-xl">Task: <Link href={route('task.show', task.uuid)} className="text-pink-600 hover:underline font-bold">{task.title}</Link></p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                        <span className="px-[10px] py-[8px] bg-gray-100 border-2 border-black rounded-[30px]  font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            TYPE: <span className="uppercase text-pink-600">{task.type}</span>
                        </span>
                        <span className="px-[10px] py-[8px] bg-gray-100 border-2 border-black rounded-[30px]  font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            PRICE: <span className="text-green-600">{formatMultiPrice(purchase.amount, task.currency || 'USD')}</span>
                        </span>
                        <span className="px-[10px] py-[8px] bg-gray-100 border-2 border-black rounded-[30px]  font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            ASSIGNED: <span className="text-blue-600">{new Date(purchase.created_at).toLocaleDateString()}</span>
                        </span>


                        {['paid', 'assigned', 'pending_review', 'rejected_once', 'initiated', 'running_late'].includes(purchase.status) && 
                        task.sla_hours && (
                            <span className={`px-[10px] py-[8px] border-2 border-black rounded-[30px]  font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isGraceActive ? 'bg-orange-100 border-orange-500' : 'bg-gray-100'}`}>
                                {isGraceActive ? 'GRACE PERIOD: ' : 'REMAINING: '}
                                {isGraceActive ? (
                                    <Countdown 
                                        targetDate={new Date(slaDeadline.getTime() + GRACE_PERIOD_HOURS * 3600000)} 
                                    />
                                ) : (
                                    <Countdown 
                                        createdAt={purchase.created_at} 
                                        hours={task.sla_hours} 
                                        targetDate={slaDeadline}
                                    />
                                )}
                            </span>
                        )}
                       {task?.sla_hours ? <span className="px-[10px] py-[8px] bg-gray-100 border-2 border-black rounded-[30px]  font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            SLA Deadline : <span className="text-green-600">{task?.sla_hours === 168 ? '7d' : `${task?.sla_hours}h`}</span>
                        </span> : ''}
                    </div>
                        
                    {/* Gifter Message Display */}
                    {purchase.gifter_message && (
                        <div className="bg-white border-2 border-black rounded-[30px]  p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8 mb-8">
                            <h3 className="font-black text-gray-900 mb-2 uppercase tracking-wide text-sm">
                                {isCreator ? "Message from Supporter" : "Your Message"}
                            </h3>
                            <p className="text-gray-800 text-lg font-medium italic">
                                "{purchase.gifter_message}"
                            </p>
                        </div>
                    )}

                    <div className="items-center gap-4 mt-8 mb-8">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Created By</p>
                        <div className='flex'>
                            <Link  href={`/${purchase.creator.username}/tasks`}
                            className="flex items-center gap-4 group">
                                <img 
                                    src={purchase.creator.avatar_url || purchase.creator.avatar || userphoto} 
                                    alt={purchase.creator.name} 
                                    className="w-14 h-14 rounded-full border-2 border-black object-cover"
                                />
                                <div>
                                    <h4 className="text-lg font-black font-anton tracking-wide leading-none group-hover:text-pink-500 transition-colors">
                                        {purchase.creator.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 font-medium">@{purchase.creator.username}</p>
                                    <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-wider">
                                        On {new Date(task.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {task.type === 'timed' && (
                        <div>
                            <h2 className="text-2xl font-black capitalize font-bold font-poppins pb-3 mt-12">Fulfillment Status</h2>
                            {purchase.status === 'refunded' ? 
                                <div>
                                    <p className="font-bold mb-6 text-gray-500 capitalize text-xl">This order has been refunded.</p>
                                    {/* <p className="font-bold mb-6 text-gray-500 capitalize text-xl">This order has been refunded automatically because it was not accepted by the supporter or fulfilled within the defined SLA period.</p> */}
                                </div>
                            : null}  

                            {isCreator && (
                                <div>
                                    {['paid', 'assigned', 'rejected_once', 'initiated', 'running_late'].includes(purchase.status) ? (
                                        <div className="bg-blue-50 p-6 rounded-[30px]  border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <h3 className="font-black text-xl uppercase text-blue-900 mb-4">
                                                {purchase.status === 'rejected_once' ? 'Proof Rejected - Please Re-upload' : (purchase.status === 'running_late' ? 'Grace Period Active - Upload Proof' : 'Action Required: Upload Proof')}
                                            </h3>
                                            
                                            {purchase.status === 'running_late' && purchase.sla_deadline && (
                                                <div className="bg-yellow-100 border-2 border-yellow-300 rounded-[30px]  p-4 mb-6">
                                                    <p className="font-bold text-yellow-900 uppercase text-sm">Grace Period Ends In:</p>
                                                    <p className="text-yellow-800 font-black text-lg mt-1">
                                                        <Countdown createdAt={purchase.sla_deadline} hours={1} />
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {purchase.status === 'rejected_once' && (
                                                <div className="bg-red-50 p-3 rounded-[30px]  border-2 border-red-200 mb-6 text-red-800">
                                                    <strong>Supporter Reason:</strong> {purchase.rejection_reason}
                                                </div>
                                            )}

                                            <form onSubmit={handleUpload} className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold uppercase text-gray-900 mb-1">Proof File (Image, PDF, etc.)</label>
                                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Upload the final content or a private link visible only to the buyer.</p>
                                                    <div className="bg-white border-2 border-black rounded-[30px]  p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)]">
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
                                                        className="w-full border-2 border-black rounded-[30px]  p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] focus:border-pink-500 transition-all"
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
                                        <div>
                                            {purchase.proof_content ? (
                                                <div className="border-2 border-black p-6 rounded-[30px]  shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] mb-6">
                                                    <h3 className="font-black uppercase text-lg mb-4">Your Uploaded Proof</h3>
                                                        <a 
                                                            href={purchase.proof_content.is_external ? purchase.proof_content.file : `/storage/${purchase.proof_content.file}`} 
                                                            target="_blank" 
                                                            className="text-pink-600 underline font-bold text-lg hover:text-pink-800"
                                                        >
                                                            View Proof File {purchase.proof_content.name ? `(${purchase.proof_content.name})` : ''}
                                                        </a>
                                                        {purchase.proof_content.notes && (
                                                            <div className="mt-4 p-3 bg-white border border-gray-300 rounded-[30px]  ">
                                                                <p className="text-sm text-gray-500 uppercase font-bold text-xs mb-1">Notes you added:</p>
                                                                <p className="text-gray-800">{purchase.proof_content.notes}</p>
                                                            </div>
                                                        )}
                                                        <p className="mt-2 text-xs text-gray-400 font-mono">Uploaded: {new Date(purchase.proof_content.uploaded_at).toLocaleString()}</p>
                                                </div>
                                            ) : null}
                                            <div className="text-gray-600 font-medium text-lg text-center py-8">
                                                {purchase.status === 'pending_review' && "Waiting for supporter review."}
                                                {purchase.status === 'completed_accepted' && "Order completed successfully!"}
                                                {purchase.status === 'escalated' && (
                                                    <div className="bg-red-50 border-2 border-red-200 rounded-[30px]  p-4 mx-auto max-w-full">
                                                        <h4 className="text-red-800 font-bold uppercase mb-2">Order Escalated</h4>
                                                        <p className="text-red-700 text-sm">
                                                            This order has been escalated to the admin for review. You will be notified once a decision is made.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SUPPORTER ACTIONS */}
                            {isSupporter && (
                                <div>
                                    {['pending_review', 'completed_accepted', 'rejected_once', 'escalated', 'paid_out'].includes(purchase.status) && purchase.proof_content ? (
                                        <div className="border-2 border-black p-6 rounded-[30px]  shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] mb-6">
                                            <h3 className="font-black uppercase text-lg mb-4">Uploaded Proof</h3>
                                                <a 
                                                    href={purchase.proof_content.is_external ? purchase.proof_content.file : `/storage/${purchase.proof_content.file}`} 
                                                    target="_blank" 
                                                    className="text-pink-600 underline font-bold text-lg hover:text-pink-800"
                                                >
                                                    View Proof File {purchase.proof_content.name ? `(${purchase.proof_content.name})` : ''}
                                                </a>
                                                {purchase.proof_content.notes && (
                                                    <div className="mt-4 p-3 bg-white border border-gray-300 rounded-[30px]  ">
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
                                                            className="bg-green-500 text-white px-4 !py-[10px] rounded-[30px]  font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                                                            disabled={reviewProcessing}
                                                        >
                                                            Accept & Complete 
                                                        </button>
                                                        <button 
                                                            onClick={() => setShowRejectForm(!showRejectForm)}
                                                            className="bg-red-500 text-white px-4 !py-[10px] ] rounded-[30px]  font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
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
                                                                className="w-full border-2 bg-red-100 border-black rounded-[30px]  p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] focus:border-red-500 transition-all"
                                                                rows="3"
                                                                required
                                                            ></textarea>
                                                            <div className="mt-4">
                                                                <button 
                                                                    type="submit" 
                                                                    className="bg-red-700 text-white px-4 py-3 rounded-[30px]  w-full font-bold border-2  shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] border-black hover:bg-red-800 uppercase text-sm"
                                                                    disabled={reviewProcessing}
                                                                >
                                                                    Submit Rejection
                                                                </button>
                                                            </div>
                                                        </form>
                                                    )}
                                                </div>
                                            )}

                                            {purchase.status === 'escalated' && (
                                                <div className="mt-6 pt-6 border-t-2 border-dashed border-red-200">
                                                    <div className="bg-red-50 border-2 border-red-200 rounded-[30px]  p-4 mb-4">
                                                        <h4 className="text-red-800 font-bold uppercase mb-2">Order Escalated</h4>
                                                        <p className="text-red-700 text-sm mb-2">
                                                            This order has been escalated to the admin for review. 
                                                            However, you can still choose to accept the proof below if you are satisfied. This will resolve the dispute and release funds to the creator.
                                                        </p>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={handleAccept}
                                                        className="w-full bg-green-500 text-white px-4 py-3 rounded-[30px]  font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                                                        disabled={reviewProcessing}
                                                    >
                                                        Accept & Resolve Dispute
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-[30px]  p-8 text-center">
                                            <p className="text-gray-500 italic font-medium">Waiting for creator to upload proof...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {task.type === 'instant' && (
                        <div>
                            <div className="bg-green-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 rounded-[30px]  text-center mt-6">
                                {isCreator ? (
                                    <>
                                        <h2 className="text-2xl font-black text-green-800 mb-2 uppercase">Order Completed!</h2>
                                        <p className="text-green-700 mb-8 font-medium text-lg">
                                            This is an instant delivery task. The content has been automatically delivered to the supporter.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-black text-green-800 mb-2 uppercase">Content Unlocked!</h2>
                                        <p className="text-green-700 mb-8 font-medium text-lg">Your purchase was successful.</p>
                                        <a 
                                            href={route('task.download', task.uuid)} 
                                            className="inline-block bg-green-500 text-white px-4 py-[12px] rounded-[30px]  font-black uppercase tracking-widest text-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
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
