import { ROLE_CREATOR, accentFor } from "./constants";

/**
 * The signature element: the page you are signing up to own, assembling itself
 * as you type.
 *
 * Registration is the one screen where a person has been given nothing yet, so
 * the preview is doing real work — it answers "what am I actually making?"
 * before any field is submitted.
 *
 * It is a strip above the form, not a side column: a column had something to
 * show on one step out of five, and sat empty on the rest. Empty slots inside
 * the strip are drawn as waiting outlines rather than hidden, so it reads as a
 * card being built rather than a card that's broken.
 */

const Slot = ({ className = "" }) => (
    <span
        className={`inline-block rounded-full border-2 border-dashed border-black/15 ${className}`}
        aria-hidden="true"
    />
);

export default function PreviewCard({ role, name, username, categories = [] }) {
    const accent = accentFor(role);
    const isCreator = Number(role) === ROLE_CREATOR;
    const initial = (name || username || "").trim().charAt(0).toUpperCase();

    return (
        <figure className="m-0">
            <figcaption className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/60">
                {isCreator ? "Your page" : "Your account"}
            </figcaption>

            <div
                className={`rounded-box border-[3px] border-black bg-white p-4 ${accent.shadow}`}
            >
                <div className="flex items-center gap-3.5">
                    <div
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-[3px] border-black text-xl font-black text-white"
                        style={{ backgroundColor: accent.hex }}
                    >
                        {initial || (
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-6 w-6 opacity-70"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 21a8 8 0 0 1 16 0" />
                            </svg>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        {name ? (
                            <p className="truncate font-gulfs text-lg uppercase leading-tight text-black">
                                {name}
                            </p>
                        ) : (
                            <Slot className="h-4 w-32 align-middle" />
                        )}

                        {username ? (
                            <p
                                className="mt-0.5 truncate text-sm font-semibold"
                                style={{ color: accent.hex }}
                            >
                                {isCreator
                                    ? `spennypiggy.co/${username}`
                                    : `@${username}`}
                            </p>
                        ) : (
                            <Slot className="mt-1.5 h-3 w-24 align-middle" />
                        )}
                    </div>
                </div>

                {isCreator && categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t-2 border-dashed border-black/10 pt-3">
                        {categories.map((c) => (
                            <span
                                key={c}
                                className="rounded-full border-2 border-black bg-[#E6EA7B] px-2.5 py-0.5 text-xs font-semibold text-black"
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </figure>
    );
}
