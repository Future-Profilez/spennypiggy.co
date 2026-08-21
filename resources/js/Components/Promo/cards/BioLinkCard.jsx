import { CARD_FRAME, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Link in bio — THE PAGE THAT OPENS, DRAWN AS ITSELF.
 *
 * ⚠️ Three attempts failed before this one and each failed the same way: they showed a
 * SCHEMATIC instead of a product. Browser chrome with two rows read as a settings
 * screen; a branching connector from a URL down to four pills read as a sitemap. Neither
 * looked like anything a creator has seen, so neither explained what a link-in-bio page
 * is. This draws the page — handle, address, tappable rows — which is a shape everybody
 * already recognises from every other creator link they have opened.
 *
 * ⚠️ NO EYEBROW. The address names the product better than a label could.
 *
 * ⚠️ THE DESTINATION AND THE LABEL DEPEND ON WHO IS LOOKING, resolved server-side in
 * `PromoBannerService::hrefFor()` / `ctaFor()`: a signed-in creator goes to their OWN
 * page ("See my page"), a visitor to `creators.link-in-bio` ("How it works"). Both used
 * to go to the editor, which put a visitor at a login wall and a creator two clicks from
 * their own link.
 *
 * ⚠️ Rows carry MODULE NAMES ONLY, never prices — a price here would be invented, and
 * this deck already shipped one wrong figure that way.
 */
export default function BioLinkCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);

    const Row = ({ label }) => (
        <div
            className="flex items-center justify-between gap-2 rounded-box-xs px-2.5 py-1.5"
            style={{ border: "2px solid #000", backgroundColor: "#FFFFFF" }}
        >
            <span className="truncate font-CeraGR text-[10px] font-bold text-black md:text-[11px]">
                {label}
            </span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
                <path d="M4 2l4 4-4 4" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );

    /* The page, as a supporter sees it. Light on the card's black so it reads as a
       separate surface rather than as more card. */
    const PageMock = ({ rows, showHandle }) => (
        <div
            className="rounded-box-sm border-black p-2.5"
            style={{ backgroundColor: "#FFF6EC" }}
        >
            {showHandle && (
                <div className="mb-2 flex items-center gap-2">
                    <span
                        className="h-7 w-7 shrink-0 rounded-full md:h-8 md:w-8"
                        style={{ border: "2px solid #000", backgroundColor: accent }}
                    />
                    <span className="min-w-0">
                        <span className="block truncate font-CeraGR text-[11px] font-bold text-black md:text-[12px]">
                            Your name
                        </span>
                        <span className="block truncate font-CeraGR text-[9px] text-black/60 md:text-[10px]">
                            @yourname
                        </span>
                    </span>
                </div>
            )}

            <span
                className="mb-2 block truncate rounded-box-xs px-2 py-1 text-center font-CeraGR text-[10px] font-bold md:text-[11px]"
                style={{ border: "2px solid #000", backgroundColor: accent, color: "#000" }}
            >
                spennypiggy.co/you
            </span>

            <div className="space-y-1.5">
                {rows.map((label) => (
                    <Row key={label} label={label} />
                ))}
            </div>
        </div>
    );

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            {/* ⚠️ `sm:` and up only, at a fixed width — a pixel-width mock inside a card
                narrower than it expects is what broke the install card on a 320px
                handset. On a phone the same mock ships in flow instead, below. */}
            <div className="pointer-events-none absolute right-5 top-1/2 hidden w-[184px] -translate-y-1/2 sm:block md:right-8 md:w-[208px]">
                <PageMock rows={["Shop", "Memberships", "Wishlist"]} showHandle />
            </div>

            <div className="relative flex h-full w-full flex-col px-5 py-5 sm:w-[56%] sm:px-6 sm:py-6 md:px-8 md:py-7">
                <h3 className={`${display("text-[24px] sm:text-[29px] md:text-[36px]")} max-w-[12ch]`} style={{ color: g.ink }}>
                    One link for everything
                </h3>

                <p className="mt-2.5 max-w-[32ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    Paste one address in your bio. It opens everything you sell.
                </p>

                <div className="mt-3 space-y-1.5 sm:hidden" aria-hidden="true">
                    <span
                        className="block truncate rounded-box-xs px-2 py-1 text-center font-CeraGR text-[10px] font-bold"
                        style={{ border: "2px solid #000", backgroundColor: accent, color: "#000" }}
                    >
                        spennypiggy.co/you
                    </span>
                    <Row label="Shop" />
                    <Row label="Memberships" />
                </div>

                <div className="mt-auto pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>
        </article>
    );
}
