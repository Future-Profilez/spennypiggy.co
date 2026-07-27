import { Link, usePage } from "@inertiajs/react";
import { Heart, ArrowRight } from "lucide-react";

/**
 * A visitor who has already paid this creator is not a stranger, and the profile
 * shouldn't greet them like one. Reads the viewer's own purchase count from the
 * ledger — never shown to anyone else, and never to the creator about themselves.
 */
export default function ReturningSupporter() {
    const { viewer_support: viewer, user } = usePage().props;

    if (!viewer?.purchases) return null;

    const n = viewer.purchases;

    // The one dark element in this column: this line is about the viewer, not the
    // creator, so it should not read as another content card.
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-box border-2 border-black bg-[#12131A] px-4 py-3.5">
            <p className="flex items-center gap-3 text-[13px] font-semibold text-white/80">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF007F] text-white">
                    <Heart size={16} strokeWidth={2.5} fill="currentColor" />
                </span>
                <span>
                    You&apos;ve unlocked{" "}
                    <span className="font-black text-white">
                        {n} thing{n === 1 ? "" : "s"}
                    </span>{" "}
                    from {user?.name}
                    {viewer.since ? (
                        <span className="text-white/50"> since {viewer.since}</span>
                    ) : null}
                </span>
            </p>

            <Link
                href={route("gifter.hub")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wide text-black transition-colors hover:bg-[#FF007F] hover:text-white"
            >
                View purchases
                <ArrowRight size={12} strokeWidth={3} />
            </Link>
        </div>
    );
}
