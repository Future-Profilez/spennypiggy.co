import { Head, Link, usePage } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import { FaCheck, FaLock } from "react-icons/fa";

/**
 * Creator Growth Bonus — the ladder, the rules, and a signed-in creator's own
 * position on it.
 *
 * 🚨 EVERY FIGURE IS A PROP. The ladder, the seat count, the thresholds and the
 * window all come from `GrowthBonusController::programme()`, which reads
 * `config/growth_bonus.php` — the same file `GrowthBonusService` enforces. A
 * number typed into this file is a number that can disagree with the one that
 * pays.
 *
 * ⚠️ THE FIGURE IS "QUALIFYING EARNINGS" — the creator's listed sale value
 * including any VAT, the defined term in the programme terms (clause 2.1). A
 * £100 listing counts as £100 whatever the creator's VAT status.
 *
 * 🚨 NEVER DESCRIBE IT AS MONEY THE CREATOR KEEPS (client instruction, 26 Aug
 * 2026). Where VAT applies, part of it is collected on HMRC's behalf. Use the
 * defined term — this page links to the terms that define it — and never "you
 * keep", "take-home" or "your balance".
 *
 * ⚠️ Payout timing copy says "on the same payout as the earnings that qualified
 * you" and must NOT say "the following Friday". The bonus rides the qualifying
 * transaction through its own 7-day hold, so it lands 7–13 days after the
 * milestone is crossed depending on the day of the week — a named day would be
 * wrong for most creators (client-confirmed, 26 Aug 2026).
 *
 * House rules honoured: no shadows (frames are lines), no hover/tap scale,
 * radius tokens only, black type on every colour ground.
 */
