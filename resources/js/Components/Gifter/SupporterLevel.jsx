import { Link, usePage } from "@inertiajs/react";

/**
 * A supporter's identity on this platform is a CARD, not a dashboard panel.
 *
 * The product already ships that metaphor — ActivateCard, GifterCardVerification,
 * users.gifter_card_verification — so the profile hero is an actual card object:
 * tier foil down the edge, level in a punched disc, member-since and number in the
 * footer. The surface is the house's existing premium black (the Founder banner
 * uses it for the same reason), and the tier colour comes from VipScoreService, so
 * this card, the leaderboard badge and every creator's supporter wall show one
 * person in one colour.
 *
 * ⚠️ NO MONEY IS RENDERED, and the payload carries none — the server strips it.
 * The Level is public (leaderboard, supporter walls); the spend behind it is not.
 * Counts only, which is also the platform rule that supporters rank by purchase
 * count and never by amount.
 */

// Stamps on the card, each stuck on at its own angle. Earned facts only — a
// supporter with none gets no strip rather than an aspirational placeholder.
const STICKER_TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export default function SupporterLevel({ isOwner }) {
    const { gifter_stats: stats, user } = usePage().props;

    if (!stats?.vip) return null;

    const { vip, purchases, creators, member_since } = stats;
    const types = vip.totals?.types || 0;
    const pct = Math.round((vip.progress || 0) * 100);
    const tier = vip.color;

    const stamps = [];
    if (purchases >= 1) stamps.push({ label: "Supporter", mark: "★" });
    if (purchases >= 10) stamps.push({ label: "Regular", mark: "●" });
    if (creators >= 3) stamps.push({ label: "Multi-creator", mark: "◆" });
    if (types >= 3) stamps.push({ label: "Explorer", mark: "✦" });
    if (user?.is_founder) stamps.push({ label: "Founder", mark: "♛" });

    // The facts are not equal weight, so they read as one line rather than four
    // identical tiles: unlocks is the number, the rest is context.
    const facts = purchases
        ? [
              `${purchases} ${purchases === 1 ? "unlock" : "unlocks"}`,
              `${creators} ${creators === 1 ? "creator" : "creators"}`,
              types ? `${types} ${types === 1 ? "kind" : "kinds"}` : null,
          ].filter(Boolean)
        : [];

    // A membership number is real information — it is signup order, not a random
    // ornament — so it is printed the way a card prints one.
    const memberNo = String(user?.id ?? 0).padStart(4, "0");

    return (
        <section aria-label="Supporter card">
            <article className="relative overflow-hidden rounded-box border-2 border-black bg-[#12131A] pb-12 text-white">
                {/* Tier foil — the one place the level's colour is load-bearing */}
                <div
                    className="absolute inset-y-0 left-0 w-2"
                    style={{ background: tier }}
                    aria-hidden="true"
                />

                <div className="relative pl-7 pr-5 pt-5 sm:pl-9 sm:pr-7 sm:pt-6">
                    <div className="flex items-start justify-between gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                            Spenny Piggy · Supporter
                        </span>
                        {!vip.next_level && (
                            <span
                                className="shrink-0 rounded-full border-2 border-black px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-black"
                                style={{ background: tier }}
                            >
                                Top level
                            </span>
                        )}
                    </div>

                    <div className="mt-5 flex items-center gap-4 sm:gap-5">
                        <span
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-black text-3xl leading-none text-black sm:h-[72px] sm:w-[72px] sm:text-[34px]"
                            style={{ background: tier }}
                            aria-hidden="true"
                        >
                            {vip.icon}
                        </span>

                        <div className="min-w-0">
                            <h2 className="font-gulfs text-[38px] uppercase leading-[0.9] tracking-tight sm:text-[52px]">
                                {vip.level}
                            </h2>
                            <p className="mt-1.5 text-[13px] font-semibold text-white/70">
                                {facts.length
                                    ? facts.join(" · ")
                                    : "No unlocks yet"}
                            </p>
                        </div>
                    </div>

                    {vip.next_level && (
                        <div className="mt-6">
                            <div
                                className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Progress to ${vip.next_level}`}
                            >
                                <div
                                    className="h-full rounded-full transition-[width] duration-700"
                                    style={{
                                        width: `${pct}%`,
                                        background: tier,
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
                                {vip.to_next} points to {vip.next_level} · last{" "}
                                {vip.window_days} days
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-white/15 pt-4">
                        <Field label="Member since" value={member_since} />
                        <Field label="No." value={memberNo} mono />
                    </div>
                </div>
            </article>

            {stamps.length > 0 && (
                <ul className="relative z-10 -mt-5 flex flex-wrap gap-2 pl-7 sm:pl-9">
                    {stamps.map((s, i) => (
                        <li
                            key={s.label}
                            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black ${STICKER_TILT[i % STICKER_TILT.length]}`}
                        >
                            <span aria-hidden="true">{s.mark}</span>
                            {s.label}
                        </li>
                    ))}
                </ul>
            )}

            {/* An empty card is an invitation, but only the owner can act on it. */}
            {isOwner && !purchases && (
                <div className="mt-4">
                    <Link
                        href="/creators"
                        className="inline-flex items-center rounded-box-sm border-2 border-black bg-[#FF007F] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        Find creators to support
                    </Link>
                </div>
            )}

            {isOwner && purchases > 0 && vip.next_level && (
                <p className="mt-4 text-[13px] font-semibold leading-relaxed text-gray-600">
                    Unlock content from more creators, and in more ways, to
                    reach {vip.next_level}.
                </p>
            )}
        </section>
    );
}

function Field({ label, value, mono }) {
    return (
        <div>
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/55">
                {label}
            </div>
            <div
                className={`mt-0.5 text-[13px] font-black text-white ${mono ? "tabular-nums" : ""}`}
            >
                {value}
            </div>
        </div>
    );
}
