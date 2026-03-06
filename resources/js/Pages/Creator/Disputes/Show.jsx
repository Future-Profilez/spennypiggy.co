import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import { BiArrowBack, BiUpload, BiCheckCircle, BiFile } from 'react-icons/bi';

export default function DisputeShow({ auth, dispute }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        explanation: '',
        files: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('creator.disputes.submit', dispute.id));
    };

    const isSubmitted = dispute.evidence_status === 'submitted' || dispute.has_response;
    const isClosed = dispute.status === 'won' || dispute.status === 'lost';
    const canSubmit = !isSubmitted && !isClosed;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('creator.disputes.index')} className="text-gray-500 hover:text-gray-700">
                        <BiArrowBack size={24} />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Dispute Details</h2>
                </div>
            }
        >
            <Head title={`Dispute #${dispute.stripe_dispute_id}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Status Banner */}
                    <div className={`mb-6 p-4 rounded-lg border ${
                        isClosed ? (dispute.status === 'won' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-100 border-gray-200 text-gray-800') :
                        isSubmitted ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            {isClosed ? (dispute.status === 'won' ? <BiCheckCircle /> : <BiFile />) :
                             isSubmitted ? <BiCheckCircle /> : <BiError />}
                            
                            {isClosed ? `Dispute Closed: ${dispute.status.toUpperCase()}` :
                             isSubmitted ? 'Evidence Submitted - Under Review' :
                             'Action Required: Submit Evidence'}
                        </h3>
                        {!isClosed && !isSubmitted && (
                            <p className="mt-1 text-sm">
                                Please submit your evidence by <strong>{new Date(dispute.evidence_due_by).toLocaleDateString()}</strong> to prevent losing this dispute.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Details Column */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <h4 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4">Dispute Info</h4>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-xs text-gray-500">Amount</dt>
                                        <dd className="text-xl font-bold text-gray-900">
                                            {(dispute.amount / 100).toLocaleString('en-GB', { style: 'currency', currency: dispute.currency.toUpperCase() })}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Reason</dt>
                                        <dd className="text-sm font-medium text-gray-900 capitalize">
                                            {dispute.reason ? dispute.reason.replace(/_/g, ' ') : 'General'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Date Initiated</dt>
                                        <dd className="text-sm text-gray-900">
                                            {new Date(dispute.created_at).toLocaleDateString()}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Stripe ID</dt>
                                        <dd className="text-xs font-mono text-gray-600 break-all">
                                            {dispute.stripe_dispute_id}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Evidence Form Column */}
                        <div className="md:col-span-2">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Evidence Submission</h4>
                                
                                {canSubmit ? (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <InputLabel value="Explanation" />
                                            <p className="text-xs text-gray-500 mb-2">
                                                Provide a clear, concise explanation of why this charge is valid. Mention if the customer received the product/service.
                                            </p>
                                            <textarea
                                                className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm h-32"
                                                value={data.explanation}
                                                onChange={e => setData('explanation', e.target.value)}
                                                placeholder="e.g., The customer purchased a digital item on [Date]. Access logs show they downloaded the file on [Date]..."
                                            />
                                            <InputError message={errors.explanation} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel value="Supporting Documents (Optional)" />
                                            <p className="text-xs text-gray-500 mb-2">
                                                Upload screenshots, receipts, or logs (PDF, JPG, PNG). Max 5MB.
                                            </p>
                                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                                                <div className="space-y-1 text-center">
                                                    <BiUpload className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="flex text-sm text-gray-600">
                                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                            <span>Upload a file</span>
                                                            <input 
                                                                id="file-upload" 
                                                                name="file-upload" 
                                                                type="file" 
                                                                className="sr-only" 
                                                                multiple
                                                                onChange={e => setData('files', Array.from(e.target.files))}
                                                            />
                                                        </label>
                                                        <p className="pl-1">or drag and drop</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG, PDF up to 5MB
                                                    </p>
                                                </div>
                                            </div>
                                            {data.files.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {data.files.map((file, idx) => (
                                                        <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                                            <BiFile /> {file.name} ({(file.size / 1024).toFixed(0)} KB)
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <InputError message={errors.files} className="mt-2" />
                                        </div>

                                        {progress && (
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <PrimaryButton disabled={processing}>
                                                Submit Evidence
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                                        {isSubmitted ? (
                                            <>
                                                <BiCheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                                                <h3 className="font-bold text-gray-900">Evidence Submitted</h3>
                                                <p className="text-gray-600 text-sm mt-2">
                                                    We have forwarded your evidence to the card issuer. Reviews typically take 60-75 days.
                                                </p>
                                                <div className="mt-4 text-left bg-white p-4 rounded border text-sm text-gray-500">
                                                    <strong>Your Explanation:</strong>
                                                    <p className="mt-1 italic">"{dispute.evidence_details?.explanation || 'No explanation provided'}"</p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-gray-500">This dispute is closed.</p>
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
