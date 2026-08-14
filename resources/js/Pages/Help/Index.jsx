import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import HelpSearchBar from "@/Components/Help/HelpSearchBar";
import StillNeedHelp from "@/Components/Help/StillNeedHelp";
import AudienceFilter from "@/Components/Help/AudienceFilter";

/**
 * The help centre directory.
 *
 * 🚨 THE SIGNATURE IS THAT THE CATEGORIES ABUT. The hairline between two tiles
 * is the GROUP's background showing through a 1px gap — never a border per tile,
 * which doubles up between neighbours and needs a per-position reset at every
 * breakpoint. This is the same construction home/WaysToGetPaid.jsx uses, and for
 * the same reason: nine gapped cards read as nine separate chores, one joined
 * object reads as one help system.
 *
 * ⚠️ ONE ACCENT PER GROUP, NEVER PER TILE. Eight accents is no accent — the
 * mistake WaysToGetPaid documents making first. The groups are the three real
 * audiences, which is a column in the database rather than a shape imposed on
 * the content.
 *
 * ⚠️ Meta and JSON-LD are applied SERVER-SIDE (HelpController::applyIndexSeo).
 * SSR is off, so a link unfurler never runs this file — the <Head> here sets
 * the browser tab and nothing else.
 */

/**
 * ⚠️ FIXED, and a group is never dropped when it is empty for the current
 * filter. A column that appears and disappears as content is published means
 * nobody can learn where anything is.
 */
const GROUPS = [
    {
        key: "creator",
        label: "If you sell",
        note: "Listing, getting paid, and the rules your work is held to.",
        accent: "#05EFB8",
        ink: "text-black",
    },
    {
        key: "supporter",
        label: "If you buy",
        note: "Paying, finding what you bought, and getting it put right.",
        accent: "#FF007F",
        ink: "text-black",
    },
    {
        key: "both",
        label: "Either way",
        note: "Your account, your payments, and reporting a problem.",
        // ⚠️ Violet, not white. A white dot on a light page reads as a MISSING
        // accent rather than a neutral one — it looks like a bug. Violet is the
        // third house colour and is otherwise unused on this page, so all three
        // groups stay distinct and all three stay in the palette.
        accent: "#8C52FF",
        ink: "text-black",
    },
];

