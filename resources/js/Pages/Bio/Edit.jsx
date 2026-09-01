import { Head, router, useForm } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, X } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    BIO_DEFAULT_LAYOUT,
    BIO_DEFAULT_THEME,
    BIO_THEMES,
    bioTheme,
} from "@/constants/bioThemes";

/**
 * The creator's editor for their own `/{username}/bio` page.
 *
 * 🚨 A CREATOR PICKS A PLATFORM AND TYPES A HANDLE — there is no URL field, and
 * adding one reopens two holes at once: the click redirect becomes an open
 * redirect, and a shortened link can be reviewed on Monday and point somewhere
 * else on Tuesday. The server rebuilds every destination from
 * App\Support\BioLinkPlatforms; this form only ever posts a key and a handle.
 *
 * ⚠️ The internal buttons are DERIVED from what the creator actually sells, so
 * they cannot be deleted — only hidden. Removing the row would just bring the
 * button back with its defaults on the next render.
 *
 * 🚨 THE ITEM PICKER SUBMITS A TYPE AND ONE OF THE CREATOR'S OWN LISTING UUIDs,
 * AND NOTHING ELSE. No title, no price, no image — every word and number on a
 * card is read from the live listing when the page renders, so a price edited
 * here can never disagree with the checkout it links to. There is deliberately
 * no free-text field on an item: the listing's own title has already been
 * through `NoExpenseOrBrandName` and the media scan, and a bio page that could
 * rename its own cards would be a new moderated surface.
 *
 * ⚠️ THE ITEM ENDPOINTS ARE WRITTEN AS LITERAL PATHS, NOT `route()`. A named
 * route is invisible to the frontend until `ziggy:generate` runs, and `route()`
 * THROWS for a name it does not carry — inside a handler that surfaces as
 * whatever the catch says rather than as the missing route it is. Vapor
 * regenerates on deploy, so it only bites local and dev, which is where it costs
 * the most time.
 */
