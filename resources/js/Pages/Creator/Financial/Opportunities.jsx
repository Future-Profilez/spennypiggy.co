import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import { Users, TrendingUp, AlertTriangle, Sparkles, Send } from 'lucide-react';

/**
 * Revenue Opportunity Centre.
 *
 * The financial dashboard answers "what did I earn". This answers "what should
 * I do next" — who to thank, who is drifting, and what isn't published yet.
 *
 * Every supporter suggestion is advisory: the platform never hands a creator a
 * supporter's contact details, and the copy says so.
 */
const severityStyle = {
    good: 'border-green-200 bg-green-50 text-green-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

const money = (amount, currency) =>
    `${currency === 'GBP' ? '£' : ''}${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}${currency !== 'GBP' ? ` ${currency}` : ''}`;

/**
 * "Send platform reminder" on an at-risk supporter.
 *
 * The platform delivers its standard content-first message with this creator's
 * name on it — the creator writes nothing and never sees contact details.
 * Consent and the once-per-quiet-spell lock are enforced server-side; this
 * component only reflects the answer.
 */
const RemindButton = ({ supporterId }) => {
    const [state, setState] = useState('idle'); // idle | busy | sent | blocked
    const [note, setNote] = useState(null);

    const send = async () => {
        setState('busy');

        try {
            const { data } = await axios.post(
                route('financial.opportunities.remind', supporterId)
            );
            setState('sent');
            setNote(data.message);
        } catch (error) {
            setState('blocked');
            setNote(error?.response?.data?.message || 'Could not send right now.');
        }
    };

    if (state === 'sent' || state === 'blocked') {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                    state === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
                title={note || ''}
            >
                {state === 'sent' ? '✓ Reminder sent' : note}
            </span>
        );
    }

    return (
        <button
            onClick={send}
            disabled={state === 'busy'}
            title="The platform sends its standard reminder with your name on it — once per quiet spell, and only if the supporter allows reminders."
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#FF007F] px-3 py-1 text-[11px] font-bold text-[#FF007F] transition-colors hover:bg-[#FF007F] hover:text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/50"
        >
            <Send size={11} />
            {state === 'busy' ? 'Sending…' : 'Send platform reminder'}
        </button>
    );
};

const RetentionStat = ({ label, value, hint }) => (
    <div className="rounded-[20px] border border-gray-200 bg-white p-4">
        <div className="text-[13px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
        {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
);

export default function Opportunities({
    currency = 'GBP',
    supporters = [],
    retention = {},
    alerts = [],
    actions = [],
    totals = {},
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Revenue Opportunities" />

            <div className="bg-white py-6 md:py-10 min-h-screen">
                <div className="mx-auto max-w-4xl px-5">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Revenue Opportunities</h1>
                        <p className="mt-1 text-gray-600">
                            Who your best supporters are, who has gone quiet, and what to do next.
                        </p>
                        <Link
                            href={route('financial.dashboard')}
                            className="mt-2 inline-block text-sm font-bold text-[#FF007F]"
                        >
                            ← Back to financial dashboard
                        </Link>
                    </div>

                    {/* Alerts */}
                    {alerts.length > 0 && (
                        <div className="mb-6 space-y-3">
                            {alerts.map((a) => (
                                <div
                                    key={a.key}
                                    className={`rounded-[20px] border p-4 ${severityStyle[a.severity] ?? severityStyle.warning}`}
                                >
                                    <div className="flex items-center gap-2 font-bold">
                                        {a.severity === 'warning' ? (
                                            <AlertTriangle size={16} />
                                        ) : (
                                            <Sparkles size={16} />
                                        )}
                                        {a.title}
                                    </div>
                                    <p className="mt-1 text-sm opacity-90">{a.detail}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Suggested actions */}
                    <section className="mb-8">
                        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
                            <TrendingUp size={18} className="text-[#FF007F]" /> Suggested next steps
                        </h2>

                        {actions.length === 0 ? (
                            <p className="rounded-[20px] border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                Nothing to suggest yet — this fills up once you have a few sales.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {actions.map((a) => (
                                    <div key={a.key} className="rounded-[20px] border border-gray-200 bg-white p-4">
                                        <h3 className="font-bold text-gray-900">{a.title}</h3>
                                        <p className="mt-1 text-sm text-gray-600">{a.detail}</p>
                                        {a.hint && (
                                            <p className="mt-2 text-xs italic text-gray-500">{a.hint}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Retention */}
                    <section className="mb-8">
                        <h2 className="mb-3 text-lg font-bold text-gray-900">
                            Supporter movement · last {retention.window_days ?? 30} days
                        </h2>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <RetentionStat label="New" value={retention.new ?? 0} hint="First ever purchase" />
                            <RetentionStat label="Returning" value={retention.returning ?? 0} hint="Bought before too" />
                            <RetentionStat
                                label="Reactivated"
                                value={retention.reactivated ?? 0}
                                hint="Back after 60+ days"
                            />
                            <RetentionStat label="Lost" value={retention.lost ?? 0} hint="Silent 60+ days" />
                        </div>
                    </section>

                    {/* Supporters */}
                    <section>
                        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900">
                            <Users size={18} className="text-[#FF007F]" /> Your top supporters
                        </h2>
                        <p className="mb-3 text-sm text-gray-500">
                            {totals.supporters ?? 0} supporters · {money(totals.lifetime_value, currency)} lifetime ·{' '}
                            {money(totals.average_supporter_value, currency)} average
                        </p>

                        {supporters.length === 0 ? (
                            <p className="rounded-[20px] border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                No supporters yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {supporters.map((s) => (
                                    <div
                                        key={s.supporter_id}
                                        className="rounded-[20px] border border-gray-200 bg-white p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">
                                                        {s.name || 'Supporter'}
                                                    </span>
                                                    {s.vip?.level && (
                                                        <span
                                                            className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                                                            style={{ backgroundColor: s.vip.color }}
                                                            title={`Platform VIP tier: ${s.vip.level}`}
                                                        >
                                                            {s.vip.icon} {s.vip.level}
                                                        </span>
                                                    )}
                                                    {s.at_risk && (
                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                                            At risk
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500">
                                                    {s.purchases} purchase{s.purchases === 1 ? '' : 's'} ·{' '}
                                                    {money(s.average_order_value, currency)} average
                                                    {s.days_since_last_purchase !== null && (
                                                        <> · last bought {s.days_since_last_purchase}d ago</>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {money(s.lifetime_spent, currency)}
                                                </div>
                                                <div className="text-xs text-gray-400">lifetime</div>
                                            </div>
                                        </div>
                                        {s.at_risk && (
                                            <div className="mt-3 border-t border-gray-100 pt-3">
                                                <RemindButton supporterId={s.supporter_id} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="mt-4 text-xs italic text-gray-500">
                            Supporter contact details are never shared. "Send platform reminder" delivers the
                            platform's standard message with your name on it — once per quiet spell, and only if
                            the supporter allows reminders. For anything personal, use your own social channels.
                        </p>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
