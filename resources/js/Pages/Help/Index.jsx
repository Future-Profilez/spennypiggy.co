import { Head, Link } from "@inertiajs/react";
import { ArrowRight, Sparkles } from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import HelpSearchBar from "@/Components/Help/HelpSearchBar";
import { openLiveChat } from "@/lib/liveChat";
import StillNeedHelp from "@/Components/Help/StillNeedHelp";
import AudienceFilter from "@/Components/Help/AudienceFilter";
import RecentArticles from "@/Components/Help/RecentArticles";

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
 * 🚨 THE MOST-READ ANSWERS ARE IN THE HERO, NOT A SECTION BELOW IT (6 Sep 2026).
 * They used to be a six-row block under the fold, so on a phone the four answers
 * that resolve most visits were reached by scrolling past a filter and a
 * directory. As chips beside the search box they are the first thing after the
 * question — and the block they replace is gone rather than duplicated.
 *
 * ⚠️ Meta and JSON-LD are applied SERVER-SIDE (HelpController::applyIndexSeo).
 * ⚠️ SSR is ON for /help since 4 Sep 2026 (it was off when this was written), so
 * an unfurler DOES get this file's markup now. The <Head> here still sets
 * the browser tab and nothing else.
 *
 * ⚠️ NO `pb-28` ON THE WRAPPER. `AuthenticatedLayout`'s own `<main>` carries it
 * AND `retro-bottombar.css` adds the bar's real height to every `main` on a
 * signed-in phone, so a third copy here was ~112px of dead screen under the
 * last element.
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
    },
    {
        key: "supporter",
        label: "If you buy",
        note: "Paying, finding what you bought, and getting it put right.",
        accent: "#FF007F",
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

    const totalAnswers = categories.reduce((sum, c) => sum + (c.article_count ?? 0), 0);

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title="Help Centre" />

            <div className="min-h-dvh bg-[#FFF6EC]">
                {/*
                  A dark field with colour on the BLOCKS inside it — the landing
                  page's own rule. A full-bleed mint band is a lot of shouting
                  above a page whose job is to be read.
                */}
                {/* No rule under this one: a black border against a #0B0B0C block is
                    invisible, and `border-black` is a four-sided shorthand here. The
                    tonal step to the cream ground below IS the edge. */}
                <header className="bg-[#0B0B0C]">
                    <div className="mx-auto w-full max-w-4xl px-4 py-9 sm:py-14">
                        {/* ⚠️ NO EYEBROW. "HELP CENTRE" above this heading was a
                            label restating the page the reader is already on — the
                            tab, the nav and the URL all say it. The heading is what
                            they came to answer, so it opens the page. */}
                        <h1 className="font-gulfs text-[30px] uppercase leading-[0.95] tracking-tight text-white sm:text-[56px]">
                            What do you need
                            <br />
                            a hand with?
                        </h1>

                        <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-white/85 sm:mt-4 sm:text-base">
                            {ai_enabled
                                ? "Ask in your own words, search, or start a "
                                : "Search, browse by topic, or start a "}
                            {/* ⚠️ The href is a REAL mailto:, not "#" with a JS
                                redirect behind it. openLiveChat only cancels the
                                click when the messenger is genuinely booted — the
                                old `typeof window.Intercom === "function"` guard
                                was satisfied by the provider's queueing stub, so
                                a guest (no Intercom at all) clicked a dead link.
                                A real href also survives middle-click and a
                                crawler, which "#" never did. */}
                            <a
                                href={`mailto:${escalation?.email}`}
                                onClick={openLiveChat}
                                className="help-focus-invert livechat font-semibold text-[#FF007F] underline decoration-[#FF007F]/40 underline-offset-4 hover:decoration-[#FF007F]"
                            >
                                live chat
                            </a>
                            {ai_enabled
                                ? ". Every answer comes from an article you can open and read in full."
                                : ". Every answer here is one you can open and read in full."}
                        </p>

                        <div className="mt-6 sm:mt-7">
                            {/* ⚠️ The Ask AI action is rendered only when the
                                server can genuinely answer. A control that quietly
                                runs a keyword search is a promise not kept. */}
                            <HelpSearchBar ai={ai_enabled} maxQuestion={ai_max_question} onDark />
                        </div>

                        {popular.length > 0 && (
                            <div className="mt-5">
                                <p className="font-gulfs text-[10px] uppercase tracking-[0.18em] text-white/50">
                                    Most read this month
                                </p>
                                {/* A rail on a phone, wrapping on a desktop. Four
                                    stacked full-width rows here would push the
                                    directory itself off the first screen. */}
                                <ul className="-mx-4 mt-2 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
                                    {popular.slice(0, 5).map((a) => (
                                        <li key={a.slug} className="snap-start">
                                            <Link
                                                href={`/help/${a.category_slug}/${a.slug}`}
                                                className="help-focus-invert inline-flex min-h-[40px] max-w-[78vw] items-center gap-1.5 rounded-box-sm border-black bg-white px-3 text-[13px] font-semibold text-black transition-[filter] duration-200 hover:brightness-95 sm:max-w-[320px]"
                                            >
                                                <span className="min-w-0 truncate">{a.title}</span>
                                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-black/60" aria-hidden="true" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </header>

                {/* 🚨 A <div>, NOT a second <main>. `AuthenticatedLayout` already
                    renders the page's one `main` landmark, so this made two per
                    page — a screen reader's "skip to main content" then has two
                    destinations and neither is the whole page. */}
                <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
                    <RecentArticles className="mb-8" />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <AudienceFilter
                            current={audience}
                            viewerAudience={viewer_audience}
                            basePath="/help"
                            className="sm:max-w-[380px] sm:flex-1"
                        />

                        {totalAnswers > 0 && (
                            <p className="font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60 sm:pt-3.5">
                                {totalAnswers} answers · {categories.length}{" "}
                                {categories.length === 1 ? "section" : "sections"}
                            </p>
                        )}
                    </div>

                    {categories.length === 0 ? (
                        <p className="mt-6 rounded-box border-black bg-white p-6 text-[15px] text-black/70">
                            Nothing published here yet. Email us and we&apos;ll answer directly —{" "}
                            <a href={`mailto:${escalation?.email}`} className="font-semibold text-[#D1006A] underline">
                                {escalation?.email}
                            </a>
                            .
                        </p>
                    ) : (
                        <div className="mt-8 flex flex-col gap-9 sm:gap-10">
                            {grouped.map((group) => (
                                <section key={group.key} aria-labelledby={`group-${group.key}`}>
                                    {/* The accent carries as a dot and a rule, never as
                                        the heading's colour — pink on white passes, but
                                        the house device is the mark beside the words. */}
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="h-3 w-3 shrink-0 rounded-full border-black"
                                            style={{ backgroundColor: group.accent }}
                                            aria-hidden="true"
                                        />
                                        <h2
                                            id={`group-${group.key}`}
                                            className="font-gulfs text-lg uppercase tracking-tight text-black sm:text-2xl"
                                        >
                                            {group.label}
                                        </h2>
                                        <span
                                            className="h-[2px] flex-1 rounded-full"
                                            style={{ backgroundColor: group.accent }}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[13px] leading-[1.5] text-black/60 sm:text-sm">
                                        {group.note}
                                    </p>

                                    {/*
                                      🚨 THE ABUTTING GROUP. `gap-px` over a black parent
                                      makes the parent show through as a hairline between
                                      tiles. Never a border per tile.
                                    */}
                                    <div className="mt-3.5 overflow-hidden rounded-box border-black bg-black">
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
                                                        /* 🚨 `min-w-0` IS LOAD-BEARING. A grid item defaults to
                                                           `min-width: auto`, and the preview lines below are
                                                           `truncate` (i.e. `white-space: nowrap`) — so the tile
                                                           grew to the width of its longest untruncated title
                                                           and was CLIPPED by the page's `overflow-x: hidden`.
                                                           Measured at 320px: a 371px tile in a 288px column,
                                                           with no horizontal scrollbar to show it. */
                                                        "help-focus group/tile flex min-w-0 flex-col bg-white p-4 transition-colors duration-200 hover:bg-[#F4F4F5] sm:p-5",
                                                        group.items.length % 2 === 1 && i === group.items.length - 1
                                                            ? "sm:col-span-2"
                                                            : "",
                                                    ].join(" ")}
                                                >
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        {c.icon && (
                                                            <span className="text-lg" aria-hidden="true">
                                                                {c.icon}
                                                            </span>
                                                        )}
                                                        <span className="min-w-0 text-[16px] font-black leading-[1.25] tracking-tight text-black sm:text-[17px]">
                                                            {c.title}
                                                        </span>
                                                        <ArrowRight
                                                            className="ml-auto h-4 w-4 shrink-0 text-black/45 transition-colors duration-200 group-hover/tile:text-black"
                                                            aria-hidden="true"
                                                        />
                                                    </span>

                                                    {c.summary && (
                                                        <span className="mt-1 text-[13px] leading-[1.5] text-black/60 sm:text-sm">
                                                            {c.summary}
                                                        </span>
                                                    )}

                                                    {/* Four real titles: a tile that only
                                                        names the shelf says nothing about
                                                        what is on it. */}
                                                    {c.preview?.length > 0 && (
                                                        <span className="mt-3 flex min-w-0 flex-col gap-1 border-t border-black/10 pt-2.5">
                                                            {c.preview.map((p) => (
                                                                <span
                                                                    key={p.slug}
                                                                    className="truncate text-[13px] leading-[1.45] text-black/65"
                                                                >
                                                                    {p.title}
                                                                </span>
                                                            ))}
                                                        </span>
                                                    )}

                                                    <span className="mt-2.5 font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60">
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

                    {ai_enabled && (
                        <p className="mt-8 flex items-start gap-2 rounded-box-sm border-black bg-white px-3.5 py-3 text-[13px] leading-[1.5] text-black/70">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#D1006A]" aria-hidden="true" />
                            <span>
                                Cannot see it? Type a full question in the box above and you will get a written answer,
                                with the articles it came from.
                            </span>
                        </p>
                    )}

                    <div className="mt-10 sm:mt-12">
                        <StillNeedHelp escalation={escalation} />
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
