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
            auth={auth}
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
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Dispute Status</h4>
                                
                                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <BiCheckCircle className="text-blue-600 w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-blue-800 font-bold mb-2">We Are Handling This For You</h3>
                                            <p className="text-blue-700 text-sm leading-relaxed mb-4">
                                                No action is required from your side. Spenny Piggy automatically collects delivery receipts, activity logs, and transaction details to contest this dispute on your behalf.
                                            </p>
                                            <div className="text-xs text-blue-600 bg-blue-100/50 p-3 rounded border border-blue-200">
                                                <strong>Note:</strong> While the dispute is open, the disputed amount ({dispute.currency.toUpperCase()} {(dispute.amount / 100).toFixed(2)}) is temporarily reserved. If won, it will be returned to your balance immediately.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
