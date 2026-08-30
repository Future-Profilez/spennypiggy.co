import { Link } from "@inertiajs/react";
import { useState } from "react";
import { Check, Copy, ExternalLink, Lock, SlidersHorizontal } from "lucide-react";

/**
 * The creator's own Link in Bio — Account Settings and the Edit Profile popup.
 *
 * 🚨 THIS EXISTS BECAUSE THE FEATURE WAS UNFINDABLE. `/bio-links` had exactly
 * ONE route in from anywhere in the app — a plain settings row that said the
 * page existed and nothing else. It was in no nav, no bottom bar, none of the
 * seven journey steps, no email and no notification, while
 * `/creators/link-in-bio` holds a top-level header nav slot advertising the
 * feature to creators who have not signed up yet.
 *
 * ⚠️ MOVED OFF THE DASHBOARD 30 Aug 2026. `/{username}` is also the PUBLIC
 * profile and the heaviest page in the app; a creator's own admin controls
 * belong where the rest of them are. The card now renders in Account Settings
 * (Creator Studio, in place of the old row — a row and a card saying the same
 * thing is a duplicate, not a second door) and inside the Edit Profile popup,
 * beside the profile URL, which is where a creator is already thinking about
 * the links they hand out.
 *
 * 🚨 THE COPY BUTTON IS THE POINT, NOT A CONVENIENCE. The whole product is "put
 * this one link in your Instagram bio", so discovery and the primary action are
 * the same gesture. It is a repeating job, not a one-off — people change bios,
 * add platforms, and come back for the URL — so the card does not disappear
 * once used, the way the onboarding journey card does.
 *
 * ⚠️ COPY LIVES INSIDE THE ADDRESS BAR (30 Aug 2026). It used to sit in a row
 * of three equal-weight outline buttons, where the one action the card exists
 * for looked like the other two. Attached to the string it copies, the target
 * and the action are one object and the hierarchy needs no extra styling.
 *
 * ⚠️ NO STATS HERE, DELIBERATELY. A view count or an item count is another
 * query on every render, and both are already on the editor one tap away.
 * Nothing on this card needs the server.
 *
 * 🚨 THE ARTWORK IS THE PAGE DRAWN AS ITSELF, NOT AN ICON. A 🔗 emoji in a tile
 * said "link", which the headline already said; it told a creator nothing about
 * what opens. The same lesson is written up at length in
 * `Components/Promo/cards/BioLinkCard.jsx`, where three schematic attempts
 * (browser chrome, a sitemap connector) all failed and the drawn page won:
 * avatar, handle bar, tappable rows is a shape every creator recognises from
 * every other creator link they have opened.
 *
 * ⚠️ `border-2 border-[#000]`, never `border-black` — that class is a full
 * `border` shorthand in this project and resets whatever width sits beside it.
 */
