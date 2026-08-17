import { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { toast } from "react-hot-toast";

const ALL_POLICIES = [
    { key: "TermsOfService",           name: "Terms of Service",               href: "/terms-and-conditions" },
    { key: "CreatorAgreement",         name: "Creator Agreement",               href: "/creator-agreement" },
    { key: "SupporterTerms",           name: "Supporter Terms",                 href: "/supporter-terms" },
    { key: "CreatorSupporterContract", name: "Creator-Supporter Contract",      href: "/creator-supporter-contract" },
    { key: "MorAgreement",             name: "MoR Agreement",                   href: "/mor-agreement" },
    { key: "PaymentsPolicy",           name: "Payments Policy",                 href: "/reserves-and-payments-policy" },
    { key: "PaidTasksTerms",           name: "Paid Tasks Terms",                href: "/paid-tasks-terms" },
    { key: "ReturnPolicy",             name: "Return Policy",                   href: "/return-policy" },
    { key: "UsAddendum",               name: "US Addendum",                     href: "/us-addendum" },
    { key: "FastStartBonusTerms",      name: "Fast Payout Terms",               href: "/fast-start-bonus-terms" },
    { key: "ContentPaymentFramework",  name: "Content & Payment Framework",     href: "/content-payment-policy" },
];

export default function PolicyNotifications({ auth, currentSettings }) {
    const isActive = currentSettings.last_terms_update > "2020-01-01";
    const activePolicies = currentSettings.updated_terms_list ?? [];

    const { data, setData, post, processing } = useForm({
        updated_terms_list: activePolicies,
        trigger_date: new Date().toISOString().slice(0, 16),
    });

    const [deactivating, setDeactivating] = useState(false);

    function togglePolicy(key) {
        setData("updated_terms_list",
            data.updated_terms_list.includes(key)
                ? data.updated_terms_list.filter(k => k !== key)
                : [...data.updated_terms_list, key]
        );
    }

    function handleTrigger(e) {
        e.preventDefault();
        if (data.updated_terms_list.length === 0) {
            toast.error("Select at least one policy.");
            return;
        }
        post(route("admin.policy-notifications.trigger"), {
            onSuccess: () => toast.success("Notification triggered! Users will see popup on next visit."),
            onError: (err) => toast.error(Object.values(err)[0] ?? "Failed to trigger."),
        });
    }

    function handleDeactivate() {
        setDeactivating(true);
        router.post(route("admin.policy-notifications.deactivate"), {}, {
            onSuccess: () => {
                toast.success("Notification deactivated.");
                setDeactivating(false);
            },
            onError: () => {
                toast.error("Failed to deactivate.");
                setDeactivating(false);
            },
        });
    }

    return (
        <AuthenticatedLayout auth={auth} header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Policy Change Notifications</h2>}>
            <Head title="Policy Change Notifications" />

            <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                {/* Status card */}
                <div className={`rounded-box border-2 p-6 ${isActive && activePolicies.length > 0 ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-sm font-mono uppercase tracking-widest text-black/60 mb-1">Current Status</p>
                            {isActive && activePolicies.length > 0 ? (
                                <>
                                    <p className="text-lg font-bold text-green-700">🟢 Active — popup showing to users</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Triggered: <span className="font-semibold">{currentSettings.last_terms_update}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {activePolicies.map(k => {
                                            const p = ALL_POLICIES.find(p => p.key === k);
                                            return p ? (
                                                <span key={k} className="text-xs bg-green-100 text-green-800 border border-green-300 rounded-full px-3 py-1 font-medium">{p.name}</span>
                                            ) : null;
                                        })}
                                    </div>
                                </>
                            ) : (
                                <p className="text-lg font-bold text-black/60">⚪ Inactive — no popup shown</p>
                            )}
                        </div>
                        {isActive && activePolicies.length > 0 && (
                            <button
                                onClick={handleDeactivate}
                                disabled={deactivating}
                                className="px-5 py-2 bg-red-600 text-white rounded-box-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {deactivating ? "Deactivating…" : "Deactivate"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Trigger form */}
                <form onSubmit={handleTrigger} className="bg-white rounded-box border border-gray-200 p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Trigger Policy Change Notification</h3>
                        <p className="text-sm text-black/60">
                            Selecting policies and clicking <strong>Trigger</strong> will show a mandatory acceptance popup to all users who joined before the trigger date and haven't accepted since.
                        </p>
                    </div>

                    {/* Policy selection */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Select updated policies</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ALL_POLICIES.map(policy => (
                                <label
                                    key={policy.key}
                                    className={`flex items-center gap-3 p-3 rounded-box-sm border-2 cursor-pointer transition ${
                                        data.updated_terms_list.includes(policy.key)
                                            ? "border-[#FF007F] bg-pink-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.updated_terms_list.includes(policy.key)}
                                        onChange={() => togglePolicy(policy.key)}
                                        className="accent-[#FF007F] w-4 h-4 flex-none"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{policy.name}</span>
                                    <a
                                        href={policy.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="ml-auto text-xs text-[#924DFF] hover:underline flex-none"
                                    >
                                        View →
                                    </a>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Trigger date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Trigger date/time
                            <span className="text-black/60 font-normal ml-2">(users who accepted before this date will see the popup)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={data.trigger_date}
                            onChange={e => setData("trigger_date", e.target.value)}
                            className="border border-gray-300 rounded-box-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF007F]"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={processing || data.updated_terms_list.length === 0}
                            className="border-2 border-black px-8 py-3 bg-[#FF007F] text-black rounded-box-sm font-bold hover:brightness-110 transition active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
                        >
                            {processing ? "Triggering…" : "Trigger Notification"}
                        </button>
                        <p className="text-xs text-black/60">
                            {data.updated_terms_list.length} {data.updated_terms_list.length === 1 ? "policy" : "policies"} selected
                        </p>
                    </div>
                </form>

                {/* How it works */}
                <div className="bg-gray-50 rounded-box border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-800 mb-3">How this works</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Select the policies that changed and click <strong>Trigger Notification</strong>.</li>
                        <li>• All users who created their account <strong>before</strong> the trigger date and haven't accepted since will see a mandatory popup on their next visit.</li>
                        <li>• The popup lists the updated policies with links to read them. Users click <strong>"I Accept"</strong> to dismiss it.</li>
                        <li>• Click <strong>Deactivate</strong> to hide the popup for everyone (e.g. after a notification run is complete).</li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
