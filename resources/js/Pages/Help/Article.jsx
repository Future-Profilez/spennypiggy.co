import { useEffect, useRef } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import ArticleBody from "@/Components/Help/ArticleBody";
import ArticleFeedback from "@/Components/Help/ArticleFeedback";
import StillNeedHelp from "@/Components/Help/StillNeedHelp";
import HelpSearchBar from "@/Components/Help/HelpSearchBar";
import HelpBreadcrumb from "@/Components/Help/HelpBreadcrumb";
import ShareArticle from "@/Components/Help/ShareArticle";
import { ArticleTocBar, ArticleTocRail, useReadingPosition } from "@/Components/Help/ArticleToc";
import { rememberHelpArticle } from "@/lib/helpRecents";

/**
 * One answer.
 *
 * ⚠️ Meta, canonical, Article JSON-LD and the breadcrumb are applied SERVER-SIDE
 * (HelpController::applyArticleSeo), which every unfurler reads first.
 * ⚠️ SSR is ON for /help since 4 Sep 2026, so this <Head> title is ALSO
 * server-rendered — beneath SeoMeta's, which is why a crawler sees two <title>
 * elements (the first, SeoMeta's, wins). Kept because it is what updates the
 * tab on a client-side navigation between articles.
 *
 * ⚠️ `body_html` is server-rendered Markdown with raw HTML stripped
 * (App\Support\HelpMarkdown). That is what makes the injection in ArticleBody
 * safe; never route another HTML source through it.
 *
 * DESIGN — TWO COLUMNS FROM `lg`, ONE BELOW IT (6 Sep 2026). The answer was a
 * single `max-w-3xl` column with the contents as a static box wedged between the
 * summary and the first paragraph, so on a long article a reader had no idea
 * which section they were in or how much was left. The contents is a sticky rail
 * on a desktop and a sticky bar with a progress line on a phone; the column it
 * sits beside also carries the share control and the escalation links, which
 * were previously three screens below the fold.
 *
 * ⚠️ `lg:items-start` / `lg:self-start` are LOAD-BEARING. A grid item defaults to
 * `align-self: stretch`, which makes the aside as tall as the article — and a
 * `sticky` element as tall as its container has nothing left to stick within, so
 * the rail simply scrolls away with no error and no visible cause.
 *
 * ⚠️ NO `pb-28` ON THE WRAPPER — `AuthenticatedLayout`'s `<main>` and
 * `retro-bottombar.css` already clear the phone tab bar, twice over.
 */

/**
 * ⚠️ FIXED locale and UTC, deliberately. SSR renders this on the server and
 * React re-renders it in the browser; a machine-local format makes the two
 * disagree, which React reports as a hydration mismatch and repairs by throwing
 * the server's markup away.
 */
function formatUpdated(iso) {
    if (!iso) return null;

    try {
        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        }).format(new Date(iso));
    } catch {
        return null;
    }
}

