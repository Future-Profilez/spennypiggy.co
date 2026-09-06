import { Head, Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import HelpSearchBar from "@/Components/Help/HelpSearchBar";
import StillNeedHelp from "@/Components/Help/StillNeedHelp";
import AudienceFilter from "@/Components/Help/AudienceFilter";
import HelpBreadcrumb from "@/Components/Help/HelpBreadcrumb";

/**
 * One help centre section. Meta is applied server-side; see HelpController.
 *
 * 🚨 THERE IS A WAY OUT OF A SECTION NOW (6 Sep 2026). The only route onward
 * used to be the browser's Back button: a reader who opened the wrong shelf had
 * to return to the directory and re-scan nine tiles. `category.siblings` is the
 * other sections, audience-filtered exactly like the page they are on, drawn as
 * a strip under the list.
 *
 * ⚠️ The header band was `bg-gray-100` with a class soup of `!border-*-[0px]`
 * overrides fighting a border nothing had set. It is the help centre's own cream
 * ground with one black rule under it, like every other page here.
 *
 * ⚠️ NO `pb-28` ON THE WRAPPER — `AuthenticatedLayout`'s `<main>` and
 * `retro-bottombar.css` already clear the phone tab bar, twice over.
 */
export default function HelpCategory({
    auth,
    user,
    category,
    audience,
    viewer_audience,
    escalation,
    ai_enabled = false,
    ai_max_question = 200,
}) {
    const count = category.articles.length;

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={`${category.title} — Help Centre`} />

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
                    <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4 sm:pb-8 sm:pt-5">
                        <HelpBreadcrumb trail={[{ label: category.title }]} />

                        <h1 className="mt-2 flex items-start gap-2.5 font-gulfs text-[26px] uppercase leading-[1.02] tracking-tight text-black sm:text-4xl">
                            {category.icon && (
                                <span className="shrink-0 text-[24px] leading-none sm:text-3xl" aria-hidden="true">
                                    {category.icon}
                                </span>
                            )}
                            {category.title}
                        </h1>

                        {category.summary && (
                            <p className="mt-2 max-w-2xl text-[14px] leading-[1.6] text-black/70 sm:text-[15px]">
                                {category.summary}
                            </p>
                        )}

                        <div className="mt-5">
                            <HelpSearchBar
                                ai={ai_enabled}
                                maxQuestion={ai_max_question}
                                placeholder={`Search ${category.title.toLowerCase()}, or ask a question…`}
                            />
                        </div>
                    </div>
                </header>

                {/* 🚨 A <div>, NOT a second <main>. `AuthenticatedLayout` already
                    renders the page's one `main` landmark, so this made two per
                    page — a screen reader's "skip to main content" then has two
                    destinations and neither is the whole page. */}
                <div className="mx-auto w-full max-w-3xl px-4 py-7 sm:py-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <AudienceFilter
                            current={audience}
                            viewerAudience={viewer_audience}
                            basePath={`/help/${category.slug}`}
                            className="sm:max-w-[380px] sm:flex-1"
                        />

                        {count > 0 && (
                            <p className="font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60 sm:pt-3.5">
                                {count} {count === 1 ? "answer" : "answers"}
                            </p>
                        )}
                    </div>

                    {count === 0 ? (
                        <p className="mt-6 rounded-box border-black bg-white p-6 text-[15px] text-black/70">
                            Nothing filed here for this filter yet.
                        </p>
                    ) : (
                        /* ⚠️ ONE frame with hairline rows, not a card per answer.
                           A section IS a list, and eight separately-framed cards
                           read as eight unrelated things. */
                        <ol className="mt-6 divide-y divide-black/10 overflow-hidden rounded-box border-black bg-white">
                            {category.articles.map((a, i) => (
                                <li key={a.slug}>
                                    <Link
                                        href={`/help/${category.slug}/${a.slug}`}
                                        className="help-focus group/row grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-[#F4F4F5] sm:px-5 sm:py-4"
                                    >
                                        {/* The number is the reading ORDER, which is
                                            what `sort_order` means and what the
                                            article pager walks. */}
                                        <span
                                            className="mt-[3px] w-6 shrink-0 font-gulfs text-[12px] uppercase tracking-[0.1em] text-black/55"
                                            aria-hidden="true"
                                        >
                                            {String(i + 1).padStart(2, "0")}
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block text-[15px] font-semibold leading-[1.35] text-black">
                                                {a.title}
                                            </span>
                                            {a.summary && (
                                                <span className="mt-0.5 block text-[13px] leading-[1.5] text-black/60 sm:text-sm">
                                                    {a.summary}
                                                </span>
                                            )}
                                        </span>

                                        <ArrowRight
                                            className="mt-1 h-4 w-4 shrink-0 text-black/45 transition-colors duration-200 group-hover/row:text-black"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    )}

                    {/* ⚠️ A filter the reader cannot see is indistinguishable from
                        missing content — say how many are hidden and offer the way out. */}
                    {category.hidden_by_audience > 0 && (
                        <p className="mt-4 text-[13px] leading-[1.5] text-black/60 sm:text-sm">
                            {category.hidden_by_audience} more{" "}
                            {category.hidden_by_audience === 1 ? "answer is" : "answers are"} written for the other
                            audience.{" "}
                            <Link
                                href={`/help/${category.slug}?for=all`}
                                preserveScroll
                                className="help-focus font-semibold text-[#D1006A] underline underline-offset-4"
                            >
                                Show everything
                            </Link>
                            .
                        </p>
                    )}

                    {category.siblings?.length > 0 && (
                        <section className="mt-10" aria-labelledby="other-sections-heading">
                            <h2
                                id="other-sections-heading"
                                className="font-gulfs text-[11px] uppercase tracking-[0.18em] text-black/60"
                            >
                                Other sections
                            </h2>
                            <ul className="mt-2.5 flex flex-wrap gap-2">
                                {category.siblings.map((s) => (
                                    <li key={s.slug}>
                                        <Link
                                            href={`/help/${s.slug}`}
                                            className="help-focus inline-flex min-h-[40px] items-center gap-2 rounded-box-sm border-black bg-white px-3 text-[13px] font-semibold text-black transition-colors duration-200 hover:bg-[#F4F4F5]"
                                        >
                                            {s.icon && <span aria-hidden="true">{s.icon}</span>}
                                            {s.title}
                                            <span className="font-gulfs text-[10px] uppercase tracking-[0.12em] text-black/60">
                                                {s.article_count}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <div className="mt-10">
                        <StillNeedHelp escalation={escalation} />
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
