import { Link } from '@inertiajs/react';

/**
 * Component D — the risk block.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 6. It sits
 * directly under the four stat tiles on every /creators/vs/* page, on
 * /creators/wishlist, and on the /creators overview.
 *
 * 🚨 THE COPY BELOW IS FINAL AND IS TRANSCRIBED WORD FOR WORD. Do not
 * paraphrase, shorten or "tighten" it. Every sentence is a statement about what
 * banks and tax authorities do, and each one has to stay defensible on its own.
 *
 * 🚨 NEVER WRITE A PREDICTION ABOUT THE READER. "Your account will be frozen",
 * "you will be investigated", "this will happen to you" — all banned outright by
 * the spec. The block describes what banks and HMRC/IRS do, never what will
 * happen to the person reading it. The difference between those two is the
 * difference between information and a scare.
 *
 * 🚨 THE ARGUMENT IS DELIVERABLES, NOT CONTENT POLICY. It never says, and must
 * never imply, that 18+ creators are the risk — Spenny Piggy actively wants
 * their SFW income, and line three is a fact about how banks rate a PLATFORM.
 * No adult platform is named anywhere in this block, by the spec's own rule.
 *
 * ⚠️ Dark card on an already-dark field, so it is separated by a border rather
 * than by a background: nothing on this site casts a shadow.
 */

const HEADING = 'Before you compare fees, read this.';

/** The one link on this block that points at a sheet which may be a draft. */
const WISHTENDER_HREF = '/creators/vs/wishtender';

const LINES = [
    {
        lead: 'Banks can freeze an account over payments with nothing behind them.',
        body: 'Money arriving with no record of where it came from or what it was for is exactly what an anti-money-laundering review looks for. One report is enough to freeze everything — including what you have already earned.',
    },
    {
        lead: 'Tips are taxable.',
        body: 'HMRC and the IRS treat money from supporters as income, whatever it is called at checkout. Both now receive seller data directly from digital platforms. Undeclared, it does not go away; it stacks up into a bill.',
    },
    {
        lead: 'Platforms that permit 18+ content carry a higher risk rating with banks and payment providers.',
        body: 'That risk sits on every creator using them, whatever you personally post. WishTender had a no-nudity rule and still lost its payment provider in 2024.',
        link: { href: WISHTENDER_HREF, label: 'What happened to WishTender' },
    },
    {
        lead: 'Routing your SFW earnings through an SFW-only platform lowers that risk.',
        body: 'Every Spenny Piggy payment is a sale of content, with a delivery record, reviewed by a person before payout and paid from a registered business (US-based, UK-managed). That is what a bank wants to see and what makes the income simple to declare.',
        link: {
            href: '/creators/stripe-safe',
            label: 'How payments work here',
        },
    },
];

/**
 * @param {boolean} wishtenderLive — whether `/creators/vs/wishtender` is a
 *   published sheet.
 *
 * 🚨 THE LINK IS GATED, AND IT DEFAULTS TO HIDDEN. That sheet ships as a draft
 * and `ComparisonController::show()` answers a draft with a 404 in production,
 * so this block — which renders on every comparison page, on the index and on
 * `/creators/wishlist` — was pointing a live page at a 404, from the one section
 * whose entire job is to be the trustworthy part of the argument.
 *
 * ⚠️ Default `false`, so a caller that forgets the prop drops a link rather than
 * shipping a broken one. The sentence beside it names WishTender and stands on
 * its own; nothing is lost while the sheet is a draft, and publishing the sheet
 * restores the link with no edit here.
 */
export default function RiskBlock({ className = '', wishtenderLive = false }) {
    return (
        <section
            className={`rounded-box border-black bg-[#111113] px-6 py-8 md:px-10 md:py-11 ${className}`}
        >
            <h2 className="font-gulfs text-2xl uppercase leading-[0.95] tracking-tight text-white md:text-4xl">
                {HEADING}
            </h2>

            <div className="mt-7 grid gap-6 md:mt-9 md:grid-cols-2 md:gap-x-10 md:gap-y-8">
                {LINES.map((line) => (
                    <div key={line.lead}>
                        <p className="text-base leading-[1.55] text-white md:text-lg">
                            <strong className="font-semibold">
                                {line.lead}
                            </strong>{' '}
                            <span className="text-gray-300">{line.body}</span>
                        </p>

                        {line.link &&
                            (line.link.href !== WISHTENDER_HREF ||
                                wishtenderLive) && (
                                <Link
                                    href={line.link.href}
                                    className="mt-3 inline-block font-mono text-[12px] uppercase tracking-[0.14em] text-[#05EFB8] underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                                >
                                    {line.link.label} →
                                </Link>
                            )}
                    </div>
                ))}
            </div>
        </section>
    );
}
