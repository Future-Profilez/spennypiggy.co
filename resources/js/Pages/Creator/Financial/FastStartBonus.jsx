import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function FastStartBonus({ auth, fast_start_bonus }) {
    const bonus = fast_start_bonus;

    const formatCurrency = (amount, currency = 'GBP') =>
        new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP' }).format(Number(amount || 0));

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const statusConfig = {
        active:             { label: 'Window Open',        bg: 'bg-green-400',  border: 'border-green-600',  text: 'text-black' },
        pending_settlement: { label: 'Pending Settlement',  bg: 'bg-yellow-300', border: 'border-yellow-500', text: 'text-black' },
        ready:              { label: 'Ready to Pay',        bg: 'bg-blue-400',   border: 'border-blue-600',   text: 'text-white' },
        processing:         { label: 'Processing',          bg: 'bg-blue-400',   border: 'border-blue-600',   text: 'text-white' },
        pending:            { label: 'Pending',             bg: 'bg-yellow-300', border: 'border-yellow-500', text: 'text-black' },
        in_transit:         { label: 'In Transit',          bg: 'bg-blue-400',   border: 'border-blue-600',   text: 'text-white' },
        paid:               { label: 'Paid',                bg: 'bg-green-400',  border: 'border-green-600',  text: 'text-black' },
        no_bonus:           { label: 'No Bonus',            bg: 'bg-gray-200',   border: 'border-gray-400',   text: 'text-gray-700' },
        payout_paused:      { label: 'Payout Paused',       bg: 'bg-orange-300', border: 'border-orange-500', text: 'text-black' },
        failed:             { label: 'Failed',              bg: 'bg-red-400',    border: 'border-red-600',    text: 'text-white' },
    };

    const statusInfo = statusConfig[bonus?.status] || statusConfig['pending'];
    const windowDays = bonus?.window_days || 30;
    const daysElapsed = bonus?.status === 'active'
        ? Math.max(0, windowDays - (bonus?.days_remaining ?? windowDays))
        : windowDays;
    const windowProgress = Math.min(100, (daysElapsed / windowDays) * 100);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Fast Start Bonus" />

            <div className="bg-[#A2E4B8] min-h-dvh pb-16">
                <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-5">

                    {/* Header */}
                    <div className="flex items-center gap-4 bg-white p-5 border-[3px] border-black rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-200 rounded-full -mr-10 -mt-10 opacity-40" />
                        <Link
                            href={route('financial.dashboard')}
                            className="relative z-10 p-3 rounded-xl bg-white border-[2px] border-black hover:bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="relative z-10">
                            <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-none uppercase">
                                Fast Start Bonus
                            </h1>
                            <p className="text-sm text-gray-700 mt-1 font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#FF007F] rounded-full inline-block" />
                                Earn a bonus on your first {windowDays}-day earnings window
                            </p>
                        </div>
                    </div>

                    {!bonus ? (
                        /* Not connected */
                        <div className="bg-white border-[3px] border-black rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
                            <div className="text-5xl mb-4">🔗</div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-black mb-2">Connect Stripe First</h2>
                            <p className="text-sm text-gray-600 font-medium">Once your Stripe account is connected, your {windowDays}-day earning window starts automatically.</p>
                        </div>
                    ) : (
                        <>
                            {/* Hero bonus card */}
                            <div className="bg-white border-[3px] border-black rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                {/* Gradient top strip */}
                                <div className="bg-gradient-to-r from-[#8C52FF] to-[#FF007F] p-6 md:p-8">
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
                                            Platform Bonus
                                        </span>
                                        <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border-2 ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-black text-white mb-2">
                                        {formatCurrency(bonus.bonus_so_far || bonus.final_bonus || 0, bonus.currency)}
                                    </div>
                                    <div className="text-sm text-white/80 font-bold">
                                        {bonus.bonus_rate_pct}% of {formatCurrency(bonus.earnings_so_far || bonus.final_earnings || 0, bonus.currency)} earned
                                    </div>

                                    {/* Active window progress */}
                                    {bonus.status === 'active' && (
                                        <div className="mt-5 pt-5 border-t border-white/20">
                                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">
                                                <span>Day {daysElapsed} of {windowDays}</span>
                                                <span>
                                                    {bonus.days_remaining > 1
                                                        ? `${bonus.days_remaining} days left`
                                                        : `${bonus.hours_remaining ?? 0}h left`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-white h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${windowProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {bonus.status === 'paid' && bonus.paid_at && (
                                        <div className="mt-3 text-sm text-white/80 font-bold">
                                            Paid on {formatDate(bonus.paid_at)}
                                        </div>
                                    )}
                                </div>

                                {/* Window dates */}
                                <div className="grid grid-cols-2 divide-x-2 divide-black border-t-[3px] border-black">
                                    <div className="px-6 py-4">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Window Opened</div>
                                        <div className="text-sm font-black text-black">{formatDate(bonus.window_start)}</div>
                                    </div>
                                    <div className="px-6 py-4">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Window Closed</div>
                                        <div className="text-sm font-black text-black">{formatDate(bonus.window_end)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tiered rates */}
                            {bonus.tiered_enabled && bonus.tiers?.length > 0 && (
                                <div className="bg-white border-[3px] border-black rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                                    <h3 className="text-[13px] font-black uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#FF007F] rounded-full inline-block" />
                                        Bonus Tiers
                                    </h3>
                                    <div className="space-y-2.5">
                                        {bonus.tiers.map((tier, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between rounded-[20px] px-5 py-3.5 border-2 transition-all ${
                                                    tier.active
                                                        ? 'border-black bg-gradient-to-r from-purple-100 to-pink-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                                        : tier.reached
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-300 bg-gray-50 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black">
                                                        {tier.active ? '▶' : tier.reached ? '✓' : '○'}
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {formatCurrency(tier.threshold, bonus.currency)}
                                                        {tier.next_threshold ? ` – ${formatCurrency(tier.next_threshold, bonus.currency)}` : '+'}
                                                    </span>
                                                </div>
                                                <span className={`text-base font-black ${
                                                    tier.active ? 'text-[#8C52FF]' : tier.reached ? 'text-green-600' : 'text-gray-400'
                                                }`}>
                                                    {tier.rate_pct}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium mt-4">
                                        Your bonus rate is based on total earnings in the {windowDays}-day window.
                                    </p>
                                </div>
                            )}

                            {/* Payout details (post-window) */}
                            {bonus.status !== 'active' && (
                                <div className="bg-white border-[3px] border-black rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                                    <h3 className="text-[13px] font-black uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#FF007F] rounded-full inline-block" />
                                        Payout Details
                                    </h3>
                                    <dl className="divide-y divide-gray-100">
                                        <div className="flex justify-between py-3.5">
                                            <dt className="text-sm text-gray-600 font-bold">Earnings (window)</dt>
                                            <dd className="text-sm font-black text-black">{formatCurrency(bonus.final_earnings ?? bonus.earnings_so_far, bonus.currency)}</dd>
                                        </div>
                                        <div className="flex justify-between py-3.5">
                                            <dt className="text-sm text-gray-600 font-bold">Bonus ({bonus.bonus_rate_pct}%)</dt>
                                            <dd className="text-sm font-black text-[#FF007F]">{formatCurrency(bonus.final_bonus ?? bonus.bonus_so_far, bonus.currency)}</dd>
                                        </div>
                                        {bonus.expected_bonus != null && bonus.expected_bonus !== bonus.final_bonus && (
                                            <div className="flex justify-between py-3.5">
                                                <dt className="text-sm text-gray-600 font-bold">Expected (post-refunds)</dt>
                                                <dd className="text-sm font-black text-black">{formatCurrency(bonus.expected_bonus, bonus.currency)}</dd>
                                            </div>
                                        )}
                                        {bonus.clawback > 0 && (
                                            <div className="flex justify-between py-3.5">
                                                <dt className="text-sm text-orange-600 font-bold">Clawback applied</dt>
                                                <dd className="text-sm font-black text-orange-600">−{formatCurrency(bonus.clawback, bonus.currency)}</dd>
                                            </div>
                                        )}
                                        {bonus.eligible_at && (
                                            <div className="flex justify-between py-3.5">
                                                <dt className="text-sm text-gray-600 font-bold">Eligible from</dt>
                                                <dd className="text-sm font-black text-black">{formatDate(bonus.eligible_at)}</dd>
                                            </div>
                                        )}
                                        {bonus.paid_at && (
                                            <div className="flex justify-between py-3.5">
                                                <dt className="text-sm text-gray-600 font-bold">Paid on</dt>
                                                <dd className="text-sm font-black text-black">{formatDate(bonus.paid_at)}</dd>
                                            </div>
                                        )}
                                        {bonus.stripe_transfer_id && (
                                            <div className="flex justify-between py-3.5 items-center">
                                                <dt className="text-sm text-gray-600 font-bold">Transfer ID</dt>
                                                <dd className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 truncate max-w-[180px]">
                                                    {bonus.stripe_transfer_id}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            )}

                            {/* Failed alert */}
                            {bonus.status === 'failed' && (
                                <div className="bg-red-100 border-[3px] border-red-500 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex gap-4">
                                    <span className="text-2xl shrink-0">⚠️</span>
                                    <div>
                                        <p className="text-base font-black text-red-800 uppercase tracking-wide">Payout Failed</p>
                                        <p className="text-sm text-red-700 font-medium mt-1">
                                            Our team will review this. Contact{' '}
                                            <a href="mailto:support@spennypiggy.co" className="underline font-bold">
                                                support@spennypiggy.co
                                            </a>{' '}
                                            if the issue persists.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Paused alert */}
                            {bonus.status === 'payout_paused' && (
                                <div className="bg-orange-100 border-[3px] border-orange-400 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex gap-4">
                                    <span className="text-2xl shrink-0">⏸</span>
                                    <div>
                                        <p className="text-base font-black text-orange-800 uppercase tracking-wide">Payouts Paused</p>
                                        <p className="text-sm text-orange-700 font-medium mt-1">
                                            Your Fast Start Bonus will be released once your payouts are unpaused.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* How it works */}
                            <div className="bg-white border-[3px] border-black rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                                <h3 className="text-[13px] font-black uppercase tracking-widest text-black mb-5 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-[#FF007F] rounded-full inline-block" />
                                    How It Works
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { step: '01', text: `Your ${windowDays}-day earning window starts the moment you connect Stripe.` },
                                        { step: '02', text: 'Earn as much as you can. Your bonus is calculated on your total net earnings in that window.' },
                                        { step: '03', text: 'After the window closes, your bonus is paid out after a short settlement period.' },
                                    ].map(({ step, text }) => (
                                        <div key={step} className="flex items-start gap-4">
                                            <span className="shrink-0 w-9 h-9 bg-[#FF007F] border-2 border-black rounded-[12px] flex items-center justify-center text-[11px] font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                {step}
                                            </span>
                                            <p className="text-sm text-gray-700 font-medium pt-2">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="text-center pb-2">
                                <Link
                                    href="/legal/fast-start-bonus-terms"
                                    className="text-xs font-black text-gray-500 hover:text-black underline underline-offset-2 transition-colors uppercase tracking-widest"
                                >
                                    Terms &amp; Conditions
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
