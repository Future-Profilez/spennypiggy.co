import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function EmailPreference({ user, canManageMarketing }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        marketing_emails_enabled: user.marketing_emails_enabled,
    });

    const onSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);

        post(route('email.preferences.update'), {
            onSuccess: () => {
                setIsProcessing(false);
                // toast.success('Your email preferences have been updated successfully.');
            },
            onError: () => {
                setIsProcessing(false);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <div className='bg-white py-6 md:py-12 h-screen'>
                <div className="max-w-xl mx-auto px-6 py-8">
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Email Preferences
                    </h2>
                    <div className="bg-white  rounded-[30px] border border-gray-200 p-6">

                        <div className="space-y-4">
                            <p className="text-gray-600   mb-4">
                                Control which types of emails you receive from Spenny Piggy.
                            </p>

                            <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900  ">
                                            Marketing Communications
                                        </h3>
                                        <p className="text-sm text-gray-600  ">
                                            Product updates, feature announcements, promotions, and other non-essential emails.
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="marketing_emails_enabled" className="sr-only">
                                            Receive marketing emails
                                        </label>
                                        <input
                                            type="checkbox"
                                            id="marketing_emails_enabled"
                                            checked={data.marketing_emails_enabled}
                                            onChange={(e) => setData('marketing_emails_enabled', e.target.checked)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500   mt-1">
                                    You will still receive transactional, security, compliance, and payment-related emails regardless of this setting.
                                </p>
                            </div>

                            <div className="pt-4 border-t">
                                <button
                                    onClick={onSubmit}
                                    disabled={isProcessing || processing}
                                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${isProcessing || processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing || processing ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-500  ">
                        <p>
                            Transactional emails (password resets, payment receipts, etc.) cannot be unsubscribed as they are essential for using our service.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}