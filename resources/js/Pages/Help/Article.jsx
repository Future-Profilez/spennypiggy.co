import { Head, Link } from "@inertiajs/react";
import { ChevronLeft } from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import ArticleBody from "@/Components/Help/ArticleBody";
import ArticleFeedback from "@/Components/Help/ArticleFeedback";
import StillNeedHelp from "@/Components/Help/StillNeedHelp";
import HelpSearchBar from "@/Components/Help/HelpSearchBar";

/**
 * One answer.
 *
 * ⚠️ Meta, canonical, Article JSON-LD and the breadcrumb are applied SERVER-SIDE
 * (HelpController::applyArticleSeo). SSR is off and no link unfurler runs this
 * file — the <Head> here only sets the browser tab.
 *
 * ⚠️ `body_html` is server-rendered Markdown with raw HTML stripped
 * (App\Support\HelpMarkdown). That is what makes the injection in ArticleBody
 * safe; never route another HTML source through it.
 */
export default function HelpArticle({
    auth,
    user,
    article,
    escalation,
    ai_enabled = false,
    ai_max_question = 200,
}) {
    const audienceLabel = {
        creator: "For creators",
        supporter: "For supporters",
    }[article.audience];

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={`${article.title} — Help`} />

            <div className="min-h-dvh bg-gray-50 pb-28">
                <header className="!border-t-[0px] !border-l-[0px] !border-r-[0px]  bg-gray-200">
                    <div className="mx-auto w-full max-w-3xl px-4 py-8">
                        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
                            <Link
                                href={`/help/${article.category.slug}`}
                                className="inline-flex min-h-[44px] items-center gap-1 font-bold text-black/60 hover:text-black"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                {article.category.title}
                            </Link>
                        </nav>

                        <h1 className="mt-1 text-2xl font-black leading-[1.15] tracking-tight text-black sm:text-4xl">
                            {article.title}
                        </h1>

                        {audienceLabel && (
                            <span className="mt-3 inline-flex items-center rounded-full border-2 border-black bg-[#E6EA7B] px-3 py-1 text-xs font-black uppercase tracking-wider text-black">
                                {audienceLabel}
                            </span>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-3xl px-4 py-8">
                    <article className="rounded-box border-[3px] border-black bg-white p-5 sm:p-8">
                        <p className="text-base font-semibold leading-[1.6] text-black">{article.summary}</p>

                        {/* Contents only earns its place on a long answer; on a
                            short one it is a list of one thing above the thing. */}
                        {article.toc?.length >= 3 && (
                            <nav aria-label="On this page" className="mt-6 rounded-box-sm border-2 border-black/15 bg-gray-50 p-4">
                                <p className="text-xs font-black uppercase tracking-wider text-black/60">On this page</p>
                                <ul className="mt-2 space-y-1">
                                    {article.toc.map((h) => (
                                        <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
                                            <a
                                                href={`#${h.id}`}
                                                className="text-sm font-medium text-black/75 underline decoration-black/20 underline-offset-4 hover:text-[#FF007F]"
                                            >
                                                {h.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        )}

                        <div className="mt-6 border-t border-black/10 pt-6">
                            <ArticleBody html={article.body_html} />
                        </div>

                        <div className="mt-8 border-t-2 border-black/10 pt-6">
                            <ArticleFeedback slug={article.slug} context="page" />
                        </div>
                    </article>

                    {/* An answer with no next step is where a reader gives up and
                        opens a ticket. */}
                    {article.related?.length > 0 && (
                        <section className="mt-8" aria-labelledby="related-heading">
                            <h2 id="related-heading" className="text-sm font-black uppercase tracking-tight text-black/60">
                                Related
                            </h2>
                            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                {article.related.map((r) => (
                                    <li key={r.slug}>
                                        <Link
                                            href={`/help/${r.category_slug}/${r.slug}`}
                                            className="flex min-h-[44px] items-center rounded-box-sm border-2 border-black bg-white px-4 py-3 text-[15px] font-semibold text-black hover:bg-black hover:text-white"
                                        >
                                            {r.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <div className="mt-8">
                        <HelpSearchBar ai={ai_enabled} maxQuestion={ai_max_question} placeholder="Search, or ask another question…" />
                    </div>

                    <div className="mt-8">
                        <StillNeedHelp escalation={escalation} />
                    </div>
                </main>
            </div>
        </Authenticated>
    );
}