export default function GrowthBonusIndex() {
    const { auth, programme, progress, isCreator } = usePage().props;

    const sym = programme.currency_symbol;
    const money = (n) => `${sym}${Number(n).toLocaleString("en-GB")}`;

    const reached = (rung) =>
        progress ? progress.qualifying_gmv >= rung.gmv : false;

    /* 🚨 "Unlocked" answers whether they SOLD enough. This answers whether they
       have been PAID, which is the question a creator actually asks — and until
       28 Aug 2026 the page could not answer it at all. */
    const rewardFor = (rung) =>
        (progress?.milestones ?? []).find((m) => m.gmv === rung.gmv) ?? null;

    const payState = (r, rung) => {
        /* ⚠️ The figure on this page is computed live from the ledger, but a
           reward is a money record and is only ever created by the daily
           evaluator. So a creator can cross a rung minutes before the row
           exists. Saying so beats leaving the cell blank, which reads as the
           platform having missed the sale. */
        if (!r) {
            return reached(rung) && progress?.awaiting_evaluation
                ? { label: "Confirming your bonus", tone: "due" }
                : null;
        }
        if (r.status === "paid")
            return { label: `Paid ${r.paid_at ?? ""}`.trim(), tone: "paid" };
        if (r.status === "reversed")
            return { label: "Reversed — refunded", tone: "off" };
        return {
            label: r.expected_payout
                ? `Expected ${r.expected_payout}`
                : "With your next payout",
            tone: "due",
        };
    };

    return (
        <Guest auth={auth}>
            <Head title="Creator Growth Bonus" />

            <div className="bg-black">
                {/* ── The offer ── */}
                <section className="relative overflow-hidden px-4 py-14 md:py-24">
                    <div className="relative z-10 mx-auto max-w-5xl text-center">
                        <span className="mb-5 inline-block -rotate-2 rounded-full bg-[#E6EA7B] px-4 py-1 text-sm font-black uppercase tracking-widest text-black">
                            Creator Growth Bonus
                        </span>

                        <h1 className="mb-5 font-gulfs text-3xl uppercase leading-none tracking-[2px] text-white md:text-5xl lg:text-6xl">
                            Earn up to{" "}
                            <span className="text-[#FF007F]">
                                {money(programme.max_total)}
                            </span>
                            <br />
                            as you grow
                        </h1>

                        <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-white/65 md:text-xl">
                            Earn your first {money(programme.activation_gmv)}{" "}
                            within {programme.activation_window_days} days to
                            unlock the Creator Growth Bonus. Then keep hitting
                            milestones and unlock up to{" "}
                            {money(programme.max_total)} in total rewards.
                        </p>

                        {/* ⚠️ Scarcity is a real count, not copy. `seats_remaining`
                            is the live figure the seat claim enforces. */}
                        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#05EFB8] px-4 py-2 text-xs font-black uppercase tracking-widest text-black">
                                {programme.seats_remaining} of{" "}
                                {programme.max_seats} places left
                            </span>
                            {!auth?.user && (
                                <Link
                                    href={route("register")}
                                    className="inline-flex items-center rounded-box-sm border-black bg-[#FF007F] px-6 py-3 font-gulfs uppercase tracking-wider text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                                >
                                    Start selling
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── The creator's own position ── */}
                {progress && (
                    <section className="px-4 pb-4">
                        <div className="mx-auto max-w-5xl rounded-box border-black bg-[#0d0a16] p-6 md:p-8">
                            <ProgressPanel
                                progress={progress}
                                programme={programme}
                                money={money}
                            />
                        </div>
                    </section>
                )}

                {/* A creator with no profile row yet — the scheme is open but
                    they are not in it, which is a different thing from having
                    missed it. */}
                {isCreator && !progress && (
                    <section className="px-4 pb-4">
                        <div className="mx-auto max-w-5xl rounded-box border-black bg-[#0d0a16] p-6 text-white/70 md:p-8">
                            <p className="text-base md:text-lg">
                                Connect your payouts and make your first sale to
                                join the Growth Bonus. Your{" "}
                                {programme.activation_window_days}-day window
                                starts the day your payouts go live.
                            </p>
                        </div>
                    </section>
                )}

                {/* ── The ladder ── */}
                <section className="px-4 py-10 md:py-16">
                    <div className="mx-auto max-w-5xl">
                        <h2 className="mb-6 text-center font-gulfs text-2xl uppercase tracking-[2px] text-white md:text-4xl">
                            The milestones
                        </h2>

                        {/* ⚠️ Wide content scrolls inside its own container — the
                            page body must never scroll sideways. */}
                        <div className="overflow-x-auto rounded-box border-black bg-white">
                            <table className="w-full min-w-[520px] text-left">
                                <thead>
                                    <tr className="bg-[#E6EA7B]">
                                        <Th>Qualifying earnings</Th>
                                        <Th>Bonus unlocked</Th>
                                        <Th>Running total</Th>
                                        {progress && <Th>Your bonus</Th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {programme.ladder.map((rung) => (
                                        <LadderRow
                                            key={rung.gmv}
                                            rung={rung}
                                            money={money}
                                            reached={
                                                progress ? reached(rung) : null
                                            }
                                            state={
                                                progress
                                                    ? payState(
                                                          rewardFor(rung),
                                                          rung,
                                                      )
                                                    : null
                                            }
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <p className="mt-4 text-center text-sm text-white/50">
                            Milestones are cumulative. Reaching a later
                            milestone also unlocks any earlier one you have not
                            yet earned.
                        </p>
                    </div>
                </section>

                {/* ── The rules ── */}
                <section className="px-4 pb-16 md:pb-24">
                    <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
                        <Rule title="How you join" ground="#E6EA7B">
                            The first {programme.max_seats} creators to reach{" "}
                            {money(programme.activation_gmv)} in qualifying
                            earnings within {programme.activation_window_days}{" "}
                            days of their payouts going live. Registering or
                            setting up a profile does not take a place — only
                            sales do.
                        </Rule>

                        <Rule title="When you are paid" ground="#05EFB8">
                            Each bonus is paid on the same payout as the sale
                            that took you over the milestone, once that sale has
                            cleared its usual 7-day wait. Nothing to claim and
                            nothing to apply for.
                        </Rule>

                        <Rule title="What counts" ground="#FF007F">
                            Completed sales to real customers, counted at your
                            listed price — a £100 listing counts as £100,
                            including any VAT. Refunds, chargebacks and anything
                            you buy from yourself do not count.
                        </Rule>

                        <Rule title="How long you have" ground="#8C52FF">
                            {programme.expiry_months > 0
                                ? `${programme.expiry_months} months from the day you unlock your first
                                   milestone to reach the rest. Anything you have not earned by
                                   then expires.`
                                : `There is no deadline once you have unlocked your first milestone.`}
                        </Rule>
                    </div>

                    {/* ⚠️ The terms are linked from the page that makes the offer,
                        not only from the footer. A creator deciding whether to
                        chase a milestone should not have to go looking for what
                        they are actually agreeing to. */}
                    <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-[1.6] text-white/40">
                        The Creator Growth Bonus runs alongside the Fast Start
                        Bonus, the Founders Bonus and referral rewards — earning
                        one does not affect the others. Milestones are
                        qualifying thresholds, not a promise of earnings.
                        Bonuses are subject to validation, settlement, refund
                        and chargeback rules. Read the full{" "}
                        <Link
                            href="/growth-bonus-terms"
                            className="underline transition-opacity duration-200 hover:opacity-70"
                        >
                            Creator Growth Bonus terms
                        </Link>
                        .
                    </p>
                </section>
            </div>
        </Guest>
    );
}

function ProgressPanel({ progress, programme, money }) {
    const pct =
        progress.next_milestone && progress.next_milestone > 0
            ? Math.min(
                  100,
                  Math.round(
                      (progress.qualifying_gmv / progress.next_milestone) * 100,
                  ),
              )
            : 100;

    if (progress.status === "pending") {
        return (
            <>
                <Eyebrow>Not unlocked yet</Eyebrow>
                <h3 className="mb-3 font-gulfs text-xl uppercase text-white md:text-3xl">
                    Earn {money(programme.activation_gmv)} to unlock{" "}
                    {money(programme.ladder[0].amount)}
                </h3>
                <Meter pct={pct} />
                <Stats
                    items={[
                        ["Qualifying earnings", money(progress.qualifying_gmv)],
                        ["Target", money(programme.activation_gmv)],
                        ["Window closes", progress.activation_deadline ?? "—"],
                    ]}
                />
            </>
        );
    }

    if (progress.status === "missed") {
        return (
            <>
                <Eyebrow>Window closed</Eyebrow>
                <h3 className="mb-2 font-gulfs text-xl uppercase text-white md:text-3xl">
                    Growth Bonus eligibility has ended
                </h3>
                <p className="text-white/60">
                    {progress.missed_reason === "seats_full"
                        ? `You reached the target, but all ${programme.max_seats} places were taken. Keep an eye out — more bonus programmes are coming.`
                        : `The ${programme.activation_window_days}-day window closed before the ${money(programme.activation_gmv)} target was reached. Everything else on your account works as normal.`}
                </p>
            </>
        );
    }

    // active | expired
    return (
        <>
            <Eyebrow>
                {progress.status === "expired"
                    ? "Programme ended"
                    : "You're in"}
            </Eyebrow>
            <h3 className="mb-3 font-gulfs text-xl uppercase text-white md:text-3xl">
                {progress.next_milestone
                    ? `${money(progress.remaining_to_next)} to your next ${money(progress.next_reward)}`
                    : `You have unlocked every milestone`}
            </h3>
            {progress.next_milestone && <Meter pct={pct} />}
            <Stats
                items={[
                    ["Qualifying earnings", money(progress.qualifying_gmv)],
                    ["Bonus earned", money(progress.earned_total)],
                    ["Bonus paid", money(progress.paid_total)],
                    progress.expires_at
                        ? ["Expires", progress.expires_at]
                        : ["Expires", "No deadline"],
                ]}
            />
        </>
    );
}

const Eyebrow = ({ children }) => (
    <span className="mb-3 inline-block rounded-box-xs bg-[#E6EA7B] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-black">
        {children}
    </span>
);

const Meter = ({ pct }) => (
    <div
        className="mb-5 h-3 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
    >
        <div
            className="h-full rounded-full bg-[#FF007F] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
        />
    </div>
);

const Stats = ({ items }) => (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(([label, value]) => (
            <div
                key={label}
                className="rounded-box-sm border-black bg-black/40 px-4 py-3"
            >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                    {label}
                </p>
                <p className="font-gulfs text-lg uppercase text-white md:text-xl">
                    {value}
                </p>
            </div>
        ))}
    </div>
);

const Rule = ({ title, ground, children }) => (
    <div
        className="rounded-box border-black p-6 md:p-7"
        style={{ backgroundColor: ground }}
    >
        <h3 className="mb-2 font-gulfs text-xl uppercase text-black md:text-2xl">
            {title}
        </h3>
        <p className="text-[15px] leading-[1.5] text-black/75 md:text-base">
            {children}
        </p>
    </div>
);

/**
 * One rung of the ladder.
 *
 * ⚠️ Extracted so the payment state is resolved ONCE. Written inline it was
 * called four times per row — for the guard, twice for the colour and again for
 * the label — which prettier then nested six levels deep and made unreadable.
 */
const LadderRow = ({ rung, money, reached, state }) => (
    <tr className="border-t-2 border-black/10">
        <Td strong>{money(rung.gmv)}</Td>
        <Td>{money(rung.amount)}</Td>
        <Td>{money(rung.cumulative)}</Td>

        {reached !== null && (
            <Td>
                {reached ? (
                    <>
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-black">
                            <FaCheck className="shrink-0" />
                            Unlocked
                        </span>
                        {state && (
                            <span
                                className={`mt-1 block text-[12px] leading-[1.4] ${
                                    state.tone === "paid"
                                        ? "font-bold text-black"
                                        : state.tone === "off"
                                          ? "text-black/40"
                                          : "text-black/60"
                                }`}
                            >
                                {state.label}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-black/40">
                        <FaLock className="shrink-0" />
                        Locked
                    </span>
                )}
            </Td>
        )}
    </tr>
);

const Th = ({ children }) => (
    <th className="px-4 py-3 font-CeraGR text-[11px] uppercase tracking-widest text-black md:px-6">
        {children}
    </th>
);

const Td = ({ children, strong }) => (
    <td
        className={`px-4 py-3 text-black md:px-6 ${strong ? "font-gulfs text-lg uppercase" : "text-[15px] font-semibold"}`}
    >
        {children}
    </td>
);