export default function HelpArticle({
    auth,
    user,
    article,
    escalation,
    ai_enabled = false,
    ai_max_question = 200,
}) {
    const articleRef = useRef(null);

    const audienceLabel = {
        creator: "For creators",
        supporter: "For supporters",
    }[article.audience];

    const updated = formatUpdated(article.updated_at);
    const toc = article.toc ?? [];
    const prev = article.pager?.prev ?? null;
    const next = article.pager?.next ?? null;

    /*
     * 🚨 ONE READING POSITION FOR THE WHOLE PAGE. Both contents forms are
     * MOUNTED at every width — `hidden lg:block` and `lg:hidden` hide a rendered
     * element, they do not skip it — so a hook inside each ran two
     * IntersectionObservers and two scroll/resize listener pairs over the same
     * headings, permanently, one of them for a rail nobody could see.
     */
    const { activeId, progress, jump } = useReadingPosition(article.toc ?? [], articleRef);

    // 🚨 Device-local only, and written in an effect so it never runs on the
    // render host. See lib/helpRecents.js — a list of the help articles somebody
    // opened is a list of the problems they are having with their own account.
    useEffect(() => {
        rememberHelpArticle({
            slug: article.slug,
            title: article.title,
            category_slug: article.category?.slug,
            category_title: article.category?.title,
        });
    }, [article.slug, article.title, article.category?.slug, article.category?.title]);

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={`${article.title} — Help`} />

            <div className="min-h-dvh bg-[#FFF6EC]">
                <header
                    className="bg-white"
                    /* 🚨 INLINE, never `border-b-2 border-black`.
                       `resources/css/index.css` redefines `.border-black` as the full
                       `border: 2px solid` SHORTHAND, so a side utility beside it is
                       discarded and the shorthand paints every edge — a box around the
                       whole header band. An inline border cannot be dropped. */
                    style={{ borderBottom: "2px solid #000" }}
                >
                    <div className="mx-auto w-full max-w-5xl px-4 pb-5 pt-4 sm:pb-7 sm:pt-5">
                        <HelpBreadcrumb
                            trail={[
                                { label: article.category.title, href: `/help/${article.category.slug}` },
                                { label: article.title },
                            ]}
                        />

                        <h1 className="mt-2 max-w-3xl text-[26px] font-black leading-[1.15] tracking-tight text-black sm:text-4xl">
                            {article.title}
                        </h1>

                        {/* One meta row: who it is for, how long it takes, when it
                            was last true, and how to send it to somebody. All four
                            are decisions a reader makes BEFORE reading, so they
                            belong above the answer rather than at its foot. */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                            {audienceLabel && (
                                <span className="inline-flex items-center rounded-full border-black bg-[#E6EA7B] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-black">
                                    {audienceLabel}
                                </span>
                            )}

                            {article.reading_minutes > 0 && (
                                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-black/55">
                                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                    {article.reading_minutes} min read
                                </span>
                            )}

                            {updated && (
                                <span className="text-[12px] font-semibold text-black/60">Updated {updated}</span>
                            )}

                            <ShareArticle title={article.title} className="ml-auto" />
                        </div>
                    </div>
                </header>

                {/* 🚨 A <div>, NOT a second <main>. `AuthenticatedLayout` already
                    renders the page's one `main` landmark, so this made two per
                    page — a screen reader's "skip to main content" then has two
                    destinations and neither is the whole page. */}
                <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
                    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start lg:gap-10">
                        <div className="min-w-0">
                            <ArticleTocBar toc={toc} activeId={activeId} progress={progress} onJump={jump} />

                            <article
                                ref={articleRef}
                                className="rounded-box border-black bg-white p-4 sm:p-7"
                            >
                                {/* The summary is the answer in one sentence, and it
                                    is set apart by TYPE — a step up in size with a
                                    tighter measure. It carried a 3px pink left border
                                    before: a bordered panel inside a bordered card is
                                    boxes inside boxes, and a thick coloured spine is
                                    the stock callout costume, which says "notice this"
                                    without saying what it is. Size says lead. */}
                                <p className="max-w-[46ch] text-[17px] font-semibold leading-[1.45] tracking-[-0.01em] text-black sm:text-[19px]">
                                    {article.summary}
                                </p>

                                <div className="mt-5 border-t border-black/10 pt-5 sm:mt-6 sm:pt-6">
                                    <ArticleBody html={article.body_html} />
                                </div>

                                <div className="mt-8 border-t border-black/10 pt-5">
                                    <ArticleFeedback slug={article.slug} context="page" />
                                </div>
                            </article>

                            {/* 🚨 The pager walks the SECTION's own order, which is
                                the order the category page numbered. A help section
                                is written to be read through; before this the only
                                way on from an answer was Back. */}
                            {(prev || next) && (
                                <nav aria-label="More in this section" className="mt-5 grid gap-2 sm:grid-cols-2">
                                    {prev ? (
                                        <Link
                                            href={`/help/${prev.category_slug}/${prev.slug}`}
                                            className="help-focus group/pager flex min-h-[64px] flex-col justify-center rounded-box-sm border-black bg-white px-3.5 py-2.5 transition-colors duration-200 hover:bg-[#F4F4F5]"
                                        >
                                            <span className="flex items-center gap-1 font-gulfs text-[10px] uppercase tracking-[0.16em] text-black/60">
                                                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                                                Previous
                                            </span>
                                            <span className="mt-0.5 text-[14px] font-semibold leading-[1.35] text-black line-clamp-2">
                                                {prev.title}
                                            </span>
                                        </Link>
                                    ) : (
                                        <span className="hidden sm:block" aria-hidden="true" />
                                    )}

                                    {next && (
                                        <Link
                                            href={`/help/${next.category_slug}/${next.slug}`}
                                            className="help-focus group/pager flex min-h-[64px] flex-col justify-center rounded-box-sm border-black bg-white px-3.5 py-2.5 transition-colors duration-200 hover:bg-[#F4F4F5] sm:text-right"
                                        >
                                            <span className="flex items-center gap-1 font-gulfs text-[10px] uppercase tracking-[0.16em] text-black/60 sm:justify-end">
                                                Next
                                                <ArrowRight className="h-3 w-3" aria-hidden="true" />
                                            </span>
                                            <span className="mt-0.5 text-[14px] font-semibold leading-[1.35] text-black line-clamp-2">
                                                {next.title}
                                            </span>
                                        </Link>
                                    )}
                                </nav>
                            )}

                            {/* An answer with no next step is where a reader gives up and
                                opens a ticket. */}
                            {article.related?.length > 0 && (
                                <section className="mt-8" aria-labelledby="related-heading">
                                    <h2
                                        id="related-heading"
                                        className="font-gulfs text-[11px] uppercase tracking-[0.18em] text-black/60"
                                    >
                                        Related answers
                                    </h2>
                                    <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                                        {article.related.map((r) => (
                                            <li key={r.slug}>
                                                <Link
                                                    href={`/help/${r.category_slug}/${r.slug}`}
                                                    className="help-focus flex h-full min-h-[44px] items-center rounded-box-sm border-black bg-white px-3.5 py-2.5 text-[14px] font-semibold leading-[1.35] text-black transition-colors duration-200 hover:bg-[#F4F4F5]"
                                                >
                                                    {r.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <div className="mt-8">
                                <p className="font-gulfs text-[11px] uppercase tracking-[0.18em] text-black/60">
                                    {ai_enabled ? "Ask something else" : "Search for something else"}
                                </p>
                                <div className="mt-2.5">
                                    <HelpSearchBar
                                        ai={ai_enabled}
                                        maxQuestion={ai_max_question}
                                        placeholder="Search, or ask another question…"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <StillNeedHelp escalation={escalation} />
                            </div>
                        </div>

                        {/* ⚠️ Both forms are MOUNTED at every width; the classes only
                            hide one. That is exactly why the reading position is
                            measured once above and handed to both — see the hook. */}
                        <aside className="help-sticky-top sticky hidden self-start lg:block">
                            <div className="flex flex-col gap-5 pt-1">
                                <ArticleTocRail toc={toc} activeId={activeId} onJump={jump} />

                                <div className="border-t border-black/10 pt-4">
                                    <ShareArticle title={article.title} />
                                </div>

                                {/* The quiet form, never the yellow panel: the full
                                    one is already at the foot of this page and the
                                    same loud card twice on one screen is what the
                                    compact variant exists to avoid. */}
                                <StillNeedHelp escalation={escalation} compact />
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
