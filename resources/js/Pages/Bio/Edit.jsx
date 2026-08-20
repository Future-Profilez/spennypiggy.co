import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

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
}) {
    const [copied, setCopied] = useState(false);

    const atLimit = externalCount >= maxExternal;

    const ordered = useMemo(
        () => [...links].sort((a, b) => a.sort_order - b.sort_order),
        [links],
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

            <div className="min-h-dvh bg-gray-50 px-4 pb-28 pt-6">
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

                    <section className="mt-5 rounded-box border-[3px] border-[#000] bg-white p-4">
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
                                {stats.views} {stats.views === 1 ? "view" : "views"} so far
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

                    <AddLink platforms={platforms} atLimit={atLimit} />

                    <section className="mt-6">
                        <h2 className="font-gulfs text-[13px] uppercase tracking-[0.18em] text-black/70">
                            Your buttons
                        </h2>

                        <div className="mt-3 flex flex-col gap-3">
                            {ordered.map((link, index) => (
                                <LinkRow
                                    key={link.uuid || `${link.kind}-${link.target_type}`}
                                    link={link}
                                    index={index}
                                    total={ordered.length}
                                    order={ordered.map((l) => l.uuid)}
                                />
                            ))}
                        </div>

                        {ordered.length === 0 ? (
                            <p className="mt-3 rounded-box-sm border-2 border-dashed border-black/25 px-4 py-6 text-center font-poppins text-[13px] leading-[1.6] text-black/55">
                                Once you publish something to sell, its button
                                appears here automatically.
                            </p>
                        ) : null}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
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
                These show as cards at the top of your page. Tapping one takes
                your supporter straight to its checkout.
            </p>

            <AddItem available={available} atLimit={atLimit} maxItems={maxItems} />

            <div className="mt-3 flex flex-col gap-3">
                {ordered.map((item, index) => (
                    <ItemRow
                        key={item.uuid}
                        item={item}
                        index={index}
                        total={ordered.length}
                        order={ordered.map((i) => i.uuid)}
                    />
                ))}
            </div>

            {ordered.length === 0 ? (
                <p className="mt-3 rounded-box-sm border-2 border-dashed border-black/25 px-4 py-6 text-center font-poppins text-[13px] leading-[1.6] text-black/55">
                    Nothing chosen yet. Pick the things you most want people to
                    buy — they go first, above every link.
                </p>
            ) : null}
        </section>
    );
}

function AddItem({ available, atLimit, maxItems }) {
    const [selected, setSelected] = useState("");
    const [busy, setBusy] = useState(false);

    const row = available.find((r) => r.key === selected);

    const submit = (e) => {
        e.preventDefault();

        if (busy || !row) return;

        setBusy(true);
        router.post(
            // ⚠️ Literal path, not `route()` — see this file's docblock.
            "/bio-links/items",
            { type: row.type, uuid: row.uuid },
            {
                preserveScroll: true,
                onSuccess: () => setSelected(""),
                onFinish: () => setBusy(false),
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
        <form
            onSubmit={submit}
            className="mt-3 rounded-box border-[3px] border-[#000] bg-white p-4"
        >
            <label className="block">
                <span className="font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60">
                    Add an item
                </span>
                <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="mt-1 min-h-[48px] w-full rounded-box-sm border-2 border-[#000] bg-white px-3 font-poppins text-[14px] text-black"
                >
                    <option value="">Choose one of your listings…</option>
                    {available.map((r) => (
                        <option key={r.key} value={r.key}>
                            {r.type_label} — {r.title}
                            {r.price !== null && r.price !== undefined
                                ? ` (${money(r.price, r.currency)})`
                                : ""}
                        </option>
                    ))}
                </select>
            </label>

            <button
                type="submit"
                disabled={busy || !row}
                className="mt-3 min-h-[48px] w-full rounded-box-sm bg-[#FF007F] px-4 font-gulfs text-[13px] uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-40"
            >
                {busy ? "Processing…" : "Add to my page"}
            </button>
        </form>
    );
}

function ItemRow({ item, index, total, order }) {
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

    return (
        <div
            className={[
                "rounded-box-sm border-[3px] border-[#000] p-3",
                item.is_active ? "bg-white" : "bg-black/[0.04]",
            ].join(" ")}
        >
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-box-xs border-2 border-[#000] bg-black/[0.06]">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    ) : null}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate font-gulfs text-[14px] uppercase leading-[1.2] text-black">
                        {item.title}
                    </p>
                    <p className="mt-0.5 font-poppins text-[12px] leading-[1.5] text-black/50">
                        {item.type_label}
                        {item.price !== null && item.price !== undefined
                            ? ` · ${money(item.price, item.currency)}`
                            : ""}
                        {item.clicks > 0 ? ` · ${item.clicks} taps` : ""}
                    </p>
                </div>

                <div className="flex shrink-0 gap-1">
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
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <RowAction onClick={toggle} disabled={busy}>
                    {item.is_active ? "Hide" : "Show"}
                </RowAction>
                {/* ⚠️ A selection IS removable, unlike a derived link button —
                    it is the creator's own choice. The listing is untouched. */}
                <RowAction onClick={remove} disabled={busy} tone="danger">
                    Remove
                </RowAction>
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
        <section className="mt-6 rounded-box border-[3px] border-[#000] bg-white p-4">
            <h2 className="font-gulfs text-[13px] uppercase tracking-[0.18em] text-black/70">
                Add a link
            </h2>

            {atLimit ? (
                <p className="mt-3 font-poppins text-[13px] leading-[1.6] text-black/60">
                    You have added the maximum number of links. Remove one to add
                    another.
                </p>
            ) : (
                <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
                    <label className="block">
                        <span className="font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60">
                            Where
                        </span>
                        <select
                            value={data.platform}
                            onChange={(e) => setData("platform", e.target.value)}
                            className="mt-1 min-h-[48px] w-full rounded-box-sm border-2 border-[#000] bg-white px-3 font-poppins text-[14px] text-black"
                        >
                            {platforms.map((p) => (
                                <option key={p.key} value={p.key}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </label>

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
                        {errors.handle ? <FieldError>{errors.handle}</FieldError> : null}
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
                        {errors.label ? <FieldError>{errors.label}</FieldError> : null}
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

function LinkRow({ link, index, total, order }) {
    const [busy, setBusy] = useState(false);

    const move = (direction) => {
        if (busy) return;

        const next = [...order];
        const target = index + direction;

        if (target < 0 || target >= total) return;

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
                "rounded-box-sm border-[3px] border-[#000] p-3",
                link.is_active ? "bg-white" : "bg-black/[0.04]",
            ].join(" ")}
        >
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate font-gulfs text-[14px] uppercase leading-[1.2] text-black">
                        {link.label}
                    </p>
                    <p className="mt-0.5 font-poppins text-[12px] leading-[1.5] text-black/50">
                        {link.kind === "external" ? "Off Spenny Piggy" : "On your page"}
                        {link.click_count > 0 ? ` · ${link.click_count} clicks` : ""}
                    </p>
                </div>

                <div className="flex shrink-0 gap-1">
                    <IconButton onClick={() => move(-1)} disabled={index === 0} label="Move up">
                        ↑
                    </IconButton>
                    <IconButton
                        onClick={() => move(1)}
                        disabled={index === total - 1}
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
                tone === "danger" ? "border-[#EF4444] text-[#EF4444]" : "border-[#000] text-black",
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
