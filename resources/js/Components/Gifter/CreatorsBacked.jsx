import { Link, usePage } from "@inertiajs/react";

/**
 * The creators this supporter backs.
 *
 * ⚠️ OWNER ONLY — the server sends `gifter_creators` as null to everyone else,
 * on purpose. Each edge is public from the creator's side, but the collected set
 * is a taste profile the supporter never opted into. The public card carries the
 * count; this carries the names. Do not render it from a payload a visitor gets.
 *
 * Ranked by how often they have bought, which is the same rule the whole
 * platform ranks supporters by — count, never amount.
 */
export default function CreatorsBacked() {
    const { gifter_creators: creators } = usePage().props;

    if (!creators?.length) return null;

    return (
        <section className="rounded-box border border-black/10 bg-white p-4 sm:p-5 md:border-2 md:border-black">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-black">
                    Creators you back
                </h3>
                <span className="text-[11px] font-bold text-gray-500">
                    Only you can see this
                </span>
            </div>

            <ul className="mt-4 flex flex-wrap gap-3">
                {creators.map((c, i) => {
                    const inner = (
                        <>
                            <span className="relative">
                                <img
                                    src={c.avatar}
                                    alt=""
                                    className="!h-12 !w-12 !min-h-0 rounded-full border-2 border-black object-cover"
                                />
                                {c.purchases > 1 && (
                                    <span className="absolute -bottom-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-black bg-[#FF007F] px-1 text-[9px] font-black leading-none text-white">
                                        {c.purchases}
                                    </span>
                                )}
                            </span>
                            <span className="mt-1.5 w-full truncate text-center text-[11px] font-bold text-black">
                                {c.name}
                            </span>
                        </>
                    );

                    const box = "flex w-[72px] flex-col items-center";
                    const title = `${c.name} — ${c.purchases} ${c.purchases === 1 ? "unlock" : "unlocks"}`;

                    return (
                        <li key={c.username || i}>
                            {c.username ? (
                                <Link
                                    href={`/${c.username}`}
                                    title={title}
                                    className={`${box} rounded-box-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black`}
                                >
                                    {inner}
                                </Link>
                            ) : (
                                // Suspended creator: their page is gone, so the
                                // tile stays but does not lead anywhere.
                                <span
                                    className={`${box} opacity-60`}
                                    title={`${title} · account unavailable`}
                                >
                                    {inner}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