export default function HelpIndex({
    auth,
    user,
    categories = [],
    audience,
    viewer_audience,
    escalation,
    popular = [],
    ai_enabled = false,
    ai_max_question = 200,
}) {
    const grouped = GROUPS.map((group) => ({
        ...group,
        items: categories.filter((c) => c.audience === group.key),
    })).filter((group) => group.items.length > 0);

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title="Help Centre" />

            <div className="min-h-dvh bg-gray-50 pb-28">
                {/*
                  A dark field with colour on the BLOCKS inside it — the landing
                  page's own rule. A full-bleed mint band is a lot of shouting
                  above a page whose job is to be read.
                */}
                <header className="border-b-[3px] border-black bg-[#0B0B0C]">
                    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
                        <p className="font-gulfs text-xs uppercase tracking-[0.22em] text-[#05EFB8]">
                            Help Centre
                        </p>

                        <h1 className="mt-3 font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
                            What do you need
                            <br />
                            a hand with?
                        </h1>

                        <p className="mt-4 max-w-xl text-[15px] leading-[1.6] text-black/60 sm:text-base">
                            {ai_enabled
                                ? "Ask in your own words, search, or start a "
                                : "Search, browse by topic, or start a "}
                            <a
                                href="#"
                                onClick={(e) => {
                                    if (typeof window !== "undefined" && typeof window.Intercom === "function") {
                                        e.preventDefault();
                                        window.Intercom("showNewMessage");
                                    } else {
                                        window.location.href = `mailto:${escalation?.email}`;
                                    }
                                }}
                                className="livechat font-semibold text-[#FF007F] hover:underline"
                            >
                                live chat
                            </a>
                            {ai_enabled
                                ? ". Every answer here comes from an article you can open and read in full."
                                : ". Every answer here is one you can open and read in full."}
                        </p>

                        <div className="mt-7">
                            {/* ⚠️ The Ask AI button is rendered only when the
                                server can genuinely answer. A button that quietly
                                runs a keyword search is a promise not kept. */}
                            <HelpSearchBar ai={ai_enabled} maxQuestion={ai_max_question} onDark />
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-4xl px-4 py-10">
                    {popular.length > 0 && (
                        <section aria-labelledby="popular-heading">
                            <h2
                                id="popular-heading"
                                className="font-gulfs text-[12px] uppercase tracking-[0.18em] text-black/60"
                            >
                                Most read this month
                            </h2>
                            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                {popular.map((a) => (
                                    <li key={a.slug}>
                                        <Link
                                            href={`/help/${a.category_slug}/${a.slug}`}
                                            className="flex min-h-[44px] items-center rounded-box-sm border-2 border-black bg-white px-4 py-3 text-[15px] font-semibold text-black transition-colors hover:bg-black hover:text-white"
                                        >
                                            {a.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <div className={popular.length > 0 ? "mt-10" : ""}>
                        <AudienceFilter current={audience} viewerAudience={viewer_audience} basePath="/help" />
                    </div>

                    {categories.length === 0 ? (
                        <p className="mt-6 rounded-box border-[3px] border-black bg-white p-6 text-[15px] text-black/70">
                            Nothing published here yet. Email us and we&apos;ll answer directly —{" "}
                            <a href={`mailto:${escalation?.email}`} className="font-semibold text-[#FF007F] underline">
                                {escalation?.email}
                            </a>
                            .
                        </p>
                    ) : (
                        <div className="mt-8 flex flex-col gap-10">
                            {grouped.map((group) => (
                                <section key={group.key} aria-labelledby={`group-${group.key}`}>
                                    {/* The accent carries as a RULE and a dot, never as
                                        the heading's colour — pink on white passes, but
                                        the house device is the rule under the words. */}
                                    <div className="flex items-baseline gap-3">
                                        <span
                                            className="h-3 w-3 shrink-0 rounded-full border-2 border-black"
                                            style={{ backgroundColor: group.accent }}
                                            aria-hidden="true"
                                        />
                                        <h2
                                            id={`group-${group.key}`}
                                            className="font-gulfs text-xl uppercase tracking-tight text-black sm:text-2xl"
                                        >
                                            {group.label}
                                        </h2>
                                    </div>
                                    <p className="mt-1 pl-6 text-sm text-black/60">{group.note}</p>

                                    {/*
                                      🚨 THE ABUTTING GROUP. `gap-px` over a black parent
                                      makes the parent show through as a hairline between
                                      tiles. Never a border per tile.
                                    */}
                                    <div className="mt-4 overflow-hidden rounded-box border-[3px] border-black bg-black">
                                        <div className="grid gap-px sm:grid-cols-2">
                                            {group.items.map((c, i) => (
                                                <Link
                                                    key={c.slug}
                                                    href={`/help/${c.slug}`}
                                                    /*
                                                      🚨 An ODD tile count must have its last
                                                      tile span both columns.
                                                      The hairline here IS the black parent
                                                      showing through a 1px gap, so an empty
                                                      grid cell does not render as nothing —
                                                      it renders as a solid black block the
                                                      size of a tile. That is the cost of the
                                                      abutting construction and the only
                                                      correct fix is to leave no empty cell.
                                                    */
                                                    className={[
                                                        "group/tile flex flex-col bg-white p-5 transition-colors hover:bg-gray-50",
                                                        group.items.length % 2 === 1 && i === group.items.length - 1
                                                            ? "sm:col-span-2"
                                                            : "",
                                                    ].join(" ")}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        {c.icon && (
                                                            <span className="text-lg" aria-hidden="true">
                                                                {c.icon}
                                                            </span>
                                                        )}
                                                        <span className="text-[17px] font-black tracking-tight text-black">
                                                            {c.title}
                                                        </span>
                                                    </span>

                                                    {c.summary && (
                                                        <span className="mt-1 text-sm leading-[1.5] text-black/60">
                                                            {c.summary}
                                                        </span>
                                                    )}

                                                    {/* Four real titles: a tile that only
                                                        names the shelf says nothing about
                                                        what is on it. */}
                                                    {c.preview?.length > 0 && (
                                                        <span className="mt-3 flex flex-col gap-1 border-t border-black/10 pt-3">
                                                            {c.preview.map((p) => (
                                                                <span
                                                                    key={p.slug}
                                                                    className="truncate text-[13px] text-black/65"
                                                                >
                                                                    {p.title}
                                                                </span>
                                                            ))}
                                                        </span>
                                                    )}

                                                    <span className="mt-3 font-gulfs text-[12px] uppercase tracking-[0.16em] text-black/60">
                                                        {c.article_count}{" "}
                                                        {c.article_count === 1 ? "answer" : "answers"}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}

                    <div className="mt-12">
                        <StillNeedHelp escalation={escalation} />
                    </div>
                </main>
            </div>
        </Authenticated>
    );
}
