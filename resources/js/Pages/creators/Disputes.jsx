import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from './components/AdPage';
import {
    ACCENT,
    Eyebrow,
    LedgerFrame,
    LedgerRow,
    SectionHead,
    StartSelling,
} from './components/Ledger';
import { ArrowRight, Check } from 'lucide-react';

import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from '@/constants/creatorSubscription';

/**
 * Disputes — what the platform gives a creator to fight one with.
 *
 * 🚨 THE CREATOR IS THE MERCHANT OF RECORD. They own refunds and they own
 * disputes; Spenny Piggy does not respond to the card issuer on their behalf,
 * and this page must never say or imply that it does.
 *
 * That is not a wording preference, it is what the code does: the creator's own
 * dispute inbox is `Creator\DisputeController`, and `submitEvidence` posts THEIR
 * explanation and THEIR files to Stripe under their connected account. It is
 * also what the MoR Agreement says. An earlier version of this page claimed "a
 * chargeback is our paperwork", "we respond to the card issuer" and "Spenny
 * Piggy absorbs the loss" — all three misstate who carries the liability, on a
 * page a creator may rely on before signing up.
 *
 * What the platform actually does, and what this page sells, is EVIDENCE: every
 * sale documents itself as it happens, so when a dispute lands the creator is
 * not reconstructing anything. Prevention first, then the record, then the
 * response they file.
 *
 * ⚠️ Nothing here may promise an outcome. A dispute is decided by the card
 * issuer; the honest claim is that the creator goes in with the evidence, not
 * that they win.
 */

/** Captured automatically on every sale, whichever product it came through. */
const RECORD = [
    {
        title: 'What was sold',
        line: 'The listing, the price and the description the buyer saw — attached to the charge itself, not sitting in a spreadsheet.',
        tag: 'every sale',
    },
    {
        title: 'Proof it was delivered',
        line: 'Delivery status and timestamp on the item, plus courier and tracking on anything physical.',
        tag: 'every sale',
    },
    {
        title: 'Proof it was opened',
        line: 'Whether the buyer accessed the content and how many times. On a digital sale this is the single strongest thing you can show.',
        tag: 'digital',
    },
    {
        title: 'The buyer’s own agreement',
        line: 'For instant digital content, the exact waiver wording they accepted at checkout — that they get access immediately in exchange for the cancellation right.',
        tag: 'digital',
    },
    {
        title: 'A time-stamped trail',
        line: 'Listed, purchased, delivered, opened, accepted. Dated in order, so the sequence can be shown rather than described.',
        tag: 'every sale',
    },
    {
        title: 'The receipt they were sent',
        line: 'The confirmation email, with the item named and the total they agreed to.',
        tag: 'every sale',
    },
];

/** Built in so the dispute is less likely to be raised at all. */
const PREVENTION = [
    {
        title: 'Your name on their statement',
        line: 'Charges read as your username, not a payment processor. "I don’t recognise this" is the most common chargeback there is, and a recognisable descriptor is what stops it.',
    },
    {
        title: 'The total, before they pay',
        line: 'Supporters see the full amount and what they get for it on the last screen — no surprise on the statement a month later.',
    },
    {
        title: '3D Secure on higher-value cards',
        line: 'Card payments above our risk thresholds are stepped up. Where 3DS applies, liability for fraud chargebacks shifts to the issuer.',
    },
    {
        title: 'Pay by Bank on larger payments',
        line: 'Bank rails are far harder to reverse than a card. Larger payments are routed there, and buyers who fail our checks are sent that way too.',
    },
    {
        title: 'Buyer checks before checkout',
        line: 'Blocked cards, recent chargebacks and open disputes are screened before a payment is taken, and spend limits step up with verification.',
    },
    {
        title: 'A way to find their purchase',
        line: 'Buyers who checked out as a guest can look up what they bought without an account — so a lost receipt is not a chargeback.',
    },
];

