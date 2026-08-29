import { Head, Link } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import AdPage from "./components/AdPage";
import FeeBlock from "./components/FeeBlock";
import RiskBlock from "./components/RiskBlock";
import WhyTheFee from "./components/WhyTheFee";
import {
    ACCENT,
    Eyebrow,
    SectionHead,
    StartSelling,
    StatCell,
} from "./components/Ledger";
import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from "@/constants/creatorSubscription";

/**
 * /creators/wishlist — the wishlist keyword landing page.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5c.
 *
 * 🚨 THIS IS NOT A COMPARISON PAGE. It is where the whole wishlist keyword
 * cluster lands — "creator wishlist", "wishlist for creators", "wishlist for
 * streamers", "fan wishlist", plus the brand-name and "alternative" variants.
 * Today those keywords point at /creators/features, which never uses the word
 * "wishlist" once. That is the entire reason this page exists.
 *
 * 🚨 NOTHING ON THIS PAGE IS NEW PRODUCT. It is the existing seven ways to earn,
 * described for somebody who arrived by typing "wishlist". The spec is explicit:
 * **if a feature does not exist on the site today, it is not on this page.**
 *
 * ⚠️ THE FEATURES ARE NOT RENAMED. Content Goals, Piggy Bank and Paid Requests
 * keep their product names and are explained in wishlist language — a creator
 * who signs up looking for "wishes" has to be able to find the thing they read
 * about, and a page that invents a fifth product name breaks that.
 *
 * ⚠️ No brand is named anywhere. Where a gift wishlist is genuinely better, the
 * page says so and links to the generic comparison rather than arguing with it.
 */
