import { Head, Link } from "@inertiajs/react";
import { useReducedMotion } from "framer-motion";
import { Truck, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import LiveBar from "@/includes/LiveBar";

// House offset-shadow colours, cycled across the highlight cards. A black offset
// shadow disappears on the black page, so these carry the neo-brutalist frame.
const ACCENTS = [
 { shadow: "", chip: "bg-[#FF007F] text-white" },
 { shadow: "", chip: "bg-[#05EFB8] text-black" },
 { shadow: "", chip: "bg-[#8C52FF] text-white" },
];

const ICONS = [Truck, PackageCheck, ShieldCheck];

export default function ComingSoon({
    auth,
    user,
    title = "Coming soon",
    message,
    highlights = [],
}) {
    const reduceMotion = useReducedMotion();

    return (
        <Authenticated auth={auth} user={user}>
            <Head title={`${title} — Coming soon`} />

            <section className="blackbg relative min-h-dvh overflow-hidden pb-28 pt-14 md:pt-20">
                {/* Ambient brand glow — decoration only */}
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                    <div
                        className={`absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-[#FF007F] opacity-30 blur-3xl ${reduceMotion ? "" : "animate-float"}`}
                    />
                    <div
                        className={`absolute bottom-0 left-[-15%] h-64 w-64 rounded-full bg-[#8C52FF] opacity-25 blur-3xl ${reduceMotion ? "" : "animate-float-delayed"}`}
                    />
                </div>

                <div className="containerbox relative z-10 px-4">
                    <div className="mx-auto max-w-3xl text-center">
 <span className="border-2 border-black inline-flex items-center gap-2 rounded-full bg-[#FF007F] px-4 py-1.5 text-sm font-black uppercase tracking-widest text-black">
                            <Sparkles size={16} aria-hidden="true" />
                            Coming soon
                        </span>

                        <h1 className="mt-6 font-gulfs text-4xl uppercase leading-none text-white md:text-5xl lg:text-6xl">
                            <span className="text-gradient-wishlist">{title}</span>
                            <br />
                            is on its way
                        </h1>

                        <p className="mx-auto mt-6 max-w-xl font-CeraGR text-lg leading-relaxed text-gray-300">
                            {message || "We're still building this one. Check back soon."}
                        </p>
                    </div>
                </div>

                {/* The site's own coming-soon device — same marquee the homepage uses */}
                {/* Tilted, so it bleeds wider than the viewport or the rotation
                    leaves bare wedges in the corners. */}
                <div className="relative z-10 my-12 -ml-[5%] w-[110%] rotate-[-1.5deg]">
                    {reduceMotion ? (
                        <div className="yellowbg border-y-2 border-black py-3 text-center font-GillSans uppercase tracking-widest">
                            Coming soon
                        </div>
                    ) : (
 <LiveBar reps={20} color="yellowbg" classes="border-y-2 border-black" text=" Coming Soon " />
                    )}
                </div>

                <div className="containerbox relative z-10 px-4">
                    {highlights.length > 0 && (
                        <ul className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {highlights.map((text, i) => {
                                const accent = ACCENTS[i % ACCENTS.length];
                                const Icon = ICONS[i % ICONS.length];

                                return (
                                    <li
                                        key={text}
                                        className={`rounded-box border-2 border-black bg-white p-6 ${accent.shadow}`}
                                    >
                                        <span
                                            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-box-sm border-2 border-black ${accent.chip}`}
                                        >
                                            <Icon size={22} aria-hidden="true" />
                                        </span>
                                        <p className="font-CeraGR text-base leading-relaxed text-black">
                                            {text}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/discover"
 className="inline-flex min-h-[44px] items-center justify-center rounded-full border-[3px] border-black bg-[#FF007F] px-8 py-3 font-gulfs text-lg uppercase tracking-wider text-black transition-all hover:translate-x-[2px] hover:translate-y-[2px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                        >
                            Explore Discover
                        </Link>

                        <Link
                            href={route("home")}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-full border-[3px] border-white bg-transparent px-8 py-3 font-gulfs text-lg uppercase tracking-wider text-white transition-all hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]"
                        >
                            Back to home
                        </Link>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}
