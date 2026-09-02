import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { FaArrowRight, FaClock } from "react-icons/fa";
import { safeGet, safeSet } from "@/lib/safeStorage";

/**
 * The creator's own Growth Bonus position, on their dashboard (brief §6).
 *
 * ⚠️ THE FIGURE IS "QUALIFYING EARNINGS" — the creator's listed sale value
 * including any VAT, the defined term in the programme terms (clause 2.1).
 *
 * 🚨 IT IS NOT WHAT THE CREATOR KEEPS, AND THIS TRACKER MUST NEVER SAY IT IS
 * (client instruction, 26 Aug 2026). Where VAT applies, part of the figure goes
 * to HMRC. ⚠️ That is also what separates it from `FounderProgressTracker`,
 * which renders a few inches above on this same dashboard and reports a figure
 * net of VAT — so keep the defined term rather than reaching for "earnings"
 * plain, or the two read as the same number and will not match.
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
    /*
     * 🚨 CROSSING A MILESTONE IS THE ONE HAPPY MOMENT IN THIS WHOLE FEATURE, AND
     * IT USED TO BE A PROGRESS BAR MOVING A FEW PIXELS. The server says which
     * rung was unlocked in the last few days; the browser records which one it
     * has already celebrated, so the moment survives a reload once and does not
     * fire on every visit for a week.
     *
     * ⚠️ `safeStorage`, never bare localStorage — reading the property itself
     * THROWS when a browser refuses site data, and this component renders on the
     * creator's own dashboard.
     */
    const celebrate = data?.just_unlocked ?? null;
    const seenKey = celebrate ? `sp_gb_seen_${celebrate.gmv}` : null;
    const [showBurst, setShowBurst] = useState(false);

    useEffect(() => {
        if (!seenKey) return;
        if (safeGet(seenKey)) return;

        setShowBurst(true);
        safeSet(seenKey, "1");
    }, [seenKey]);

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
        /*
         * 🚨 THE HEADLINE MUST NOT NAME A TARGET THE CREATOR HAS ALREADY PASSED.
         * `qualifying_gmv` is computed LIVE on every render; `status` only moves
         * when the evaluator runs (the queued job, or the daily 09:20 sweep). In
         * the gap between the two, this card read "Earn £100 to unlock £25" to a
         * creator sitting at £108 — directly above a "To go" of £141.53, which is
         * the distance to the NEXT rung. One card, two rungs, contradicting
         * itself, on the screen whose whole job is to say where they stand.
         *
         * ⚠️ `awaiting_evaluation` ALONE IS NOT THE TEST — it is true whenever the
         * live figure has moved past the stored one, including well below the
         * threshold. The crossing is what changes what the headline may claim.
         */
        const crossed = Number(data.qualifying_gmv) >= Number(data.activation_gmv);

        return (
            <Shell ground="#8C52FF">
                <Eyebrow>Growth Bonus</Eyebrow>
                <h3 className="font-gulfs text-lg uppercase leading-tight text-black md:text-2xl">
                    {crossed ? (
                        <>
                            {money(data.activation_gmv)} reached — confirming your{" "}
                            {money(data.first_reward ?? data.next_reward ?? 0)}
                        </>
                    ) : (
                        <>
                            Earn {money(data.activation_gmv)} to unlock{" "}
                            {money(data.next_reward ?? 0)}
                        </>
                    )}
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
                {/* 🚨 ONE ROW OWNS BOTH CONTROLS AND THEIR SPACING. They used to
                    be two separate elements carrying their own `mt-3` / `mt-4`
                    and their own heights (28px against 40px), so they sat on
                    different baselines and the gap between them changed
                    depending on which one wrapped. A row that owns the gap
                    cannot drift; matching `min-h` is what puts them on one line. */}
                <Actions>
                    {typeof data.days_left === "number" && (
                        <span className="inline-flex min-h-[40px] items-center gap-1.5 rounded-box-sm bg-black/[0.12] px-4 text-[12px] font-black uppercase tracking-wider text-black">
                            <FaClock className="shrink-0" />
                            {data.days_left === 0
                                ? "Last day"
                                : `${data.days_left} day${data.days_left === 1 ? "" : "s"} left`}
                        </span>
                    )}
                    <Cta />
                </Actions>
            </Shell>
        );
    }

    // ── Active, or expired with history ──
    const finished = data.next_milestone === null;
    const expired = data.status === "expired";

    return (
        <Shell
            ground={expired ? "#0d0a16" : "#05EFB8"}
            ink={expired ? "text-white" : "text-black"}
        >
            {showBurst && !expired && (
                <Celebration
                    amount={money(celebrate.amount)}
                    milestone={money(celebrate.gmv)}
                />
            )}

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
            {/*
                🚨 THE APPROVAL, WITH THE DAY THE MONEY LEAVES. Until this, a
                creator whose bonus had been approved and dated read exactly the
                same card as one whose bonus nobody had looked at — the platform
                knew and did not say. The date is the SERVER'S stored one, the
                same day the approval email named; deriving "next Friday" here
                would let this card and their inbox disagree.
            */}
            {/*
                🚨 A HOLD OUTRANKS THE APPROVAL LINE. Both can be true at once —
                an admin approved it AND the platform is not sending it — and
                showing "we send it on Friday" beside a bonus that is held is the
                card contradicting itself on the one screen whose job is to say
                where the creator stands. The held sentence wins.

                ⚠️ Amber, never red: nothing was taken away and nobody said no.
                Red on this platform means a person refused.
            */}
            {(() => {
                const held = (data.milestones ?? []).find(
                    (m) => m.hold_reason && !m.paid_at,
                );

                if (!held) return null;

                return (
                    <p
                        className={`mt-3 rounded-box-sm px-3 py-2 text-[12px] font-semibold leading-[1.5] ${
                            expired
                                ? "bg-white/10 text-white/85"
                                : "bg-[#F7EFC9] text-black/80"
                        }`}
                    >
                        {money(held.amount)} on hold — {held.hold_reason}
                    </p>
                );
            })()}

            {(() => {
                // A held bonus is reported by the block above; it must not also
                // claim a send date it no longer has.
                const anyHold = (data.milestones ?? []).some(
                    (m) => m.hold_reason && !m.paid_at,
                );

                const next = anyHold
                    ? null
                    : (data.milestones ?? []).find(
                          (m) => m.status === "approved" && !m.paid_at,
                      );

                if (!next) return null;

                // A bare YYYY-MM-DD parses as UTC midnight, so plain new Date()
                // renders the day BEFORE for any viewer west of Greenwich -
                // appending T00:00:00 parses it as local time.
                const when = next.scheduled_payout_date
                    ? new Date(next.scheduled_payout_date + "T00:00:00").toLocaleDateString(undefined, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                      })
                    : null;

                return (
                    <p
                        className={`mt-3 text-[12px] font-semibold leading-[1.5] ${expired ? "text-white/80" : "text-black/75"}`}
                    >
                        {/* ⚠️ "Send", never "in your bank" — the bank's timing is
                            not ours to promise. */}
                        {money(next.amount)} approved
                        {when ? ` — we send it on ${when}.` : " — it goes with your next payout."}
                    </p>
                );
            })()}

            {data.unconverted_rows > 0 && (
                <p
                    className={`mt-3 text-[12px] leading-[1.5] ${expired ? "text-white/60" : "text-black/65"}`}
                >
                    {data.unconverted_rows} sale
                    {data.unconverted_rows === 1 ? "" : "s"} could not be
                    converted to {sym === "£" ? "GBP" : "your currency"} and{" "}
                    {data.unconverted_rows === 1 ? "is" : "are"} not counted
                    yet.
                </p>
            )}

            {expired ? null : (
                <Actions>
                    <Cta />
                </Actions>
            )}
        </Shell>
    );
}

