import { Link } from "@inertiajs/react";
import { useState } from "react";
import { Check, Copy, ExternalLink, Lock, SlidersHorizontal } from "lucide-react";

/**
 * The creator's own Link in Bio, on their dashboard.
 *
 * 🚨 THIS EXISTS BECAUSE THE FEATURE WAS UNFINDABLE. `/bio-links` had exactly
 * ONE route in from anywhere in the app — a row in Account Settings, between
 * other settings rows. It was in no nav, no bottom bar, none of the seven
 * journey steps, no email and no notification. The editor's own file already
 * said so: "the bio page itself shows an 'Edit this page' line, but only to a
 * creator who already knows the URL exists."
 *
 * That became untenable on 20 Aug 2026, when `/creators/link-in-bio` took a
 * top-level header nav slot and its ad page went live: the platform now SELLS
 * this to creators who have not signed up, while the ones who have cannot find
 * it.
 *
 * 🚨 THE COPY BUTTON IS THE POINT, NOT A CONVENIENCE. The whole product is "put
 * this one link in your Instagram bio", so discovery and the primary action are
 * the same gesture — a card that only said "you have a bio page" would send the
 * creator hunting for the link anyway. It is also a repeating job, not a
 * one-off: people change bios, add platforms, and come back for the URL. So the
 * card does not disappear once used, the way the onboarding journey card does.
 *
 * ⚠️ NO STATS HERE, DELIBERATELY. This renders on `/{username}`, which is also
 * the PUBLIC profile — the heaviest page in the app. A view count or an item
 * count is another query on every render of it, and both are already on the
 * editor one tap away. Nothing on this card needs the server.
 *
 * 🚨 THE ARTWORK IS THE PAGE DRAWN AS ITSELF, NOT AN ICON (21 Aug 2026). A 🔗
 * emoji in a tile said "link", which the headline already said; it told a
 * creator nothing about what opens. The same lesson is written up at length in
 * `Components/Promo/cards/BioLinkCard.jsx`, where three schematic attempts
 * (browser chrome, a sitemap connector) all failed and the drawn page won:
 * avatar, handle bar, tappable rows is a shape every creator recognises from
 * every other creator link they have opened. Kept to the sibling cards' 64px
 * column so the row still lines up with "My listings" beside it.
 *
 * ⚠️ The URL is dressed as an ADDRESS BAR — dots, padlock, mono type — because
 * this string's whole job is to be pasted somewhere else. Chrome around it says
 * "this is the thing you copy" without a second label.
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
            className={`rounded-box border border-[#000] bg-white px-4 py-4 ${className}`}
        >
            <div className="flex items-start gap-4">
                {/* The page a supporter lands on, at thumbnail size. */}
                <span
                    aria-hidden="true"
                    className="flex h-[84px] w-16 shrink-0 flex-col gap-1.5 rounded-box-sm border border-[#000] bg-[#E6EA7B] p-1.5"
                >
                    <span className="flex items-center gap-1">
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-[#000] bg-[#FF007F]" />
                        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                            <span className="block h-[3px] w-full rounded-full bg-black/70" />
                            <span className="block h-[3px] w-2/3 rounded-full bg-black/35" />
                        </span>
                    </span>
                    <span className="flex flex-1 flex-col gap-1">
                        <span className="block h-full rounded-[3px] border border-[#000] bg-white" />
                        <span className="block h-full rounded-[3px] border border-[#000] bg-white" />
                        <span className="block h-full rounded-[3px] border border-[#000] bg-[#05EFB8]" />
                    </span>
                </span>

                <div className="min-w-0 flex-1">
                    {/* The same type as "My listings" and the Opportunity card
                        beside it — these are one family of dashboard cards. */}
                    <div className="text-[18px] font-black uppercase text-black md:text-[22px]">
                        Your link in bio
                    </div>
                    <div className="mt-0.5 text-[13px] font-semibold text-gray-600 md:text-[15px]">
                        One link for your bio. It opens everything you sell.
                    </div>

                    {/* Address bar: what gets pasted, dressed as what it is. */}
                    <div className="mt-2.5 flex items-center gap-2 rounded-full border border-[#000] bg-black/[0.04] py-1.5 pl-2.5 pr-3">
                        <span aria-hidden="true" className="hidden shrink-0 items-center gap-1 sm:flex">
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
                        <span className="truncate font-mono text-[13px] text-black md:text-[14px]">
                            {display}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {/* Black on pink — white is 3.78:1 on this fill and fails AA.
                    The confirmed state turns mint rather than growing a tick on
                    the same fill: the colour change is readable from across the
                    card, and nothing on this page is allowed to resize on tap. */}
                <button
                    type="button"
                    onClick={copy}
                    className={`flex min-h-[44px] items-center gap-2 rounded-box-sm border border-[#000] px-4 font-gulfs text-[12px] uppercase tracking-[0.14em] text-black transition-[filter,background-color] duration-200 hover:brightness-110 active:brightness-95 ${
                        copied ? "bg-[#05EFB8]" : "bg-[#FF007F]"
                    }`}
                >
                    {copied ? (
                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                    ) : (
                        <Copy size={14} strokeWidth={2.5} aria-hidden="true" />
                    )}
                    {copied ? "Copied" : "Copy link"}
                </button>

                <Link
                    href="/bio-links"
                    className="flex min-h-[44px] items-center gap-2 rounded-box-sm border border-[#000] bg-white px-4 font-gulfs text-[12px] uppercase tracking-[0.14em] text-black transition-colors duration-200 hover:bg-[#F4F4F5]"
                >
                    <SlidersHorizontal size={14} strokeWidth={2.5} aria-hidden="true" />
                    Choose what it sells
                </Link>

                <a
                    href={bioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] items-center gap-2 rounded-box-sm border border-[#000] bg-white px-4 font-gulfs text-[12px] uppercase tracking-[0.14em] text-black transition-colors duration-200 hover:bg-[#F4F4F5]"
                >
                    <ExternalLink size={14} strokeWidth={2.5} aria-hidden="true" />
                    Preview
                </a>
            </div>

            {/* Screen readers get the confirmation the colour change carries. */}
            <span aria-live="polite" className="sr-only">
                {copied ? "Link copied" : ""}
            </span>
        </div>
    );
}
