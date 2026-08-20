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
function LinkGroupSection({ title, note, links, ordered, allOrder, empty, children }) {
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
                            key={link.uuid || `${link.kind}-${link.target_type}`}
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

            <AddItem available={available} atLimit={atLimit} maxItems={maxItems} />

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
                                    className="flex w-full min-h-[56px] items-center gap-3 rounded-box-sm border-2 border-[#000] bg-white p-2 text-left transition-colors duration-200 hover:bg-black/[0.04] disabled:opacity-50"
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
                    You have added the maximum number of links. Remove one to add
                    another.
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
                                        onClick={() => setData("platform", p.key)}
                                        className={`min-h-[44px] rounded-box-sm border-2 px-4 font-gulfs text-[12px] uppercase tracking-[0.14em] transition-[filter,background-color] duration-200 ${
                                            on
                                                ? "border-[#000] bg-[#FF007F] text-black hover:brightness-110 active:brightness-95"
                                                : "border-[#000] bg-white text-black/70 hover:bg-black/[0.04]"
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
                        {link.kind === "external" ? "Off Spenny Piggy" : "On your page"}
                        {link.click_count > 0 ? ` · ${link.click_count} clicks` : ""}
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
