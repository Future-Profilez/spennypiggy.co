import { Link } from "@inertiajs/react";
import { FaArrowRight, FaClock } from "react-icons/fa";

/**
 * The creator's own Growth Bonus position, on their dashboard (brief §6).
 *
 * ⚠️ THE FIGURE IS "QUALIFYING EARNINGS" — the creator's listed sale value,
 * the defined term in the programme terms (clause 2.1). It was gross customer
 * spend until 26 Aug 2026, when the client fixed the base to the listed price;
 * every label here changed with it. It is now the SAME base
 * `FounderProgressTracker` reports a few inches above on this dashboard, so the
 * two no longer need a label to keep them apart — but keep the defined term,
 * because the terms page a creator can click through to uses it.
 *
 * 🚨 THE BAR MEASURES THE CURRENT LEG, NOT THE WHOLE LADDER. Measured from
 * zero, a creator at £9,900 of a £10,000 rung sits at 99% for the entire
 * £7,500–£10,000 stretch and then appears to fall backwards the moment they
 * cross it. `progress_pct` is computed server-side from the previous rung.
 *
 * ⚠️ RENDERS NOTHING when the payload is null — the scheme is dark, this is not
 * the owner's own dashboard, or the creator is not in the programme. A bar at
 * zero would advertise a programme they are not part of.
 *
 * ⚠️ Every figure is a prop from `GrowthBonusPanelPayload`, which is also what
 * the `/growth-bonus` page renders — one shape, so the widget and the page
 * cannot disagree on the creator's own screen.
 *
 * House rules: no shadow, no hover/tap scale, radius tokens only, black type on
 * every colour ground.
 */
export default function GrowthBonusTracker({ data }) {
    if (!data) return null;

    const sym = data.currency_symbol ?? "£";
    const money = (n) =>
        `${sym}${Number(n ?? 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

    // ── Window closed without qualifying ──
    if (data.status === "missed") {
        return (
            <Shell ground="#0d0a16" ink="text-white">
                <Eyebrow tone="dark">Growth Bonus</Eyebrow>
                <h3 className="font-gulfs text-lg uppercase leading-tight md:text-2xl">
                    Your window has closed
                </h3>
                <p className="mt-1 text-[14px] leading-[1.5] text-white/65">
                    {data.missed_reason === "seats_full"
                        ? "You reached the target, but every place was taken this time. More bonus programmes are coming."
                        : `You reached ${money(data.qualifying_gmv)} of the ${money(data.activation_gmv)} needed. Everything else on your account works as normal.`}
                </p>
            </Shell>
        );
    }

    // ── In the activation window ──
    if (data.status === "pending") {
        return (
            <Shell ground="#8C52FF">
                <Eyebrow>Growth Bonus</Eyebrow>
                <h3 className="font-gulfs text-lg uppercase leading-tight text-black md:text-2xl">
                    Earn {money(data.activation_gmv)} to unlock{" "}
                    {money(data.next_reward ?? 0)}
                </h3>

                <Meter pct={data.progress_pct} />

                <Stats
                    items={[
                        ["Qualifying earnings", money(data.qualifying_gmv)],
                        ["To go", money(data.remaining_to_next)],
                    ]}
                />

                {/* ⚠️ The countdown is the whole reason this state is urgent, so
                    it is stated in days rather than as a date a creator has to
                    do arithmetic on. It is floored at 0 server-side. */}
                {typeof data.days_left === "number" && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-box-xs bg-black/[0.12] px-3 py-1.5 text-[12px] font-black uppercase tracking-wider text-black">
                        <FaClock className="shrink-0" />
                        {data.days_left === 0
                            ? "Last day"
                            : `${data.days_left} day${data.days_left === 1 ? "" : "s"} left`}
                    </p>
                )}

                <Cta />
            </Shell>
        );
    }

    // ── Active, or expired with history ──
    const finished = data.next_milestone === null;
    const expired = data.status === "expired";

    return (
        <Shell ground={expired ? "#0d0a16" : "#05EFB8"} ink={expired ? "text-white" : "text-black"}>
            <Eyebrow tone={expired ? "dark" : "light"}>Growth Bonus</Eyebrow>

            <h3
                className={`font-gulfs text-lg uppercase leading-tight md:text-2xl ${expired ? "text-white" : "text-black"}`}
            >
                {expired
                    ? `You earned ${money(data.earned_total)}`
                    : finished
                      ? `You unlocked every milestone — ${money(data.earned_total)}`
                      : `${money(data.remaining_to_next)} to your next ${money(data.next_reward)}`}
            </h3>

            {!expired && !finished && <Meter pct={data.progress_pct} />}

            <Stats
                dark={expired}
                items={[
                    ["Qualifying earnings", money(data.qualifying_gmv)],
                    ["Bonus earned", money(data.earned_total)],
                    ["Bonus paid", money(data.paid_total)],
                ]}
            />

            {/* ⚠️ A milestone the creator's spend no longer covers is not the
                only reason a figure can look wrong — an unconvertible sale means
                the spend above is UNDERSTATED, and without this line a milestone
                that should have unlocked has no explanation. */}
            {data.unconverted_rows > 0 && (
                <p
                    className={`mt-3 text-[12px] leading-[1.5] ${expired ? "text-white/60" : "text-black/65"}`}
                >
                    {data.unconverted_rows} sale
                    {data.unconverted_rows === 1 ? "" : "s"} could not be
                    converted to {sym === "£" ? "GBP" : "your currency"} and{" "}
                    {data.unconverted_rows === 1 ? "is" : "are"} not counted yet.
                </p>
            )}

            {expired ? null : <Cta />}
        </Shell>
    );
}

const Shell = ({ ground, ink = "text-black", children }) => (
    <div
        className={`mb-4 rounded-box border-black p-5 md:p-6 ${ink}`}
        style={{ backgroundColor: ground }}
    >
        {children}
    </div>
);

const Eyebrow = ({ tone = "light", children }) => (
    <span
        className={`mb-2 inline-block rounded-box-xs px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
            tone === "dark" ? "bg-white text-black" : "bg-black text-white"
        }`}
    >
        {children}
    </span>
);

const Meter = ({ pct }) => (
    <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.16]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
    >
        <div
            className="h-full rounded-full bg-black transition-[width] duration-500"
            style={{ width: `${pct}%` }}
        />
    </div>
);

const Stats = ({ items, dark = false }) => (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {items.map(([label, value]) => (
            <div key={label}>
                <p
                    className={`text-[10px] font-black uppercase tracking-widest ${dark ? "text-white/45" : "text-black/55"}`}
                >
                    {label}
                </p>
                <p
                    className={`font-gulfs text-lg uppercase md:text-xl ${dark ? "text-white" : "text-black"}`}
                >
                    {value}
                </p>
            </div>
        ))}
    </div>
);

const Cta = () => (
    <Link
        href="/growth-bonus"
        className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-box-sm border-black bg-white px-4 py-2 font-gulfs text-[13px] uppercase tracking-wider text-black transition-colors duration-200 hover:bg-black/[0.04]"
    >
        See the milestones
        <FaArrowRight className="shrink-0" />
    </Link>
);
