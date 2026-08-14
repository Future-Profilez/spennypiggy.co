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
 * Stripe Safe — the account-survival argument.
 *
 * The signature is the two-column split: the problem and the answer side by
 * side, sharing a rule. That opposition IS the argument, so it gets the width
 * rather than being two stacked sections.
 *
 * ⚠️ Content-first ban list applies — this is a paid-ads destination.
 */
export default function StripeSafe() {
    const accent = ACCENT.safe;
    const title =
        'Built for reliable payouts, not sudden shutdowns — Spenny Piggy';
    const description = `Payment accounts close when money arrives with no explanation. Every payment here is linked to a platform feature, with the usage rules and activity logs a card issuer expects. ${SUBSCRIPTION_COPY.promise}.`;
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/stripe-safe" />
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators/stripe-safe"
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
                        <Eyebrow accent={accent}>Account safety</Eyebrow>

                        <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                            Built for payouts
                            <br />
                            that{' '}
                            <span className="text-gradient-wishlist">
                                keep arriving.
                            </span>
                        </h1>

                        <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl">
                            Accounts get closed when money arrives with nothing
                            behind it. Everything sold here leaves a record of
                            what it was for — which is the difference between a
                            payment that stands up to review and one that does
                            not.
                        </p>

                        <StartSelling promise={promise} />
                    </div>

                    {/* Problem / answer, side by side */}
                    <div className="mt-16 grid gap-4 md:gap-5 lg:grid-cols-2">
                        <div className="rounded-box border-2 border-white/15 bg-white/[0.04] p-6 md:p-10">
                            <Eyebrow accent={accent}>The problem</Eyebrow>
                            <h2 className="mb-7 mt-4 font-gulfs text-2xl uppercase leading-[0.95] tracking-tight text-white md:text-4xl">
                                Why accounts get shut down
                            </h2>
                            <ul className="space-y-5">
                                {[
                                    'Money arrives with no stated reason, so a reviewer cannot tell what it was for.',
                                    'Unexplained transfers between strangers are the pattern fraud teams look for.',
                                    'Nothing links the payment to a product, so there is nothing to show when one is queried.',
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex gap-4 text-base leading-relaxed text-gray-300 md:text-lg"
                                    >
                                        <span
                                            className="mt-2.5 h-[5px] w-6 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: accent,
                                            }}
                                        />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-box border-2 border-black bg-white p-6 md:p-10">
                            <Eyebrow accent={accent}>What we do instead</Eyebrow>
                            <h2 className="mb-7 mt-4 font-gulfs text-2xl uppercase leading-[0.95] tracking-tight text-black md:text-4xl">
                                Every charge explains itself
                            </h2>
                            <ul className="space-y-5">
                                {[
                                    'Payments are always linked to a platform feature',
                                    'Usage and content rules, published and enforced',
                                    'Monthly compliance reminders to creators',
                                    'Activity logs in the shape a card issuer expects',
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-4 text-base text-gray-700 md:text-lg"
                                    >
                                        <span
                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black"
                                            style={{
                                                backgroundColor: accent,
                                            }}
                                        >
                                            <Check size={14} strokeWidth={4} />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* What gets attached */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="On every payment"
                            accent={accent}
                            lead="Whichever of the seven ways to earn a sale came through, the same three things are attached to it."
                        >
                            Three records,{' '}
                            <span className="text-gradient-wishlist">
                                written automatically
                            </span>
                        </SectionHead>

                        <LedgerFrame className="mt-10">
                            <LedgerRow
                                title="A delivery record"
                                line="What was sold, who bought it, and whether it has been delivered — held against the charge itself."
                                tag="automatic"
                            />
                            <LedgerRow
                                title="A time-stamped log"
                                line="Listed, purchased, delivered, opened. Each step dated, so the sequence can be shown rather than described."
                                tag="automatic"
                            />
                            {/* ⚠️ The creator is the merchant of record — the
                                platform assembles the evidence, the creator
                                submits it. Do not write "the platform answers
                                it"; see Disputes.jsx. */}
                            <LedgerRow
                                title="A dispute pack"
                                line="If a payment is queried, the purchase, delivery and access records are already assembled for you to submit."
                                tag="on demand"
                            />
                        </LedgerFrame>

                        <Link
                            href="/creators/disputes"
                            className="mt-6 inline-flex items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70 min-h-[44px]"
                            style={{ textDecorationColor: accent }}
                        >
                            How disputes are handled
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Close */}
                    <div className="mt-20 text-center md:mt-28">
                        <h2 className="font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            Build somewhere{' '}
                            <span className="text-gradient-wishlist">
                                that stays up
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