export default function Wishlist({
    wishtenderLive = false,
    fees,
    threeTierLine,
}) {
    const accent = ACCENT.safe;
    const title = "Creator wishlist that pays you 100% — Spenny Piggy";
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/wishlist" />
            </Head>

            <Guest>
                <AdPage>
                    {/* ── Hero ─────────────────────────────────────────── */}
                    <Eyebrow accent={accent}>Wishlist</Eyebrow>

                    <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                        The wishlist
                        <br />
                        <span className="text-gradient-wishlist">
                            that pays you.
                        </span>
                    </h1>

                    <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl">
                        Supporters don’t send you a gift with nothing behind it.
                        They buy the thing you made — at the price you set — and
                        you keep all of it.
                    </p>

                    <StartSelling promise={promise} />

                    <div className="mt-12 grid gap-px overflow-hidden rounded-box bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCell
                            className="bg-[#0B0B0C]"
                            accent={accent}
                            figure="100%"
                            label="Of your listed price"
                            note="No revenue cut. Supporters cover the platform fee at checkout."
                        />
                        <StatCell
                            className="bg-[#0B0B0C]"
                            accent={accent}
                            figure="Weekly"
                            label="Payout runs"
                            note="Straight to your own bank account through Stripe."
                        />
                        <StatCell
                            className="bg-[#0B0B0C]"
                            accent={accent}
                            figure="Every wish"
                            label="Carries a record"
                            note="Time-stamped delivery evidence on every payment."
                        />
                        <StatCell
                            className="bg-[#0B0B0C]"
                            accent={accent}
                            figure="Live chat"
                            label="Real people"
                            note="When money is on the line, not a form and a three-day wait."
                        />
                    </div>

                    <RiskBlock
                        className="mt-14"
                        wishtenderLive={wishtenderLive}
                    />

                    {/* ── The difference ──────────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHead eyebrow="The difference" accent={accent}>
                            A gift is not a sale
                        </SectionHead>

                        <div className="mt-8 grid gap-3 md:grid-cols-2">
                            <Column
                                heading="A gift wishlist"
                                muted
                                rows={[
                                    "A fan sends money or a gift. Nothing is exchanged.",
                                    "No record of what it was for.",
                                    "Your bank sees unexplained money from a stranger.",
                                    "A dispute has nothing to defend.",
                                    "Withdrawal fees, instant-payout fees and conversion on the way out.",
                                    "Tips and gifts are still taxable — and hard to evidence.",
                                ]}
                            />
                            <Column
                                heading="A Spenny Piggy wishlist"
                                accent={accent}
                                rows={[
                                    "A fan buys a wish. You deliver the content.",
                                    "A delivery record, time-stamped, on every wish.",
                                    "Your bank sees a sale from a registered business.",
                                    "A dispute is answered with evidence.",
                                    "You receive the price you listed. Weekly. No creator-side fees.",
                                    "Income that is simple to declare, because it looks like income.",
                                ]}
                            />
                        </div>
                    </section>

                    {/* ── What a wish is here ─────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHead
                            eyebrow="What a wish is here"
                            accent={accent}
                        >
                            Four ways to grant a wish
                        </SectionHead>

                        <div className="mt-8 grid gap-3 md:grid-cols-3">
                            <Way
                                name="Content Goals"
                                body="Set the target, attach the content, share the link. Everyone who buys gets the same thing and moves the bar."
                                accent={accent}
                            />
                            <Way
                                name="Piggy Bank"
                                body="They choose the amount. They get your exclusive content back. For the supporters who want to give more than you asked."
                                accent={accent}
                            />
                            <Way
                                name="Paid Requests"
                                body="A custom wish. Paid up front to your balance, refunds handled for you, paid out when you deliver."
                                accent={accent}
                            />
                        </div>

                        {/* The fourth, smaller — per the spec's own layout. */}
                        <div className="mt-3 rounded-box-sm border border-white/15 px-5 py-5">
                            <h3 className="font-gulfs text-[13px] uppercase tracking-[0.1em] text-white">
                                Exclusive content
                            </h3>
                            <p className="mt-2 text-[15px] leading-[1.6] text-gray-300">
                                Every piece of content you list is a wish
                                someone can grant.
                            </p>
                        </div>
                    </section>

                    {/* ── Public wishes ───────────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHead eyebrow="Live now" accent={accent}>
                            Your wishes are findable
                        </SectionHead>

                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
                            Wishes are searchable on Discover alongside creators
                            and memberships, so a wish can be granted by
                            somebody who was never sent the link.
                        </p>

                        <Link
                            href="/discover"
                            className="mt-5 inline-block font-mono text-[12px] uppercase tracking-[0.14em] underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                            style={{ color: accent }}
                        >
                            See the live Discover page →
                        </Link>
                    </section>

                    {/*
                     * ── What it costs the supporter ──────────────────────
                     * Shown in FULL here: this is where the wishlist searcher
                     * compares us with what they use now, so the three rails and
                     * the £1 are the argument rather than a footnote.
                     */}
                    <div className="mt-16 md:mt-24">
                        <FeeBlock
                            fees={fees}
                            competitor="a gift wishlist"
                            competitorFees={[]}
                            accent={accent}
                            threeTierLine={threeTierLine}
                        />
                    </div>

                    <div className="mt-16 md:mt-24">
                        <WhyTheFee accent={accent} />
                    </div>

                    {/* ── Where a gift wishlist is still better ───────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHead eyebrow="To be fair" accent={accent}>
                            Where a gift wishlist is still better
                        </SectionHead>

                        <div className="mt-8 rounded-box-sm border border-white/15 px-5 py-6">
                            <p className="max-w-3xl text-base leading-[1.6] text-gray-200">
                                Physical gifts shipped without sharing your
                                address. Spenny Piggy does not ship physical
                                gifts. If that is what you want, keep a gift
                                wishlist for it and use Spenny Piggy for the
                                money you need to be bank-legible.
                            </p>

                            <Link
                                href="/creators/vs/wishlist"
                                className="mt-4 inline-block font-mono text-[12px] uppercase tracking-[0.14em] underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                                style={{ color: accent }}
                            >
                                Spenny Piggy vs a wishlist →
                            </Link>
                        </div>
                    </section>

                    <section className="mt-16 md:mt-24">
                        <h2 className="font-gulfs text-4xl uppercase leading-[0.9] tracking-tight text-white md:text-6xl">
                            Create your wishlist.
                        </h2>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg">
                            Listing is free. You are not charged anything until
                            you have made a sale.
                        </p>
                        <StartSelling promise={promise} className="mt-8" />
                    </section>
                </AdPage>
            </Guest>
        </>
    );
}

/** One half of the gift-vs-sale comparison. */
function Column({ heading, rows, accent, muted = false }) {
    return (
        <div className="rounded-box-sm border border-white/15 px-5 py-6">
            <h3
                className="font-gulfs text-[13px] uppercase tracking-[0.1em]"
                style={{ color: muted ? undefined : accent }}
            >
                <span className={muted ? "text-gray-400" : undefined}>
                    {heading}
                </span>
            </h3>

            <ul className="mt-4 grid gap-3">
                {rows.map((row) => (
                    <li
                        key={row}
                        className={`text-[15px] leading-[1.55] ${muted ? "text-gray-400" : "text-gray-200"}`}
                    >
                        {row}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Way({ name, body, accent }) {
    return (
        <div className="rounded-box-sm border border-white/15 px-5 py-5">
            <h3
                className="font-gulfs text-[13px] uppercase tracking-[0.1em]"
                style={{ color: accent }}
            >
                {name}
            </h3>
            <p className="mt-3 text-[15px] leading-[1.6] text-gray-300">
                {body}
            </p>
        </div>
    );
}
