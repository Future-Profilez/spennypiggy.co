import { router } from '@inertiajs/react';
import { useState } from 'react';

/**
 * "Earn your membership back" — the creator's own progress towards a free
 * month of their platform subscription.
 *
 * 🚨 IT IS A CREDIT AGAINST THEIR OWN BILL AND IT IS NEVER CASH, and no line
 * here may imply otherwise. "A free month", never a sum of money — the panel
 * deliberately never renders £8.99 or any other figure a creator could read as
 * money coming to them.
 *
 * 🚨 IT RENDERS ON THE PRESENCE OF THE PROP. The server sends null for a
 * visitor, for a gifter and while the scheme is off, so there is no second
 * gate in JSX to keep in step — the `SuspendedBanner` rule.
 *
 * ⚠️ THE BAR MEASURES THE CURRENT LEG, NOT THE WHOLE LADDER. `progress_pct`
 * comes from the server and is the distance into THIS £500, so a creator does
 * not read 99% at £990 and then appear to fall backwards on crossing. Same
 * correction `GrowthBonusTracker` needed.
 *
 * ⚠️ A NON-ZERO `unconverted` IS SURFACED, never swallowed. It means a sale in
 * a currency with no frozen rate was counted separately rather than guessed
 * at, so the figure beside it is an UNDERSTATEMENT — presenting it as complete
 * is how a creator concludes their earnings are missing.
 */
export default function MembershipCreditPanel({ data }) {
    const [applying, setApplying] = useState(false);

    if (!data) {
        return null;
    }

    const money = (n) =>
        `${data.currency_symbol || '£'}${Number(n || 0).toLocaleString('en-GB', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;

    const months = (n) => `${n} ${Number(n) === 1 ? 'month' : 'months'}`;

    const available = Number(data.months_available || 0);
    const used = Number(data.months_used || 0);
    const canApply = data.spend_mode === 'manual' && available > 0;

    const apply = () => {
        if (applying) {
            return;
        }

        setApplying(true);
        router.post(
            route('membership-credits.apply'),
            {},
            { preserveScroll: true, onFinish: () => setApplying(false) },
        );
    };

    return (
        <div className="mt-8 rounded-box border-[3px] border-black bg-white p-6 md:p-8">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-black/60">
                Earn your membership back
            </p>

            <p className="mt-2 font-gulfs text-[26px] leading-none uppercase text-black md:text-[30px]">
                {available > 0
                    ? `${months(available)} free`
                    : `${money(data.to_next)} to your next free month`}
            </p>

            <p className="mt-4 text-[14px] font-medium leading-relaxed text-black/70">
                Every {money(data.threshold)} you earn buys you{' '}
                {months(data.months_per_threshold)} free of your creator
                membership. It is a credit against this bill — it is never paid
                to you as money.
            </p>

            {/* A hairline strip, not three bordered cells: internal divisions
                are `gap-px` on a black parent, the house StatStrip device. */}
            <div className="mt-6 grid grid-cols-3 gap-px bg-black">
                <Cell label="Earned" value={months(Number(data.months_earned || 0))} />
                <Cell label="Used" value={months(used)} />
                <Cell label="Available" value={months(available)} />
            </div>

            {data.next_threshold ? (
                <div className="mt-6">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                            Towards {money(data.next_threshold)}
                        </span>
                        <span className="font-gulfs text-[15px] text-black">
                            {money(data.earnings)}
                        </span>
                    </div>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-black/10">
                        <div
                            className="h-full bg-[#05EFB8]"
                            style={{
                                width: `${Math.min(100, Math.max(0, Number(data.progress_pct || 0)))}%`,
                            }}
                        />
                    </div>
                </div>
            ) : null}

            {Number(data.unconverted || 0) > 0 ? (
                <p className="mt-4 text-[13px] font-medium leading-relaxed text-black/70">
                    {data.unconverted} of your sales could not be converted to
                    pounds, so the figure above is lower than your real total.
                    Contact support and we will sort it out.
                </p>
            ) : null}

            {data.spend_mode === 'automatic' ? (
                <p className="mt-5 text-[13px] font-medium leading-relaxed text-black/60">
                    Free months are applied to your bill automatically. There is
                    nothing to claim.
                </p>
            ) : (
                <div className="mt-5">
                    <button
                        type="button"
                        onClick={apply}
                        disabled={!canApply || applying}
                        className="inline-flex min-h-[48px] items-center rounded-box-sm border-2 border-black bg-[#FF007F] px-6 font-black uppercase tracking-wide text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-50"
                    >
                        {applying ? 'Applying…' : 'Use a free month'}
                    </button>
                </div>
            )}
        </div>
    );
}

function Cell({ label, value }) {
    return (
        <div className="bg-white p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/55">
                {label}
            </p>
            {/* ⚠️ BLACK, not mint. #05EFB8 on white is 1.4:1 — the figure a
                creator most wants to read would be the one they cannot. Colour
                is spent on the bar, not on the number. */}
            <p className="mt-1 font-gulfs text-[18px] leading-none text-black">
                {value}
            </p>
        </div>
    );
}