export default function Disputes() {
    const accent = ACCENT.safe;
    const title = 'Dispute evidence, gathered for you — Spenny Piggy';
    const description = `You are the merchant of record, so refunds and disputes are yours to decide. Every sale on Spenny Piggy documents itself — delivery, access, the buyer's agreement and a time-stamped trail — so you answer with evidence. ${SUBSCRIPTION_COPY.promise}.`;
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/disputes" />
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators/disputes"
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content="/siteicon.png" />
            </Head>

            <Guest>
                <AdPage>
                    {/* Hero */}
                    <div className="max-w-3xl">
                        <Eyebrow accent={accent}>Dispute support</Eyebrow>

                        <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                            It’s your call.
                            <br />
                            <span className="text-gradient-wishlist">
                                We hand you the proof.
                            </span>
                        </h1>

                        <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl">
                            You are the merchant of record, so refunds and
                            disputes are yours to decide. Our job is to make sure
                            you never answer one empty-handed — every sale
                            documents itself as it happens, so the evidence is
                            already there when you need it.
                        </p>

                        <StartSelling promise={promise} />
                    </div>

                    {/* The record */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="What we capture"
                            accent={accent}
                            lead="Six records, written on every sale, whichever of the seven ways to earn it came through. You do not switch anything on and you do not keep them yourself."
                        >
                            Every sale{' '}
                            <span className="text-gradient-wishlist">
                                documents itself
                            </span>
                        </SectionHead>

                        <LedgerFrame className="mt-10">
                            {RECORD.map((item) => (
                                <LedgerRow
                                    key={item.title}
                                    title={item.title}
                                    line={item.line}
                                    tag={item.tag}
                                />
                            ))}
                        </LedgerFrame>
                    </div>

                    {/* Prevention */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Built in"
                            accent={accent}
                            lead="The cheapest dispute is the one nobody raises. These are on by default on every listing you publish."
                        >
                            Six things that stop one{' '}
                            <span className="text-gradient-wishlist">
                                being raised
                            </span>
                        </SectionHead>

                        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
                            {PREVENTION.map((item) => (
                                <div
                                    key={item.title}
                                    className="flex gap-4 rounded-box border-2 border-white/15 bg-white/[0.04] p-5 md:p-6"
                                >
                                    <span
                                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black"
                                        style={{ backgroundColor: accent }}
                                    >
                                        <Check size={14} strokeWidth={4} />
                                    </span>
                                    <div>
                                        <h3 className="mb-2 font-gulfs text-base uppercase leading-tight tracking-wide text-white md:text-lg">
                                            {item.title}
                                        </h3>
                                        <p className="text-base leading-relaxed text-gray-300">
                                            {item.line}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* When one lands */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="If one is raised"
                            accent={accent}
                            lead="Card issuers set a fixed window to respond, and a dispute nobody answers is lost by default. You decide how to answer — everything below is there so the decision is the only work."
                        >
                            You respond.{' '}
                            <span className="text-gradient-wishlist">
                                We arm you.
                            </span>
                        </SectionHead>

                        <LedgerFrame className="mt-10">
                            <LedgerRow
                                title="You are told immediately"
                                line="Email and a notification the moment a dispute opens — and the same for an early fraud warning, while a refund can still head one off."
                                tag="alert"
                            />
                            <LedgerRow
                                title="It lands in your dashboard"
                                line="Every dispute in one place with the buyer, the amount, the reason the issuer gave and the date your response is due."
                                tag="dashboard"
                            />
                            <LedgerRow
                                title="The evidence is assembled"
                                line="The purchase, the delivery and access records, the waiver and the full timeline, packaged for you rather than gathered by you."
                                tag="prepared"
                            />
                            <LedgerRow
                                title="You submit it in one step"
                                line="Write what happened, attach what you want to attach, and it goes to Stripe under your account. In your words, and on your decision."
                                tag="one step"
                            />
                        </LedgerFrame>

                        {/* ⚠️ Says what the platform can honestly promise. A
                            dispute is decided by the card issuer — never imply
                            an outcome, and never imply the platform files it. */}
                        <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
                            The issuer decides the outcome, and nobody can
                            promise you a win. What we can do is make sure you go
                            in with the delivery record, the access log and the
                            buyer’s own agreement already on the page.
                        </p>
                    </div>

                    {/* Why it holds up */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Why this matters"
                            accent={accent}
                            lead="Selling through a payment app leaves you with a transfer and no context — nothing showing what was bought, whether it arrived, or that the buyer agreed to anything. That is the case you cannot win."
                        >
                            The difference is{' '}
                            <span className="text-gradient-wishlist">
                                having a record
                            </span>
                        </SectionHead>

                        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
                            <div className="rounded-box border-2 border-white/15 bg-white/[0.04] p-6 md:p-8">
                                <h3 className="mb-5 font-gulfs text-lg uppercase tracking-wide text-white md:text-xl">
                                    Selling through a payment app
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        'A transfer with no product attached',
                                        'No proof it was delivered or opened',
                                        'No record of what they agreed to',
                                        'You find out when the money is gone',
                                    ].map((item) => (
                                        <li
                                            key={item}
                                            className="flex gap-3 text-base leading-relaxed text-white/60"
                                        >
                                            <span className="mt-2.5 h-[5px] w-5 shrink-0 rounded-full bg-white/25" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-box border-2 border-black bg-white p-6 md:p-8">
                                <h3 className="mb-5 font-gulfs text-lg uppercase tracking-wide text-black md:text-xl">
                                    Selling on Spenny Piggy
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        'The listing attached to the charge',
                                        'Delivery and access, both time-stamped',
                                        'The waiver wording they accepted',
                                        'Told the day it opens, with time to answer',
                                    ].map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-start gap-3 text-base leading-relaxed text-gray-700"
                                        >
                                            <span
                                                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black"
                                                style={{
                                                    backgroundColor: accent,
                                                }}
                                            >
                                                <Check
                                                    size={14}
                                                    strokeWidth={4}
                                                />
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <Link
                            href="/creators/stripe-safe"
                            className="mt-8 inline-flex items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70 min-h-[44px]"
                            style={{ textDecorationColor: accent }}
                        >
                            Why accounts stay safe
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Close */}
                    <div className="mt-20 text-center md:mt-28">
                        <h2 className="font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            Sell with{' '}
                            <span className="text-gradient-wishlist">
                                the receipts
                            </span>
                        </h2>
                        <StartSelling
                            promise={promise}
                            align="center"
                            className="mt-8"
                        />
                    </div>
                </AdPage>
            </Guest>
        </>
    );
}
