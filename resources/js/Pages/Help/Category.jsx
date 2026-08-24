import { Head, Link } from "@inertiajs/react";
import { ChevronLeft } from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import HelpSearchBar from "@/Components/Help/HelpSearchBar";
import StillNeedHelp from "@/Components/Help/StillNeedHelp";
import AudienceFilter from "@/Components/Help/AudienceFilter";

/** One help centre section. Meta is applied server-side; see HelpController. */
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
    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={`${category.title} — Help Centre`} />

            <div className="min-h-dvh bg-gray-50 pb-28">
                <header className="!border-t-[0px] !border-l-[0px] !border-r-[0px] border-b-[0px]  border-gray-400 bg-gray-100">
                    <div className="mx-auto w-full max-w-3xl px-4 py-8">
                        <Link
                            href="/help"
                            className="inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-black/60 hover:text-black"
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            Help Centre
                        </Link>

                        <h1 className="mt-2 flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-black sm:text-4xl">
                            {category.icon && <span aria-hidden="true">{category.icon}</span>}
                            {category.title}
                        </h1>

                        {category.summary && (
                            <p className="mt-2 max-w-2xl text-[15px] leading-[1.6] text-black/70">
                                {category.summary}
                            </p>
                        )}

                        <div className="mt-5">
                            <HelpSearchBar ai={ai_enabled} maxQuestion={ai_max_question} placeholder={`Search ${category.title.toLowerCase()}, or ask a question…`} />
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-3xl px-4 py-8">
                    <AudienceFilter
                        current={audience}
                        viewerAudience={viewer_audience}
                        basePath={`/help/${category.slug}`}
                    />

                    {category.articles.length === 0 ? (
                        <p className="mt-6 rounded-box border-2 border-black bg-white p-6 text-[15px] text-black/70">
                            Nothing filed here for this filter yet.
                        </p>
                    ) : (
                        <ul className="mt-6 divide-y divide-black/10 overflow-hidden rounded-box border-black bg-white">
                            {category.articles.map((a) => (
                                <li key={a.slug}>
                                    <Link
                                        href={`/help/${category.slug}/${a.slug}`}
                                        className="block px-5 py-4 hover:bg-black/[0.03]"
                                    >
                                        <span className="block text-[15px] font-semibold text-black">{a.title}</span>
                                        <span className="mt-0.5 block text-sm leading-[1.55] text-black/60">
                                            {a.summary}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* ⚠️ A filter the reader cannot see is indistinguishable from
                        missing content — say how many are hidden and offer the way out. */}
                    {category.hidden_by_audience > 0 && (
                        <p className="mt-4 text-sm text-black/60">
                            {category.hidden_by_audience} more{" "}
                            {category.hidden_by_audience === 1 ? "answer is" : "answers are"} written for the other
                            audience.{" "}
                            <Link
                                href={`/help/${category.slug}?for=all`}
                                preserveScroll
                                className="font-semibold text-[#FF007F] underline"
                            >
                                Show everything
                            </Link>
                            .
                        </p>
                    )}

                    <div className="mt-10">
                        <StillNeedHelp escalation={escalation} />
                    </div>
                </main>
            </div>
        </Authenticated>
    );
}