/**
 * The unlock moment.
 *
 * ⚠️ An ENTRANCE animation, which the house rules allow — what is banned is
 * scale on hover or press. It runs once, and `prefers-reduced-motion` removes
 * the movement entirely rather than slowing it: a burst of flying confetti is
 * exactly what that setting is asking us not to do. The message still reads.
 *
 * ⚠️ Drawn with `aria-hidden` pieces over a real sentence, so a screen reader
 * gets the news and not a description of the decoration.
 */
const Celebration = ({ amount, milestone }) => (
    <div className="relative mb-4 overflow-hidden rounded-box-sm border-black bg-black px-4 py-4">
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
        >
            {CONFETTI.map((c, i) => (
                <span
                    key={i}
                    className="gb-confetti absolute block h-2 w-2 rounded-box-xs motion-reduce:hidden"
                    style={{
                        left: `${c.x}%`,
                        backgroundColor: c.c,
                        animationDelay: `${c.d}ms`,
                    }}
                />
            ))}
        </div>

        <p className="relative text-[11px] font-black uppercase tracking-widest text-[#05EFB8]">
            Milestone unlocked
        </p>
        <p className="relative mt-1 font-gulfs text-2xl uppercase leading-tight text-white md:text-3xl">
            You just unlocked {amount}
        </p>
        <p className="relative mt-1 text-[13px] leading-[1.5] text-white/65">
            You passed {milestone} in qualifying earnings. It will be paid with
            the sales that qualified you.
        </p>

        <style>{`
            @keyframes gb-fall {
                0%   { transform: translateY(-14px) rotate(0deg); opacity: 0; }
                15%  { opacity: 1; }
                100% { transform: translateY(150px) rotate(220deg); opacity: 0; }
            }
            .gb-confetti { top: 0; animation: gb-fall 2.4s ease-in forwards; }
            @media (prefers-reduced-motion: reduce) { .gb-confetti { animation: none; } }
        `}</style>
    </div>
);

/* Fixed positions rather than random: a re-render must not reshuffle them
   mid-animation, and a seeded look is calmer than a scatter. */
const CONFETTI = [
    { x: 8, c: "#05EFB8", d: 0 },
    { x: 21, c: "#E6EA7B", d: 220 },
    { x: 34, c: "#FF007F", d: 90 },
    { x: 47, c: "#8C52FF", d: 380 },
    { x: 60, c: "#05EFB8", d: 160 },
    { x: 73, c: "#E6EA7B", d: 460 },
    { x: 86, c: "#FF007F", d: 300 },
    { x: 94, c: "#8C52FF", d: 60 },
];

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

/**
 * ⚠️ The row below owns the top margin, never the button. A control that
 * carries its own `mt` cannot be put beside anything else without the two
 * spacings fighting — which is exactly what the countdown pill and this button
 * were doing.
 */
const Actions = ({ children }) => (
    <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
);

const Cta = () => (
    <Link
        href="/growth-bonus"
        className="inline-flex min-h-[40px] items-center gap-2 rounded-box-sm border-black bg-white px-4 font-gulfs text-[13px] uppercase tracking-wider text-black transition-colors duration-200 hover:bg-black/[0.04]"
    >
        See the milestones
        <FaArrowRight className="shrink-0" />
    </Link>
);
