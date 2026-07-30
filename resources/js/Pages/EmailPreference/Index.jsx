import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

/**
 * Communication preferences.
 *
 * One switch per category so turning off promotions doesn't also silence
 * product announcements. Security, legal and transactional mail has no switch
 * on purpose — it always sends.
 */
const CATEGORIES = [
    {
        key: 'marketing_emails_enabled',
        title: 'Promotions & offers',
        description: 'Campaigns, promotions and other marketing emails from Spenny Piggy.',
    },
    {
        key: 'product_updates_enabled',
        title: 'Product updates',
        description: 'New features, improvements and changes to how the platform works.',
    },
    {
        key: 'creator_updates_enabled',
        title: 'Creator updates',
        description: 'When creators you follow publish new content or make an announcement.',
    },
    {
        key: 'reactivation_emails_enabled',
        title: 'Reminder emails',
        description: 'Occasional nudges about content waiting for you, and milestone messages.',
    },
    {
        key: 'abandoned_checkout_emails_enabled',
        title: 'Unfinished purchases',
        description: 'A reminder when you start a purchase and do not complete it, with a link back to your checkout.',
    },
    {
        key: 'push_notifications_enabled',
        title: 'Push & in-app notifications',
        description: 'Alerts on your device and in the notification bell. Does not affect email.',
    },
];

export default function EmailPreference({ user, preferences }) {
    const initial = preferences ?? {};

    const [isProcessing, setIsProcessing] = useState(false);
    const { data, setData, post, processing } = useForm(
        CATEGORIES.reduce((acc, { key }) => {
            acc[key] = initial[key] ?? user?.[key] ?? true;
            return acc;
        }, {}),
    );

    const onSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);

        post(route('email.preferences.update'), {
            onFinish: () => setIsProcessing(false),
        });
    };

    const saving = isProcessing || processing;

    return (
        <AuthenticatedLayout>
            <div className="bg-white py-6 md:py-12 min-h-dvh">
                <div className="max-w-xl mx-auto px-6 py-8">
                    <h2 className="text-2xl font-bold mb-2 text-center">Communication Preferences</h2>
                    <p className="text-gray-600 text-center mb-6">
                        Choose what you hear from us. Each type is separate — turning one off leaves the others on.
                    </p>

                    <div className="bg-white rounded-[30px] border border-gray-200 p-6">
                        <div className="space-y-4">
                            {CATEGORIES.map(({ key, title, description }) => (
                                <div key={key} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{title}</h3>
                                            <p className="text-sm text-gray-600">{description}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            id={key}
                                            aria-label={title}
                                            checked={!!data[key]}
                                            onChange={(e) => setData(key, e.target.checked)}
                                            className="mt-1 h-4 w-4 shrink-0 accent-[#FF007F] border-gray-300 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900">Security, legal & receipts</h3>
                                <p className="text-sm text-gray-600">
                                    Always on. Password resets, payment receipts, payout notices and legal or
                                    security notices are essential to using your account, so they cannot be
                                    switched off.
                                </p>
                            </div>

                            <div className="pt-4 border-t">
                                <button
                                    onClick={onSubmit}
                                    disabled={saving}
                                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