export default function BioEdit({
    auth,
    links = [],
    items = [],
    catalogue = [],
    platforms = [],
    bioUrl,
    maxExternal,
    maxItems = 12,
    externalCount = 0,
    stats = null,
    appearance = null,
}) {
    const [copied, setCopied] = useState(false);

    const atLimit = externalCount >= maxExternal;

    const ordered = useMemo(
        () => [...links].sort((a, b) => a.sort_order - b.sort_order),
        [links],
    );

    /*
     * ⚠️ `allOrder` is the FULL uuid list and is what every reorder posts —
     * see `LinkRow`. The two groups below are a view of `ordered`, never a
     * replacement for it.
     */
    const allOrder = useMemo(() => ordered.map((l) => l.uuid), [ordered]);

    const social = useMemo(
        () => ordered.filter((l) => l.kind === "external"),
        [ordered],
    );

    const internal = useMemo(
        () => ordered.filter((l) => l.kind !== "external"),
        [ordered],
    );

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(bioUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard blocked — the address is on screen either way */
        }
    };

    return (
        <AuthenticatedLayout auth={auth} user={auth?.user}>
            <Head title="Your bio page" />

            <div className="min-h-dvh bg-[#FFF6EC] px-4 pb-28 pt-6">
                <div className="mx-auto w-full max-w-[720px]">
                    <header>
                        <p className="font-gulfs text-[11px] uppercase tracking-[0.22em] text-black/55">
                            Link in bio
                        </p>
                        <h1 className="mt-1 font-gulfs text-[28px] uppercase leading-[1.05] tracking-tight text-black">
                            Your bio page
                        </h1>
                        <p className="mt-2 max-w-[52ch] font-poppins text-[14px] leading-[1.6] text-black/65">
                            One link for your Instagram or TikTok bio. Put your
                            content first, then wherever else you post.
                        </p>
                    </header>

                    <section className="mt-5 rounded-box border-2 border-[#000] bg-white p-4">
                        <p className="break-all font-poppins text-[13px] leading-[1.55] text-black/70">
                            {bioUrl}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={copyLink}
                                className="min-h-[44px] rounded-box-sm bg-[#FF007F] px-4 font-gulfs text-[12px] uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                            >
                                {copied ? "Copied" : "Copy link"}
                            </button>
                            <a
                                href={bioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-h-[44px] items-center rounded-box-sm border-2 border-[#000] px-4 font-gulfs text-[12px] uppercase tracking-[0.14em] text-black transition-opacity duration-200 hover:opacity-70"
                            >
                                Preview
                            </a>
                        </div>

                        {stats ? (
                            <p className="mt-3 font-poppins text-[12px] leading-[1.5] text-black/50">
                                {stats.views}{" "}
                                {stats.views === 1 ? "view" : "views"} so far
                            </p>
                        ) : null}
                    </section>

                    {/*
                        🚨 What you SELL comes before what you LINK TO, in the
                        editor as on the page. The cards are the reason to switch
                        to this link; the buttons are what every other
                        link-in-bio already does.
                    */}
                    <ItemsSection
                        items={items}
                        catalogue={catalogue}
                        maxItems={maxItems}
                    />

                    <AppearanceSection
                        appearance={appearance}
                        bioUrl={bioUrl}
                    />

                    {/* 🚨 TWO GROUPS, BECAUSE THE PAGE HAS TWO GROUPS. A social
                        account and a Spenny Piggy page are different things that
                        behave differently — one leaves the site and the creator
                        adds and deletes it, the other appears by itself when a
                        listing is published and can only be hidden. The public
                        page has always drawn them apart (social as chips in the
                        header, pages as tiles below); the editor listed all of
                        them in one column called "Your buttons", so the creator
                        was managing two unlike things in one undifferentiated
                        list and could not tell which ones they were even allowed
                        to remove. */}
                    <LinkGroupSection
                        title="Social accounts"
                        note="These sit at the top of your page. They send people to your other profiles."
                        links={social}
                        allOrder={allOrder}
                        ordered={ordered}
                        empty="No social accounts yet. Add the ones you post on."
                    >
                        <AddLink platforms={platforms} atLimit={atLimit} />
                    </LinkGroupSection>

                    <LinkGroupSection
                        title="Your Spenny Piggy pages"
                        note="Added for you when you publish something. Hide any you do not want shown."
                        links={internal}
                        allOrder={allOrder}
                        ordered={ordered}
                        empty="Once you publish something to sell, its button appears here automatically."
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/**
 * One titled group of link rows.
 *
 * ⚠️ Up/down move a row within ITS OWN group. `index` is the row's position in
 * the full ordered list and the neighbours are resolved against that same list,
 * so the array posted to the server stays complete — see `LinkRow`.
 */
/**
 * The page's look — a curated theme set plus a list/grid choice for the
 * sellable cards. Answers the last open clause of the link-in-bio ad page's
 * section 6: "choose what it looks like".
 *
 * 🚨 PRESETS ONLY, NO COLOUR PICKER. Every theme's text/ground pairs were
 * contrast-checked at design time (tests/javascript/bioThemes.test.js) — a free
 * picker cannot promise that, and pink-on-pink failing AA is the documented
 * house example. The server refuses any key outside App\Support\BioAppearance.
 *
 * ⚠️ TWO FLOWS, ONE STATE. At md+ the controls sit beside an inline preview of
 * the real page. On a PHONE there is no room for both: the controls own the
 * screen, and an IN-FLOW "Preview your page" button under the swatches opens a
 * full-screen sheet carrying the same preview PLUS a compact theme/layout strip
 * — so the creator switches looks while seeing the whole page.
 *
 * 🚨 NOTHING ON THIS SCREEN FLOATS (client direction, 31 Aug 2026). A fixed
 * pill was tried and rejected: the bottom bar is `z-index: 999999` and the
 * Intercom launcher higher still, so anything fixed near the foot of a phone
 * screen ends up under one of them — the same class of cut-off the creator
 * subscription flow was reported for. Buttons live in the flow, and the sheet
 * PADS for the bar rather than pretending it is not there.
 *
 * ⚠️ Saves POST the pair the creator changed; the server writes only what was
 * sent (`sometimes`). The DEFAULT is stored as null.
 *
 * ⚠️ Literal path, not route() — the ziggy trap documented at the top of this
 * file.
 */
function AppearanceSection({ appearance, bioUrl }) {
    const [theme, setTheme] = useState(appearance?.theme || BIO_DEFAULT_THEME);
    const [layout, setLayout] = useState(
        appearance?.item_layout || BIO_DEFAULT_LAYOUT,
    );
    const [saving, setSaving] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);

    const save = (nextTheme, nextLayout) => {
        setSaving(true);
        router.post(
            "/bio-links/appearance",
            {
                theme: nextTheme === BIO_DEFAULT_THEME ? null : nextTheme,
                item_layout:
                    nextLayout === BIO_DEFAULT_LAYOUT ? null : nextLayout,
            },
            {
                preserveScroll: true,
                /*
                 * 🚨 `preserveState`, and it is not optional here. Inertia
                 * defaults it to FALSE on a POST, which remounts this component
                 * — the preview's device toggle, the open sheet and every other
                 * open control on this editor would reset on every swatch tap.
                 * The pick is already applied optimistically and the server
                 * answers with the same value, so nothing needs re-reading.
                 */
                preserveState: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    const pickTheme = (key) => {
        setTheme(key);
        save(key, layout);
    };

    const pickLayout = (key) => {
        setLayout(key);
        save(theme, key);
    };

    const controls = (
        <>
            <p className="font-gulfs text-[10px] uppercase tracking-[0.18em] text-black/45">
                Theme
            </p>

            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-3 lg:grid-cols-5">
                {Object.keys(BIO_THEMES).map((key) => (
                    <ThemeSwatch
                        key={key}
                        themeKey={key}
                        selected={theme === key}
                        onPick={pickTheme}
                    />
                ))}
            </div>

            <p className="mt-4 font-gulfs text-[10px] uppercase tracking-[0.18em] text-black/45">
                Items you sell
            </p>

            <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-[320px]">
                <LayoutSwatch
                    layoutKey="list"
                    label="List"
                    selected={layout === "list"}
                    onPick={pickLayout}
                />
                <LayoutSwatch
                    layoutKey="grid"
                    label="Grid"
                    selected={layout === "grid"}
                    onPick={pickLayout}
                />
            </div>
        </>
    );

    return (
        <section className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-gulfs text-[15px] uppercase tracking-tight text-black">
                    Appearance
                </h2>
                {saving ? (
                    <span className="font-poppins text-[11px] text-black/45">
                        Saving…
                    </span>
                ) : null}
            </div>
            <p className="mt-1 font-poppins text-[12.5px] leading-[1.5] text-black/55">
                How your public page looks. Changes are live as soon as you pick
                one.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="min-w-0 rounded-box border-2 border-[#000] bg-white p-4">
                    {controls}

                    {/* On a phone the preview is the sheet; the pill opens it. */}
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-box-sm border border-[#000] bg-[#FF007F] px-4 font-gulfs text-[11px] uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 md:hidden"
                    >
                        <Eye size={15} strokeWidth={2.5} aria-hidden="true" />
                        Preview your page
                    </button>

                    <a
                        href={bioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 ml-2 inline-flex min-h-[44px] items-center rounded-box-sm border border-[#000] px-3 font-gulfs text-[11px] uppercase tracking-[0.14em] text-black transition-opacity duration-200 hover:opacity-70 md:ml-0"
                    >
                        Open your real page
                    </a>
                </div>

                {/* md+: the real page beside the controls. */}
                <div className="hidden min-w-0 rounded-box border-2 border-[#000] bg-white p-3 md:block md:self-start">
                    <PreviewFrame theme={theme} layout={layout} bioUrl={bioUrl} />
                    <p className="mt-2 font-poppins text-[10.5px] leading-[1.5] text-black/45">
                        Your real page in the selected look — scroll to see all
                        of it. It saves the moment you pick.
                    </p>
                </div>
            </div>

            {sheetOpen ? (
                <PreviewSheet
                    theme={theme}
                    layout={layout}
                    bioUrl={bioUrl}
                    saving={saving}
                    onPickTheme={pickTheme}
                    onPickLayout={pickLayout}
                    onClose={() => setSheetOpen(false)}
                />
            ) : null}
        </section>
    );
}

/**
 * The phone's preview — a full-screen sheet: the real page filling the screen,
 * a device toggle, and a compact theme/layout strip along the foot so a look
 * can be switched while the whole page is in view.
 *
 * 🚨 THE STRIP IS AT THE TOP, UNDER THE HEADER BAR, NOT AT THE FOOT. The
 * bottom bar (`z-index: 999999`) and the Intercom launcher both sit over the
 * foot of the screen, and a strip placed there was cut in half on a real
 * phone. Nothing floats over the top edge, so that is where the controls go.
 * The sheet also pads its bottom by the bar's height (`--sp-bottombar-h`, the
 * one definition) plus the safe-area inset, so the last of the page is never
 * hidden under the bar either.
 *
 * ⚠️ `z-[1000]` clears the fixed header (100); the bar stays visible beneath
 * on purpose — hiding navigation inside a preview is the wrong trade. Body
 * scroll is locked while open and Escape closes it. The frame gets the full
 * remaining height (`fill`).
 */
function PreviewSheet({
    theme,
    layout,
    bioUrl,
    saving,
    onPickTheme,
    onPickLayout,
    onClose,
}) {
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Preview of your bio page"
            className="fixed inset-0 z-[1000] flex flex-col bg-[#FFF6EC] md:hidden"
            style={{
                paddingTop: "env(safe-area-inset-top, 0px)",
                paddingBottom:
                    "calc(var(--sp-bottombar-h, 69px) + env(safe-area-inset-bottom, 0px))",
            }}
        >
            <div
                className="flex shrink-0 items-center justify-between gap-2 bg-white px-3 py-2"
                style={{ borderBottom: "2px solid #000" }}
            >
                <p className="font-gulfs text-[11px] uppercase tracking-[0.18em] text-black">
                    Live preview
                    {saving ? (
                        <span className="ml-2 font-poppins normal-case tracking-normal text-black/45">
                            Saving…
                        </span>
                    ) : null}
                </p>

                <button
                    type="button"
                    onClick={onClose}
                    autoFocus
                    aria-label="Close preview"
                    className="flex h-10 w-10 items-center justify-center rounded-box-xs border border-[#000] bg-white text-black transition-opacity duration-200 hover:opacity-70"
                >
                    <X size={18} strokeWidth={2.5} />
                </button>
            </div>

            {/*
                The strip: the same swatches as the editor, compact, in one
                horizontal row — the creator's thumb stays on the strip while the
                page above answers each tap.
            */}
            <div
                className="shrink-0 bg-white px-3 pb-2 pt-2"
                style={{ borderBottom: "2px solid #000" }}
            >
                <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                    {Object.keys(BIO_THEMES).map((key) => (
                        <div key={key} className="w-[84px] shrink-0">
                            <ThemeSwatch
                                themeKey={key}
                                selected={theme === key}
                                onPick={onPickTheme}
                            />
                        </div>
                    ))}
                    <div
                        className="mx-1 w-px shrink-0 self-stretch bg-black/20"
                        aria-hidden="true"
                    />
                    <div className="w-[84px] shrink-0">
                        <LayoutSwatch
                            layoutKey="list"
                            label="List"
                            selected={layout === "list"}
                            onPick={onPickLayout}
                        />
                    </div>
                    <div className="w-[84px] shrink-0">
                        <LayoutSwatch
                            layoutKey="grid"
                            label="Grid"
                            selected={layout === "grid"}
                            onPick={onPickLayout}
                        />
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 pt-2">
                <PreviewFrame theme={theme} layout={layout} bioUrl={bioUrl} fill />
            </div>

        </div>
    );
}

// `height` is only the STARTING guess for the virtual document; the real
// height is measured off the loaded page (same origin) so a creator with
// twenty items does not see their page cut off — see `measureDoc`.
const PREVIEW_DEVICES = {
    mobile: { label: "Mobile", width: 390, height: 1400 },
    desktop: { label: "Desktop", width: 1280, height: 1200 },
};

/**
 * The live preview — the creator's REAL bio page, in an iframe, restyled by
 * the pick before it is saved. Shared by the inline md+ panel and the phone
 * sheet.
 *
 * 🚨 IT IS THE REAL PAGE, NOT A MOCK. `?preview_theme=&preview_layout=` are
 * honoured by BioPageController for the OWNER only, so the frame shows the
 * creator's own items, links and photos exactly as a visitor will see them —
 * a replica component here would drift from Show.jsx the first time that file
 * changed. The bio page mounts no app layout, so the frame is cheap.
 *
 * ⚠️ Mobile and desktop are the SAME page at two real widths, scaled to fit
 * the box — media-query behaviour inside an iframe keys off the IFRAME's
 * width (the documented width-sweep device), which is what makes the toggle
 * honest.
 */
function PreviewFrame({ theme, layout, bioUrl, fill = false }) {
    const [device, setDevice] = useState("mobile");
    const [frameWidth, setFrameWidth] = useState(0);
    const [docHeight, setDocHeight] = useState(null);
    const boxRef = useRef(null);
    const frameRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
        // ⚠️ clientWidth, not offsetWidth: this box scrolls, so offsetWidth
        // includes the scrollbar gutter and the frame would be scaled a few
        // pixels wider than the space it is actually shown in.
        const measure = () => {
            if (boxRef.current) setFrameWidth(boxRef.current.clientWidth);
        };
        measure();
        window.addEventListener("resize", measure);

        return () => window.removeEventListener("resize", measure);
    }, []);

    // ⚠️ Forget the measured height when the frame is replaced, or a tall
    // mobile page keeps its height for a beat after switching to Desktop.
    useEffect(() => {
        setDocHeight(null);

        return () => observerRef.current?.disconnect();
    }, [device, theme, layout]);

    const d = PREVIEW_DEVICES[device];
    const scale = frameWidth > 0 ? Math.min(frameWidth / d.width, 1) : 1;
    const height = docHeight || d.height;

    /*
     * 🚨 THE PAGE IS AS TALL AS IT IS. A fixed frame height truncates a creator
     * with twenty items — and `scrolling="no"` makes the cut SILENT, so the
     * preview would be wrong for exactly the creators who sell most. The frame
     * is same-origin, so its real height can be read.
     *
     * ⚠️ Measured on load AND on every later resize: the bio page is a React
     * app, so the document at `load` is usually the shell rather than the
     * finished page. Wrapped — a document that is blocked or already gone must
     * fall back to the starting guess, never throw inside the editor.
     */
    const measureDoc = () => {
        try {
            const doc = frameRef.current?.contentDocument;
            const body = doc?.body;

            if (!body) return;

            const read = () => {
                const h = Math.max(
                    body.scrollHeight,
                    doc.documentElement?.scrollHeight || 0,
                );

                if (h > 0) setDocHeight(h);
            };

            read();

            // One observer at a time: a new frame is mounted per pick, and the
            // old one's document is gone.
            observerRef.current?.disconnect();
            observerRef.current = new ResizeObserver(read);
            observerRef.current.observe(body);
        } catch {
            // Cross-origin or a torn-down document: keep the fallback height.
        }
    };

    const src =
        bioUrl +
        (bioUrl.includes("?") ? "&" : "?") +
        "preview_theme=" +
        encodeURIComponent(theme) +
        "&preview_layout=" +
        encodeURIComponent(layout);

    const scaledW = Math.round(d.width * scale);
    const scaledH = Math.round(height * scale);

    return (
        <div className={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
            <div className="flex shrink-0 items-center justify-between gap-2">
                <p className="font-gulfs text-[10px] uppercase tracking-[0.18em] text-black/45">
                    {fill ? "Shown as" : "Live preview"}
                </p>

                <div className="flex gap-1">
                    {Object.entries(PREVIEW_DEVICES).map(([key, dev]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setDevice(key)}
                            aria-pressed={device === key}
                            className={[
                                "rounded-box-xs border px-2 py-1 font-gulfs text-[9px] uppercase tracking-[0.14em]",
                                "transition-[filter] duration-200 hover:brightness-[1.05] active:brightness-95",
                                device === key
                                    ? "border-[#000] bg-[#FF007F] text-black"
                                    : "border-[#000] bg-white text-black/60",
                            ].join(" ")}
                        >
                            {dev.label}
                        </button>
                    ))}
                </div>
            </div>

            {/*
                The WRAPPER scrolls and the frame is inert (pointer-events none):
                a creator pans the whole page by touch without a tap inside it
                navigating the frame off to a checkout.

                🚨 A `transform: scale()` CHANGES NOTHING ABOUT LAYOUT. The
                iframe still occupied its full 390/1280px in the flow, and a grid
                item's `min-width: auto` let that widen the column past the
                viewport — on a phone the whole editor bled off the right edge.
                The frame is therefore ABSOLUTE inside a box sized to its SCALED
                dimensions, so what the layout sees is exactly what is drawn.
            */}
            <div
                ref={boxRef}
                className={[
                    "mt-2 w-full max-w-full overflow-y-auto overflow-x-hidden overscroll-contain rounded-box-sm border border-[#000] bg-[#FFF6EC]",
                    fill ? "min-h-0 flex-1" : "max-h-[640px]",
                ].join(" ")}
            >
                <div
                    className="relative mx-auto overflow-hidden"
                    style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
                >
                    {frameWidth > 0 ? (
                        <iframe
                            // A NEW element per pick rather than re-pointing `src`:
                            // navigating an existing iframe pushes an entry into
                            // the PARENT's history, so five theme taps would cost
                            // the creator five presses of Back to leave the editor.
                            key={src + device}
                            ref={frameRef}
                            onLoad={measureDoc}
                            src={src}
                            title="Preview of your bio page"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: `${d.width}px`,
                                height: `${height}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: "top left",
                                border: "0",
                                pointerEvents: "none",
                            }}
                            scrolling="no"
                            loading="lazy"
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function ThemeSwatch({ themeKey, selected, onPick }) {
    const t = bioTheme(themeKey);

    return (
        <button
            type="button"
            onClick={() => onPick(themeKey)}
            aria-pressed={selected}
            className={[
                "w-full overflow-hidden rounded-box-sm border-2 text-left",
                "transition-[filter] duration-200 hover:brightness-[1.04] active:brightness-95",
                selected ? "border-[#FF007F]" : "border-[#000]",
            ].join(" ")}
        >
            {/* A mini page: ground, a white card, a CTA bar in the theme's own accent. */}
            <span
                aria-hidden="true"
                className="block h-[52px] w-full p-1.5"
                style={{ backgroundColor: t.ground }}
            >
                <span className="block h-[14px] w-full rounded-[4px] border border-[#000] bg-white" />
                <span className="mt-1 block h-[14px] w-full rounded-[4px] border border-[#000] bg-white" />
                <span
                    className="mt-1 block h-[8px] w-3/5 rounded-[3px] border border-[#000]"
                    style={{ backgroundColor: t.cta }}
                />
            </span>
            <span
                className={[
                    "block border-t px-2 py-1 font-gulfs text-[9px] uppercase tracking-[0.14em]",
                    selected
                        ? "border-[#FF007F] bg-[#FF007F] text-black"
                        : "border-[#000] bg-white text-black/70",
                ].join(" ")}
            >
                {t.label}
            </span>
        </button>
    );
}

function LayoutSwatch({ layoutKey, label, selected, onPick }) {
    return (
        <button
            type="button"
            onClick={() => onPick(layoutKey)}
            aria-pressed={selected}
            className={[
                "w-full overflow-hidden rounded-box-sm border-2 text-left",
                "transition-[filter] duration-200 hover:brightness-[1.04] active:brightness-95",
                selected ? "border-[#FF007F]" : "border-[#000]",
            ].join(" ")}
        >
            <span
                aria-hidden="true"
                className="block h-[52px] w-full bg-[#FFF6EC] p-1.5"
            >
                {layoutKey === "list" ? (
                    <>
                        <span className="block h-[13px] w-full rounded-[4px] border border-[#000] bg-white" />
                        <span className="mt-1 block h-[13px] w-full rounded-[4px] border border-[#000] bg-white" />
                        <span className="mt-1 block h-[13px] w-full rounded-[4px] border border-[#000] bg-white" />
                    </>
                ) : (
                    <span className="grid h-full grid-cols-2 gap-1">
                        <span className="block rounded-[4px] border border-[#000] bg-white" />
                        <span className="block rounded-[4px] border border-[#000] bg-white" />
                        <span className="block rounded-[4px] border border-[#000] bg-white" />
                        <span className="block rounded-[4px] border border-[#000] bg-white" />
                    </span>
                )}
            </span>
            <span
                className={[
                    "block border-t px-2 py-1 font-gulfs text-[9px] uppercase tracking-[0.14em]",
                    selected
                        ? "border-[#FF007F] bg-[#FF007F] text-black"
                        : "border-[#000] bg-white text-black/70",
                ].join(" ")}
            >
                {label}
            </span>
        </button>
    );
}

function LinkGroupSection({
    title,
    note,
    links,
    ordered,
    allOrder,
    empty,
    children,
}) {
    return (
        <section className="mt-6">
            <h2 className="font-gulfs text-[13px] uppercase tracking-[0.18em] text-black/70">
                {title}
            </h2>
            <p className="mt-1 max-w-[52ch] font-poppins text-[13px] leading-[1.6] text-black/60">
                {note}
            </p>

            {children}

            {links.length > 0 ? (
                <div className="mt-3 flex flex-col gap-3">
                    {links.map((link, i) => (
                        <LinkRow
                            key={
                                link.uuid || `${link.kind}-${link.target_type}`
                            }
                            link={link}
                            index={ordered.indexOf(link)}
                            prevIndex={
                                i > 0 ? ordered.indexOf(links[i - 1]) : null
                            }
                            nextIndex={
                                i < links.length - 1
                                    ? ordered.indexOf(links[i + 1])
                                    : null
                            }
                            order={allOrder}
                        />
                    ))}
                </div>
            ) : (
                <p className="mt-3 rounded-box-sm border-2 border-dashed border-black/25 px-4 py-6 text-center font-poppins text-[13px] leading-[1.6] text-black/55">
                    {empty}
                </p>
            )}
        </section>
    );
}

/** ⚠️ The LISTED price, formatted — never calculated. See `Bio/Show.jsx`. */
const money = (value, currency) =>
    new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: (currency || "GBP").toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

/**
 * "What you sell" — the item selection and its order.
 *
 * ⚠️ The picker offers the creator's LIVE listings only, straight from
 * `CatalogueService` (the My Listings screen's own list, not a second one). A
 * scheduled or in-review listing is deliberately absent: a card a supporter
 * cannot buy is not a card, and the creator adds it here the day it goes live.
 */
function ItemsSection({ items, catalogue, maxItems }) {
    const ordered = useMemo(
        () => [...items].sort((a, b) => a.sort_order - b.sort_order),
        [items],
    );

    // A listing already on the page is not offered again — re-adding it would
    // only reactivate the row it already has, which reads as nothing happening.
    const chosen = useMemo(
        () => new Set(ordered.map((i) => i.catalogue_key)),
        [ordered],
    );

    const available = useMemo(
        () => (catalogue || []).filter((row) => !chosen.has(row.key)),
        [catalogue, chosen],
    );

    const atLimit = ordered.length >= maxItems;

    return (
        <section className="mt-6">
            <h2 className="font-gulfs text-[13px] uppercase tracking-[0.18em] text-black/70">
                What you sell
            </h2>
            <p className="mt-1 max-w-[52ch] font-poppins text-[13px] leading-[1.6] text-black/60">
                Shown below exactly as your supporters see them. Tapping one
                takes them straight to its checkout.
            </p>

            <AddItem
                available={available}
                atLimit={atLimit}
                maxItems={maxItems}
            />

            {/* 🚨 ONE SURFACE WITH HAIRLINES BETWEEN ROWS — the same shape
                `Bio/Show.jsx`'s `ItemList` draws, on the same `#FFF6EC` ground,
                because a creator editing a list of admin rows cannot tell what
                their page will look like. Each row below is the supporter's view
                with its controls attached underneath, so "what it is" and "what
                I can do to it" are two different bands rather than one hybrid.

                ⚠️ MIRRORS `Bio/Show.jsx` — 76px thumbnail, 9px type eyebrow,
                14.5px title, 14px price, black-on-pink CTA. Change one, change
                the other, or the editor starts lying about the page. */}
            {ordered.length > 0 ? (
                <div className="mt-3 overflow-hidden rounded-box border border-[#000] bg-white">
                    {ordered.map((item, index) => (
                        <ItemRow
                            key={item.uuid}
                            item={item}
                            index={index}
                            total={ordered.length}
                            first={index === 0}
                            order={ordered.map((i) => i.uuid)}
                        />
                    ))}
                </div>
            ) : null}

            {ordered.length === 0 ? (
                <p className="mt-3 rounded-box-sm border-2 border-dashed border-black/25 px-4 py-6 text-center font-poppins text-[13px] leading-[1.6] text-black/55">
                    Nothing chosen yet. Pick the things you most want people to
                    buy — they go first, above every link.
                </p>
            ) : null}
        </section>
    );
}

/**
 * ⚠️ A LIST OF THE CREATOR'S OWN LISTINGS, NOT A DROPDOWN.
 *
 * This was a `<select>` whose options read
 * "Sell Exclusive Content — Summer set (£9.99)" — three different kinds of
 * information run together into one string, with the listing's own picture
 * nowhere on the screen. A creator with a dozen live listings was choosing from
 * memory. Each row is now a card carrying the thumbnail they already recognise,
 * and adding is ONE tap rather than open-dropdown → scroll → pick → submit.
 *
 * ⚠️ `busyKey`, not a shared `busy` — with one flag every card in the list
 * greyed out while any one of them was being added, which reads as the page
 * having frozen.
 */
function AddItem({ available, atLimit, maxItems }) {
    const [busyKey, setBusyKey] = useState(null);

    const add = (row) => {
        if (busyKey) return;

        setBusyKey(row.key);
        router.post(
            // ⚠️ Literal path, not `route()` — see this file's docblock.
            "/bio-links/items",
            { type: row.type, uuid: row.uuid },
            {
                preserveScroll: true,
                onFinish: () => setBusyKey(null),
            },
        );
    };

    if (atLimit) {
        return (
            <p className="mt-3 rounded-box-sm border-2 border-[#000] bg-white px-4 py-3 font-poppins text-[13px] leading-[1.6] text-black/60">
                You are showing the maximum of {maxItems} items. Remove one to
                add another.
            </p>
        );
    }

    if (available.length === 0) {
        return (
            <p className="mt-3 rounded-box-sm border-2 border-dashed border-black/25 px-4 py-4 font-poppins text-[13px] leading-[1.6] text-black/55">
                Everything you have live is already on your page.
            </p>
        );
    }

    return (
        <div className="mt-3 rounded-box border-2 border-[#000] bg-white p-4">
            <p className="font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60">
                Add an item
            </p>

            {/* Scrolls at about six rows rather than growing the page — a
                creator with thirty live listings should not have to scroll past
                all of them to reach the buttons below. */}
            <div className="-mx-1 mt-2 max-h-[336px] overflow-y-auto px-1">
                <ul className="flex flex-col gap-2">
                    {available.map((row) => {
                        const adding = busyKey === row.key;

                        return (
                            <li key={row.key}>
                                <button
                                    type="button"
                                    onClick={() => add(row)}
                                    disabled={adding}
                                    className="flex w-full min-h-[56px] items-center gap-3 rounded-box-sm border-2 border-[#000] bg-white p-2 text-left transition-colors duration-200 hover:bg-[#F4F4F5] disabled:opacity-50"
                                >
                                    {row.thumbnail ? (
                                        <img
                                            src={row.thumbnail}
                                            alt=""
                                            loading="lazy"
                                            className="h-12 w-12 shrink-0 rounded-box-xs border-2 border-[#000] object-cover"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="h-12 w-12 shrink-0 rounded-box-xs border-2 border-dashed border-black/25"
                                        />
                                    )}

                                    <span className="min-w-0 flex-1">
                                        <span className="block font-gulfs text-[10px] uppercase tracking-[0.16em] text-black/50">
                                            {row.type_label}
                                        </span>
                                        <span className="block truncate font-poppins text-[14px] leading-[1.4] text-black">
                                            {row.title}
                                        </span>
                                    </span>

                                    {row.price !== null &&
                                    row.price !== undefined ? (
                                        <span className="shrink-0 whitespace-nowrap font-poppins text-[13px] tabular-nums text-black/70">
                                            {money(row.price, row.currency)}
                                        </span>
                                    ) : null}

                                    {/* ⚠️ BLACK ON PINK, never pink on white.
                                        Brand pink against white measures 3.78:1
                                        — under AA at any label size — so the
                                        accent goes on the ground and the type
                                        stays black, which is the house rule for
                                        every pink fill in both apps. */}
                                    <span className="shrink-0 whitespace-nowrap rounded-box-xs bg-[#FF007F] px-2 py-1 font-gulfs text-[11px] uppercase tracking-[0.14em] text-black">
                                        {adding ? "Adding…" : "Add"}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

function ItemRow({ item, index, total, first, order }) {
    const [busy, setBusy] = useState(false);

    const move = (direction) => {
        if (busy) return;

        const next = [...order];
        const target = index + direction;

        if (target < 0 || target >= total) return;

        [next[index], next[target]] = [next[target], next[index]];

        setBusy(true);
        router.post(
            "/bio-links/items/reorder",
            { order: next },
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    };

    const toggle = () => {
        if (busy) return;
        setBusy(true);
        router.post(
            `/bio-links/items/${item.uuid}`,
            { is_active: !item.is_active },
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    };

    const remove = () => {
        if (busy) return;
        setBusy(true);
        router.post(
            `/bio-links/items/${item.uuid}/remove`,
            {},
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    };

    const hidden = !item.is_active;
    const priced = item.price !== null && item.price !== undefined;
    const hasProgress = item.percent !== null && item.percent !== undefined;

    return (
        <div className={first ? "" : "border-t border-[#000]"}>
            {/* ── The supporter's view, drawn as `Bio/Show.jsx` draws it ───── */}
            <div
                className={[
                    "flex items-center gap-3.5 p-3",
                    hidden ? "text-black/35" : "text-black",
                ].join(" ")}
            >
                <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-box-sm border border-[#000] bg-[#FFF6EC]">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center px-1 text-center font-gulfs text-[8px] uppercase leading-[1.3] tracking-[0.14em] text-black/30">
                            {item.type_label}
                        </span>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-gulfs text-[9px] uppercase tracking-[0.18em] text-black/35">
                        {item.type_label}
                    </span>

                    <p className="mt-1 line-clamp-2 font-poppins text-[14.5px] font-semibold leading-[1.3]">
                        {item.title}
                    </p>

                    {priced ? (
                        <p className="mt-0.5 font-poppins text-[14px] font-bold leading-[1.3] tabular-nums">
                            {money(item.price, item.currency)}
                            {item.price_note ? (
                                <span className="font-normal text-black/45">
                                    {" "}
                                    {item.price_note}
                                </span>
                            ) : null}
                        </p>
                    ) : null}

                    {/* A pot has no price — it shows progress. A null bar is
                        omitted rather than drawn at 0: "no goal set" and "nobody
                        has bought yet" are different things. */}
                    {hasProgress ? (
                        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-box-xs border border-[#000] bg-white">
                            <div
                                className="h-full bg-[#A2E4B8]"
                                style={{ width: `${item.percent}%` }}
                            />
                        </div>
                    ) : null}
                </div>

                {/* ⚠️ Black on pink, never white — the house rule for every pink
                    fill in both apps. A hidden row wears the page's own hidden
                    treatment so the creator can see what hiding actually does
                    rather than being told it in a label. */}
                <span
                    className={[
                        "flex shrink-0 items-center self-center rounded-box-sm px-3.5 py-2.5",
                        "font-gulfs text-[10.5px] uppercase tracking-[0.14em]",
                        hidden
                            ? "border border-black/25 bg-black/[0.04] text-black/40"
                            : "border border-[#000] bg-[#FF007F] text-black",
                    ].join(" ")}
                >
                    {hidden ? "Hidden" : item.cta}
                </span>
            </div>

            {/* ── What you can do to it. A separate band on a tinted ground, so
                the controls never read as part of the card a supporter sees. ── */}
            <div className="flex flex-wrap items-center gap-2 border-t border-black/10 bg-black/[0.02] px-3 py-2">
                <IconButton
                    onClick={() => move(-1)}
                    disabled={index === 0}
                    label="Move up"
                >
                    ↑
                </IconButton>
                <IconButton
                    onClick={() => move(1)}
                    disabled={index === total - 1}
                    label="Move down"
                >
                    ↓
                </IconButton>

                <RowAction onClick={toggle} disabled={busy}>
                    {item.is_active ? "Hide" : "Show"}
                </RowAction>
                {/* ⚠️ A selection IS removable, unlike a derived link button —
                    it is the creator's own choice. The listing is untouched. */}
                <RowAction onClick={remove} disabled={busy} tone="danger">
                    Remove
                </RowAction>

                {item.clicks > 0 ? (
                    <span className="ml-auto font-poppins text-[12px] leading-[1.5] tabular-nums text-black/45">
                        {item.clicks} taps
                    </span>
                ) : null}
            </div>
        </div>
    );
}

function AddLink({ platforms, atLimit }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        platform: platforms[0]?.key || "",
        handle: "",
        label: "",
    });

    const current = platforms.find((p) => p.key === data.platform);

    /*
     * ⚠️ Mirrors `BioLinkPlatforms::normaliseHandle` closely enough to preview,
     * and deliberately no closer. It strips a pasted origin, a leading `@` and a
     * trailing slash so the common paste reads correctly — it does NOT validate.
     * A preview that refused to draw for anything the pattern rejects would go
     * blank on the creator's second keystroke, which reads as broken rather than
     * as "keep typing". The server is still the only thing that decides.
     */
    const preview = useMemo(() => {
        const raw = (data.handle || "").trim();

        if (!raw || !current?.url) return null;

        const bare = raw
            .replace(/^https?:\/\/[^/]+\/?/i, "")
            .replace(/^@/, "")
            .replace(/\/+$/, "");

        if (!bare) return null;

        return current.url
            .replace("{handle}", bare)
            .replace(/^https?:\/\//i, "");
    }, [data.handle, current]);

    const submit = (e) => {
        e.preventDefault();

        // Re-entrancy guard: the disabled re-render loses the double-tap race.
        if (processing) return;

        post(route("bio.links.store"), {
            preserveScroll: true,
            onSuccess: () => reset("handle", "label"),
        });
    };

    return (
        <section className="mt-3 rounded-box border-2 border-[#000] bg-white p-4">
            {/* h3, not h2: this now sits inside the "Social accounts" group,
                which owns the h2. A heading level that skips or repeats is what
                a screen reader reads as the page structure. */}
            <h3 className="font-gulfs text-[13px] uppercase tracking-[0.18em] text-black/70">
                Add a link
            </h3>

            {atLimit ? (
                <p className="mt-3 font-poppins text-[13px] leading-[1.6] text-black/60">
                    You have added the maximum number of links. Remove one to
                    add another.
                </p>
            ) : (
                <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
                    {/* ⚠️ Tiles, not a <select>. There are seven platforms and
                        they all fit on one screen — a dropdown hid every option
                        behind a tap and made the most common choice (the one you
                        post on) as slow as the rarest. `aria-pressed` rather
                        than a radio group keeps it one tab stop per option with
                        the state announced. */}
                    <fieldset className="block">
                        <legend className="font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60">
                            Where
                        </legend>

                        <div className="mt-2 flex flex-wrap gap-2">
                            {platforms.map((p) => {
                                const on = data.platform === p.key;

                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() =>
                                            setData("platform", p.key)
                                        }
                                        className={`min-h-[44px] rounded-box-sm border-2 px-4 font-gulfs text-[12px] uppercase tracking-[0.14em] transition-[filter,background-color] duration-200 ${
                                            on
                                                ? "border-[#000] bg-[#FF007F] text-black hover:brightness-110 active:brightness-95"
                                                : "border-[#000] bg-white text-black/70 hover:bg-[#F4F4F5]"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <label className="block">
                        <span className="font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60">
                            Username
                        </span>
                        <input
                            type="text"
                            value={data.handle}
                            onChange={(e) => setData("handle", e.target.value)}
                            placeholder={current?.placeholder || ""}
                            className="mt-1 min-h-[48px] w-full rounded-box-sm border-2 border-[#000] bg-white px-3 font-poppins text-[14px] text-black"
                        />
                        {/* Pasting the whole profile URL is what people actually do,
                            and the server reduces it to the handle. */}
                        <span className="mt-1 block font-poppins text-[12px] leading-[1.5] text-black/50">
                            Your username, or paste the whole profile link.
                        </span>

                        {/* 🚨 WHERE THE BUTTON WILL ACTUALLY POINT, AS YOU TYPE.
                            The server accepts a bare handle OR a pasted profile
                            URL and reduces one to the other, which is right —
                            but it meant the creator could not tell which of the
                            two they had given us until after they had saved a
                            button and opened their own page to check. This is
                            a DISPLAY of the same reduction, never the value that
                            is submitted: the server still does the real one. */}
                        {preview ? (
                            <span className="mt-2 block break-all rounded-box-sm border-2 border-dashed border-black/25 px-3 py-2 font-poppins text-[12px] leading-[1.5] text-black/60">
                                Goes to{" "}
                                <span className="font-medium text-black/80">
                                    {preview}
                                </span>
                            </span>
                        ) : null}

                        {errors.handle ? (
                            <FieldError>{errors.handle}</FieldError>
                        ) : null}
                    </label>

                    <label className="block">
                        <span className="font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60">
                            Button text (optional)
                        </span>
                        <input
                            type="text"
                            value={data.label}
                            onChange={(e) => setData("label", e.target.value)}
                            maxLength={40}
                            placeholder={current?.label || ""}
                            className="mt-1 min-h-[48px] w-full rounded-box-sm border-2 border-[#000] bg-white px-3 font-poppins text-[14px] text-black"
                        />
                        {errors.label ? (
                            <FieldError>{errors.label}</FieldError>
                        ) : null}
                    </label>

                    <button
                        type="submit"
                        disabled={processing || !data.handle}
                        className="min-h-[48px] rounded-box-sm bg-[#FF007F] px-4 font-gulfs text-[13px] uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-40"
                    >
                        {processing ? "Processing…" : "Add link"}
                    </button>
                </form>
            )}
        </section>
    );
}

/**
 * 🚨 THE REORDER ENDPOINT IS SENT THE WHOLE LIST, ALWAYS, even though the
 * buttons now move a row within its own group.
 *
 * `BioLinkController::reorder` assigns each uuid its position from the array's
 * index, so posting only the social links would renumber those from zero and
 * leave every Spenny Piggy tile on its old number — the two groups would
 * interleave. `index` is therefore the row's position in the FULL list and
 * `prevIndex` / `nextIndex` are its neighbours WITHIN its group; the swap
 * happens inside the full array, which stays complete.
 */
function LinkRow({ link, index, prevIndex, nextIndex, order }) {
    const [busy, setBusy] = useState(false);

    const move = (target) => {
        if (busy || target === null || target === undefined) return;

        const next = [...order];

        [next[index], next[target]] = [next[target], next[index]];

        setBusy(true);
        router.post(
            route("bio.links.reorder"),
            { order: next },
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    };

    const toggle = () => {
        if (busy) return;
        setBusy(true);
        router.post(
            route("bio.links.update", { link: link.uuid }),
            { is_active: !link.is_active },
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    };

    const remove = () => {
        if (busy) return;
        setBusy(true);
        router.post(
            route("bio.links.destroy", { link: link.uuid }),
            {},
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    };

    return (
        <div
            className={[
                "rounded-box-sm border-2 border-[#000] p-3",
                link.is_active ? "bg-white" : "bg-black/[0.04]",
            ].join(" ")}
        >
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate font-gulfs text-[14px] uppercase leading-[1.2] text-black">
                        {link.label}
                    </p>
                    <p className="mt-0.5 font-poppins text-[12px] leading-[1.5] text-black/50">
                        {link.kind === "external"
                            ? "Off Spenny Piggy"
                            : "On your page"}
                        {link.click_count > 0
                            ? ` · ${link.click_count} clicks`
                            : ""}
                    </p>
                </div>

                <div className="flex shrink-0 gap-1">
                    <IconButton
                        onClick={() => move(prevIndex)}
                        disabled={prevIndex === null}
                        label="Move up"
                    >
                        ↑
                    </IconButton>
                    <IconButton
                        onClick={() => move(nextIndex)}
                        disabled={nextIndex === null}
                        label="Move down"
                    >
                        ↓
                    </IconButton>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <RowAction onClick={toggle} disabled={busy}>
                    {link.is_active ? "Hide" : "Show"}
                </RowAction>

                {/* ⚠️ An internal button is derived from what the creator sells, so
                    "remove" can only mean hide — the row would come straight back. */}
                {link.kind === "external" ? (
                    <RowAction onClick={remove} disabled={busy} tone="danger">
                        Remove
                    </RowAction>
                ) : null}
            </div>
        </div>
    );
}

function IconButton({ onClick, disabled, label, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="flex h-11 w-11 items-center justify-center rounded-box-xs border-2 border-[#000] font-poppins text-[16px] text-black transition-opacity duration-200 hover:opacity-70 disabled:opacity-25"
        >
            {children}
        </button>
    );
}

function RowAction({ onClick, disabled, tone, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={[
                "min-h-[40px] rounded-box-xs border-2 px-3 font-gulfs text-[11px] uppercase tracking-[0.14em]",
                "transition-opacity duration-200 hover:opacity-70 disabled:opacity-40",
                tone === "danger"
                    ? "border-[#EF4444] text-[#EF4444]"
                    : "border-[#000] text-black",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function FieldError({ children }) {
    return (
        <span className="mt-1 block font-poppins text-[12px] leading-[1.5] text-[#EF4444]">
            {children}
        </span>
    );
}