export default function BioLinkCard({ username, className = "" }) {
    const [copied, setCopied] = useState(false);

    if (!username) return null;

    /*
     * ⚠️ Built from `window.location.origin`, never a hardcoded host. The same
     * component renders on local, dev and production, and a copied link that
     * silently carries the wrong domain is worse than no button — the creator
     * pastes it into a bio and only finds out when nobody arrives.
     */
    const bioUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/${username}/bio`
            : `/${username}/bio`;

    const display = bioUrl.replace(/^https?:\/\//, "");

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(bioUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* Clipboard blocked (Safari private mode, an insecure origin). The
               address is on screen and selectable either way, so this is a
               degraded button, never a dead end. */
        }
    };

    return (
        <div
            className={`overflow-hidden rounded-box border-2 border-[#000] bg-white ${className}`}
        >
            <div className="flex items-start gap-3 border-b-2 border-[#000] bg-[#E6EA7B]/25 px-4 py-3.5 sm:gap-4">
                {/* The page a supporter lands on, at thumbnail size. */}
                <span
                    aria-hidden="true"
                    className="flex h-[72px] w-[54px] shrink-0 flex-col gap-1.5 rounded-box-sm border-2 border-[#000] bg-[#E6EA7B] p-1.5"
                >
                    <span className="flex items-center gap-1">
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#000] bg-[#FF007F]" />
                        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                            <span className="block h-[3px] w-full rounded-full bg-black/70" />
                            <span className="block h-[3px] w-2/3 rounded-full bg-black/35" />
                        </span>
                    </span>
                    <span className="flex flex-1 flex-col gap-1">
                        <span className="block h-full rounded-[3px] border-2 border-[#000] bg-white" />
                        <span className="block h-full rounded-[3px] border-2 border-[#000] bg-white" />
                        <span className="block h-full rounded-[3px] border-2 border-[#000] bg-[#05EFB8]" />
                    </span>
                </span>

                <div className="min-w-0 flex-1">
                    <div className="font-gulfs text-[14px] uppercase leading-[1.2] tracking-[0.06em] text-black sm:text-[16px]">
                        Your link in bio
                    </div>
                    <p className="mt-1.5 font-poppins text-[12px] font-medium leading-[1.5] text-black/65 sm:text-[13px]">
                        One link for your bio. It opens everything you sell.
                    </p>
                </div>
            </div>

            <div className="px-4 py-3.5">
                {/* Address bar: what gets pasted, dressed as what it is, with the
                    one action the card exists for attached to it. */}
                <div className="flex items-center gap-2 rounded-box-sm border-2 border-[#000] bg-[#F4F4F5] py-1.5 pl-2.5 pr-1.5">
                    <span
                        aria-hidden="true"
                        className="hidden shrink-0 items-center gap-1 sm:flex"
                    >
                        <span className="h-2 w-2 rounded-full border border-[#000] bg-[#FF007F]" />
                        <span className="h-2 w-2 rounded-full border border-[#000] bg-[#E6EA7B]" />
                        <span className="h-2 w-2 rounded-full border border-[#000] bg-[#05EFB8]" />
                    </span>
                    <Lock
                        size={12}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        className="shrink-0 text-black/60"
                    />
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-black sm:text-[13px]">
                        {display}
                    </span>

                    {/* Black on pink — white is 3.78:1 on this fill and fails AA.
                        The confirmed state turns mint rather than growing a tick on
                        the same fill: the colour change is readable from across the
                        card, and nothing here is allowed to resize on tap. */}
                    <button
                        type="button"
                        onClick={copy}
                        aria-label="Copy your link in bio"
                        className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-box-xs border-2 border-[#000] px-2.5 font-gulfs text-[11px] uppercase tracking-[0.12em] text-black transition-[filter,background-color] duration-200 hover:brightness-110 active:brightness-95 sm:px-3 ${
                            copied ? "bg-[#05EFB8]" : "bg-[#FF007F]"
                        }`}
                    >
                        {copied ? (
                            <Check size={13} strokeWidth={3} aria-hidden="true" />
                        ) : (
                            <Copy size={13} strokeWidth={2.5} aria-hidden="true" />
                        )}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                    <Link
                        href="/bio-links"
                        className="flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-box-sm border-2 border-[#000] bg-white px-3 font-gulfs text-[11px] uppercase tracking-[0.12em] text-black transition-colors duration-200 hover:bg-[#F4F4F5]"
                    >
                        <SlidersHorizontal size={14} strokeWidth={2.5} aria-hidden="true" />
                        Choose what it sells
                    </Link>

                    <a
                        href={bioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-box-sm border-2 border-[#000] bg-white px-3 font-gulfs text-[11px] uppercase tracking-[0.12em] text-black transition-colors duration-200 hover:bg-[#F4F4F5]"
                    >
                        <ExternalLink size={14} strokeWidth={2.5} aria-hidden="true" />
                        Preview
                    </a>
                </div>
            </div>

            {/* Screen readers get the confirmation the colour change carries. */}
            <span aria-live="polite" className="sr-only">
                {copied ? "Link copied" : ""}
            </span>
        </div>
    );
}
