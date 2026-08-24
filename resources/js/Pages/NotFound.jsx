import { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { useReducedMotion } from "framer-motion";
import { Home, Compass, Trophy, ArrowLeft } from "lucide-react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import LiveBar from "@/includes/LiveBar";
import pigimg from "../../assets/img/noresultimg.png";

// The three real destinations in the header nav — this is a way out of the
// dead end, not decoration, so it mirrors the nav rather than inventing links.
// Chip colours follow the house rule: black glyphs on pink/mint, white on violet.
const ROUTES = [
    {
        name: "home",
        label: "Home",
        chip: "bg-[#FF007F] text-black",
        Icon: Home,
        blurb: "Start again from the front page.",
    },
    {
        name: "discover",
        label: "Discover",
        chip: "bg-[#05EFB8] text-black",
        Icon: Compass,
        blurb: "Browse creators and what they publish.",
    },
    {
        name: "leaderboard",
        label: "Leaderboard",
        chip: "bg-[#8C52FF] text-white",
        Icon: Trophy,
        blurb: "See who is climbing this week.",
    },
];

export default function NotFound({ auth, user }) {
    const reduceMotion = useReducedMotion();
    const [path, setPath] = useState("");
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        const raw = window.location.pathname + window.location.search;
        setPath(raw.length > 64 ? `${raw.slice(0, 64)}…` : raw);
        setCanGoBack(window.history.length > 1);
    }, []);

    return (
        <Authenticated auth={auth} user={user}>
            <Head title="404 — page not found" />

            <section className="blackbg relative min-h-dvh overflow-hidden pb-24 pt-12 md:pt-16">
                {/* Ambient pink glow, sitting behind the hole. Decoration only. */}
                <div
                    className="pointer-events-none absolute inset-x-0 top-10 z-0 flex justify-center"
                    aria-hidden="true"
                >
                    <div className="h-64 w-64 rounded-full bg-[#FF007F] opacity-25 blur-3xl md:h-96 md:w-96" />
                </div>

                <div className="containerbox relative z-10 px-4">
                    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#FF007F] px-4 py-1.5 font-black uppercase tracking-widest text-black text-[13px]">
                            Error 404
                        </span>

                        {/* The signature: the zero is an actual hole in the page,
                            with the pig fallen into it. */}
                        <div className="mt-6 flex select-none items-center justify-center gap-2 md:gap-4">
                            <span
                                className="font-gulfs uppercase text-white leading-[0.8] text-[92px] md:text-[168px] lg:text-[210px]"
                                aria-hidden="true"
                            >
                                4
                            </span>

                            <span
                                className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#000] bg-white h-[84px] w-[84px] md:h-[152px] md:w-[152px] lg:h-[190px] lg:w-[190px]"
                                aria-hidden="true"
                            >
                                <img
                                    src={pigimg}
                                    alt=""
                                    className={`h-[58%] w-[58%] object-contain ${reduceMotion ? "" : "animate-float"}`}
                                />
                            </span>

                            <span
                                className="font-gulfs uppercase text-white leading-[0.8] text-[92px] md:text-[168px] lg:text-[210px]"
                                aria-hidden="true"
                            >
                                4
                            </span>
                        </div>

                        <h1 className="mt-8 font-gulfs uppercase leading-[1.05] text-white text-[28px] md:text-[40px]">
                            That page isn&apos;t here
                        </h1>

                        <p className="mx-auto mt-4 max-w-md font-CeraGR text-gray-300 leading-[1.55] text-[16px] md:text-[18px]">
                            The link may be broken, or a creator may have changed
                            their username. Pick a way back in below.
                        </p>

                        {path && (
                            <p className="mt-5 max-w-full break-all rounded-box-sm border-2 border-white/25 bg-white/[0.06] px-4 py-2 font-mono text-white/70 text-[13px]">
                                {path}
                            </p>
                        )}
                    </div>
                </div>

                {/* The site's own marquee device, tilted and bled wide so the
                    rotation leaves no bare corner wedges. */}
                <div className="relative z-10 my-12 -ml-[5%] w-[110%] rotate-[-1.5deg]">
                    {reduceMotion ? (
                        <div className="yellowbg border-y-2 border-black py-3 text-center font-GillSans uppercase tracking-widest">
                            404 — page not found
                        </div>
                    ) : (
                        <LiveBar
                            reps={20}
                            color="yellowbg"
                            classes="border-y-2 border-black"
                            text=" 404 — Page Not Found "
                        />
                    )}
                </div>

                <div className="containerbox relative z-10 px-4">
                    <ul className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
                        {ROUTES.map(({ name, label, chip, Icon, blurb }) => (
                            <li key={name}>
                                <Link
                                    href={route(name)}
                                    className="flex h-full min-h-[44px] flex-col rounded-box border-2 border-black bg-white p-6 transition-colors duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]"
                                >
                                    <span
                                        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-box-sm border-2 border-black ${chip}`}
                                    >
                                        <Icon size={20} aria-hidden="true" />
                                    </span>
                                    <span className="font-gulfs uppercase tracking-wider text-black text-[18px]">
                                        {label}
                                    </span>
                                    <span className="mt-1 font-CeraGR text-black/70 leading-[1.5] text-[14px]">
                                        {blurb}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {canGoBack && (
                        <div className="mt-10 text-center">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="inline-flex min-h-[44px] items-center gap-2 font-GillSans uppercase tracking-widest text-white/80 underline transition-opacity duration-200 hover:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F] text-[14px]"
                            >
                                <ArrowLeft size={16} aria-hidden="true" />
                                Go back to the previous page
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </Authenticated>
    );
}
