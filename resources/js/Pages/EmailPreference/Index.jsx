import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';

/**
 * The Email Preferences & Contact Management Centre.
 *
 * One switch per category with a plain-language line saying what that switch
 * actually sends — the whole point being that a person can turn off ONE thing
 * instead of everything. The list, the titles and the descriptions all arrive
 * from `EmailPreferenceController::catalogue()` so the signed-in page and the
 * no-login signed page can never describe the same switch differently.
 *
 * 🚨 SECURITY, LEGAL AND TRANSACTIONAL MAIL HAS NO SWITCH, BY DESIGN. It is not
 * in the catalogue, it has no column, and there is nothing on this page that
 * could turn a receipt or a password reset off. The always-on card below states
 * that rather than implying it.
 *
 * ⚠️ `signed` means this page was opened from an emailed link by somebody who is
 * NOT logged in — including an account that CANNOT log in. It renders in the
 * guest layout and posts to the signed URL the server supplied.
 */

/** Section headings, in render order. A group with no rows is not drawn. */
const GROUPS = [
    { key: 'marketing', title: 'Promotions' },
    { key: 'creators', title: 'The creators you support' },
    { key: 'purchases', title: 'Your purchases' },
    { key: 'platform', title: 'Your account & the platform' },
];

export default function EmailPreference({ account, categories = [], preferences, updateUrl, signed = false }) {
    const initial = preferences ?? {};

    const [isProcessing, setIsProcessing] = useState(false);
    const { data, setData, post, processing, recentlySuccessful } = useForm(
        categories.reduce((acc, { key }) => {
            // A missing preference always means opted IN — same rule the server
            // applies with `?? true`. Never let an absent value read as "off".
            acc[key] = initial[key] ?? true;
            return acc;
        }, {}),
    );

    const onSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);

        post(updateUrl ?? route('email.preferences.update'), {
            preserveScroll: true,
            onFinish: () => setIsProcessing(false),
        });
    };

    const saving = isProcessing || processing;
    const Layout = signed ? GuestLayout : AuthenticatedLayout;

    const onCount = categories.filter(({ key }) => data[key]).length;

    const setAll = (value) => {
        categories.forEach(({ key }) => setData(key, value));
    };

    return (
        <Layout>
            <Head title="Communication preferences" />

            <div className="bg-white py-6 md:py-12 min-h-dvh">
                <form onSubmit={onSubmit} className="max-w-2xl mx-auto px-5 md:px-6">
                    <h1 className="font-gulfs uppercase text-3xl md:text-4xl text-black text-center">
                        Communication preferences
                    </h1>

                    <p className="text-black/70 text-center mt-3 text-sm md:text-base leading-[1.55]">
                        Choose what you hear from us. Every type below is separate — turning one off
                        leaves the others exactly as they are.
                    </p>

                    {account?.email ? (
                        <p className="text-black/50 text-center mt-2 text-xs md:text-sm leading-[1.55]">
                            These settings apply to <span className="font-semibold">{account.email}</span>.
                        </p>
                    ) : null}

                    {/* No sign-in needed: this is the whole reason the signed link exists. */}
                    {signed ? (
                        <p className="mt-4 rounded-box-sm bg-[#A2E4B8] p-4 text-sm text-black leading-[1.55]">
                            You opened this from a link in one of our emails, so there is nothing to
                            sign in to. Change whatever you like and save — it applies straight away.
                        </p>
                    ) : null}

                    {recentlySuccessful ? (
                        <p className="mt-4 rounded-box-sm bg-[#E6EA7B] p-4 text-sm text-black leading-[1.55]">
                            Saved. Your preferences are up to date.
                        </p>
                    ) : null}

                    <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-sm text-black/60">
                            {onCount} of {categories.length} switched on
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setAll(true)}
                                className="rounded-box-xs border-2 border-[#000] px-3 py-1.5 text-xs font-semibold text-black transition-opacity duration-200 hover:opacity-70"
                            >
                                Turn all on
                            </button>
                            <button
                                type="button"
                                onClick={() => setAll(false)}
                                className="rounded-box-xs border-2 border-[#000] px-3 py-1.5 text-xs font-semibold text-black transition-opacity duration-200 hover:opacity-70"
                            >
                                Turn all off
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-6">
                        {GROUPS.map(({ key: groupKey, title }) => {
                            const rows = categories.filter((c) => c.group === groupKey);

                            if (rows.length === 0) {
                                return null;
                            }

                            return (
                                <section key={groupKey}>
                                    <h2 className="text-xs font-semibold uppercase tracking-widest text-black/50 mb-2">
                                        {title}
                                    </h2>

                                    <div className="rounded-box border-2 border-[#000] divide-y divide-black/10 overflow-hidden bg-white">
                                        {rows.map(({ key, title: rowTitle, description }) => (
                                            <label
                                                key={key}
                                                htmlFor={key}
                                                className="flex items-start justify-between gap-4 p-4 cursor-pointer transition-colors duration-200 hover:bg-black/[0.03]"
                                            >
                                                <span className="min-w-0">
                                                    <span className="block font-semibold text-black">{rowTitle}</span>
                                                    <span className="block text-sm text-black/65 leading-[1.55] mt-1">
                                                        {description}
                                                    </span>
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    id={key}
                                                    aria-label={rowTitle}
                                                    checked={!!data[key]}
                                                    onChange={(e) => setData(key, e.target.checked)}
                                                    className="mt-1 h-5 w-5 shrink-0 accent-[#FF007F] cursor-pointer"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}

                        {/*
                          🚨 NOT A SWITCH, AND MUST NEVER BECOME ONE. There is no
                          preference column behind this card because security,
                          legal and transactional mail always sends. It is stated
                          here so somebody turning everything off knows a receipt
                          will still reach them.
                        */}
                        <section>
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-black/50 mb-2">
                                Always on
                            </h2>
                            <div className="rounded-box border-2 border-[#000] bg-black/[0.03] p-4">
                                <p className="font-semibold text-black">Security, legal &amp; receipts</p>
                                <p className="text-sm text-black/65 leading-[1.55] mt-1">
                                    Password resets, payment receipts, payout notices, verification
                                    emails and legal or security notices are part of using your
                                    account and keeping it safe, so they cannot be switched off — not
                                    here, and not by turning everything else off.
                                </p>
                            </div>
                        </section>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className={`mt-6 w-full rounded-box-sm bg-[#FF007F] px-4 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:brightness-110 active:brightness-95 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {saving ? 'Saving…' : 'Save preferences'}
                    </button>

                    <p className="mt-4 text-center text-xs text-black/50 leading-[1.55]">
                        Changes take effect immediately. If an email was already queued when you
                        saved, it may still arrive.
                    </p>
                </form>
            </div>
        </Layout>
    );
}
