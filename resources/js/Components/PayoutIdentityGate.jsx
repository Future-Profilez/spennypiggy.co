import { Link } from "@inertiajs/react";

/*
 * The notice on the creator's finance page when money is waiting and their
 * identity check is not complete.
 *
 * 🚨 IDENTITY IS A PAYOUT GATE, NOT AN ONBOARDING STEP (10 Sep 2026, client
 * direction). A creator builds, publishes and sells with no ID check at all —
 * this is the first and only place the platform asks for one, and it asks
 * because there is money it cannot send them.
 *
 * 🚨 RENDERED ON THE PROP'S PRESENCE. The server sends `identity_gate` only
 * when the creator has earnings AND the check is incomplete; it is null in
 * every other case, including a creator with a clean check. An always-sent
 * object is one truthiness slip away from telling every verified creator they
 * are unverified — the SaveButton `is_saved` class of fault.
 *
 * 🚨 THE MONEY IS THE HEADLINE, NOT THE PASSPORT. "£240 is waiting for you"
 * is the sentence that gets somebody to photograph a document; "verify your
 * identity" is a chore. The amount and date come from the server — the same
 * figures the payout card beside this one renders, so the two cannot disagree.
 *
 * 🚨 NO CTA ON A STATE THE CREATOR CANNOT MOVE. Three of the six states are
 * waits (with our provider, with our team) or refusals. A button there is how
 * somebody clicks "verify" three times against a check that already passed,
 * and each press is a real billable check.
 *
 * Design: same device as SuspendedBanner — a bordered frame with the state
 * colour spent once, on a spine down the left edge. Amber throughout: nothing
 * here is a judgement about the person. Red on this platform means somebody
 * said no, and only the refusal states earn it. No shadow, no scale, black on
 * pink.
 */

const AMBER = "#E6EA7B";
const RED = "#FF4D4D";

/** States where a person has decided against them, rather than something being undone. */
const REFUSED = ["rejected", "flagged"];

function money(amount, currency) {
    const value = Number(amount) || 0;

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency || "GBP",
            // ⚠️ Zero-decimal currencies (JPY, KRW) must not render "¥1,200.00".
            // Intl already knows which those are; letting it decide is the only
            // way this stays right for a currency nobody thought about.
        }).format(value);
    } catch {
        // An unknown currency code must not take the panel down — the amount
        // still reads, which is the part that matters.
        return `${currency || ""} ${value.toFixed(2)}`.trim();
    }
}

function when(iso) {
    if (!iso) return null;

    const d = new Date(iso.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return null;

    return d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
    });
}

export default function PayoutIdentityGate({ gate, className = "" }) {
    if (!gate) return null;

    const refused = REFUSED.includes(gate.state);
    const spine = refused ? RED : AMBER;
    const date = when(gate.expected_at);
    const total = money(gate.held_total, gate.currency);

    return (
        <section
            className={`relative overflow-hidden bg-white rounded-box border-2 border-black ${className}`}
            aria-live="polite"
        >
            <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ backgroundColor: spine }}
            />

            <div className="pl-7 pr-5 py-5 sm:pl-8 sm:pr-6 sm:py-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-8">
                    <div className="min-w-0 max-w-[62ch]">
                        {/* The money first. This is the reason the panel exists. */}
                        <p className="font-gulfs text-[26px] uppercase leading-[1.05] text-black sm:text-[30px]">
                            {total} is waiting for you
                        </p>

                        <h2 className="mt-3 text-[15px] font-extrabold text-black">
                            {gate.title}
                        </h2>

                        <p className="mt-1.5 text-[15px] leading-[1.55] text-black/70">
                            {gate.body}
                        </p>

                        {/* ⚠️ The reviewer's own words, and only on a refusal. */}
                        {gate.reason ? (
                            <p className="mt-3 border-l-2 border-black/20 pl-3 text-[14px] leading-[1.55] text-black/70">
                                {gate.reason}
                            </p>
                        ) : null}
                    </div>

                    {/* ⚠️ `route` is null wherever the creator cannot act — see the
                        component docblock. Nothing is rendered rather than a
                        disabled button, which reads as something that might work. */}
                    {gate.cta && gate.route ? (
                        <div className="shrink-0">
                            <Link
                                href={gate.route}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-black bg-[#FF007F] px-5 py-2 text-sm font-extrabold text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                            >
                                {gate.cta}
                            </Link>
                        </div>
                    ) : null}
                </div>

                {/* Hairline facts, the StatStrip device — no nested boxes. */}
                <dl className="mt-5 grid grid-cols-1 divide-y divide-black/15 border-t border-black/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="py-3 sm:pr-4">
                        <dt className="text-[11px] font-bold uppercase tracking-[1px] text-black/50">
                            Next payout
                        </dt>
                        <dd className="mt-1 text-[15px] font-extrabold text-black">
                            {money(gate.held_amount, gate.currency)}
                        </dd>
                    </div>

                    <div className="py-3 sm:px-4">
                        <dt className="text-[11px] font-bold uppercase tracking-[1px] text-black/50">
                            Held reserves
                        </dt>
                        <dd className="mt-1 text-[15px] font-extrabold text-black">
                            {money(gate.held_reserves, gate.currency)}
                        </dd>
                    </div>

                    <div className="py-3 sm:pl-4">
                        <dt className="text-[11px] font-bold uppercase tracking-[1px] text-black/50">
                            Would arrive
                        </dt>
                        <dd className="mt-1 text-[15px] font-extrabold text-black">
                            {/* ⚠️ Never a guessed date. The server sends the real
                                payout date or nothing at all. */}
                            {date || "Once verified"}
                        </dd>
                    </div>
                </dl>

                {/* ⚠️ Says plainly that nothing is lost. A creator reading "we cannot
                    pay you" without this assumes the money went somewhere. */}
                <p className="mt-3 text-[13px] leading-[1.5] text-black/55">
                    Nothing is lost while you sort this out — your earnings keep
                    adding up and will be paid on the first payout run after your
                    check clears.
                </p>
            </div>
        </section>
    );
}
