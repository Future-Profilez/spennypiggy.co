import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

/**
 * The three shapes a creator's income can take, as one object made of parts.
 *
 * 🚨 ONE FRAME, THREE ABUTTING ROWS — NOT THREE CARDS. The client's point
 * (4 Sep 2026) is that this platform is not a gifting site because it offers
 * several ways to be paid at once. Three separate cards say "three separate
 * products"; three rows sharing hairlines inside one block say "three parts of
 * one income", which is the argument. It is also the house device — `Ledger`'s
 * `LedgerFrame` and the home page's own `WaysToGetPaid` are built this way, for
 * the reason written in `Ledger.jsx`.
 *
 * ⚠️ The content is `config/monetisation.php` via `MonetisationPillars`, never
 * retyped here. That file exists because this list WAS typed twice — on the
 * home page and on `/creators` — and drifted, with Memberships last in both.
 *
 * ⚠️ A pillar with no `href` renders without a link rather than pointing at a
 * page that has not shipped. Paid requests has no landing page today.
 *
 * ⚠️ `activeKey` is the pillar whose OWN page is being rendered — its link is
 * dropped rather than pointing the reader at the page they are already on. A
 * link that goes nowhere new reads as broken, and it is the one link on the
 * block a reader on that page is likeliest to try.
 */
export default function PillarCards({ pillars = [], activeKey = null, className = '' }) {
    if (pillars.length === 0) return null;

    return (
        <div
            className={`overflow-hidden rounded-box border-2 border-black bg-white ${className}`}
        >
            <div className="divide-y-2 divide-black">
                {pillars.map((pillar) => {
                    const href =
                        pillar.key === activeKey ? null : pillar.href;

                    return (
                    <div
                        key={pillar.key}
                        className="px-5 py-6 md:grid md:grid-cols-12 md:items-start md:gap-6 md:px-8 md:py-8"
                    >
                        {/* The shape, not the product name — what a creator is
                            actually choosing between. */}
                        <div className="md:col-span-4">
                            <span
                                className="block h-[5px] w-10 rounded-full"
                                style={{ backgroundColor: pillar.accent }}
                            />
                            <h3 className="mt-4 font-gulfs text-xl uppercase leading-[1.05] tracking-tight text-black md:text-2xl">
                                {pillar.name}
                            </h3>
                            <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-black/55 md:text-[12px]">
                                {pillar.shape}
                            </p>
                        </div>

                        <div className="mt-4 md:col-span-5 md:mt-0">
                            <p className="text-sm leading-[1.6] text-black/80 md:text-base">
                                {pillar.line}
                            </p>
                        </div>

                        <div className="mt-4 md:col-span-3 md:mt-0 md:text-right">
                            <p className="text-sm leading-[1.5] text-black/55">
                                {pillar.products}
                            </p>
                            {href && (
                                <Link
                                    href={href}
                                    className="mt-3 inline-flex items-center gap-2 font-gulfs text-[13px] uppercase tracking-[0.12em] text-black underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                                >
                                    See how it works
                                    <ArrowRight size={16} aria-hidden="true" />
                                </Link>
                            )}
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
}
