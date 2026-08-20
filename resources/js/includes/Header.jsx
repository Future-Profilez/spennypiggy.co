// resources/js/includes/Header.jsx

import { Link, usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import spennypiggy from "../../assets/img/logo.png";
import { useState, useEffect, useCallback, useRef } from "react";
import DeviceID from "./DeviceID";
import axios from "axios";
import ChangeCurrency from "@/Components/ChangeCurrency";

import {
    SettingsIcon,
    HeartIcon,
    ShoppingBagIcon,
    ClipboardIcon,
    HandCoinsIcon,
    ShieldCheckIcon,
    SearchIcon,
    ShoppingCartIcon,
    LogoutIcon,
    DashboardIcon,
    UserIcon,
    LockIcon,
    HouseIcon,
    InfoIcon,
} from "@animateicons/react/lucide";
/**
 * 🚨 THE HAMBURGER AND THE CLOSE ICON ARE STATIC `lucide-react`, NOT
 * `@animateicons/react`. Do not "restore" the animated ones.
 *
 * Both animated versions render wrongly in the installed PWA, and for two
 * separate reasons that share a cause — they animate SVG CHILDREN with
 * framer-motion:
 *
 *   · `MenuIcon` transforms its three bars with `transformOrigin: "left center"`.
 *     On an SVG child that keyword resolves against the nearest SVG VIEWPORT,
 *     not the element's own box, unless `transform-box: fill-box` is set — and
 *     WKWebView, which is what an installed PWA runs on iOS, resolves it
 *     differently from Chrome. The bars land in the wrong place.
 *   · `XIcon` animates `pathLength`, which framer-motion emulates with
 *     `stroke-dasharray`/`stroke-dashoffset`. If the initial variant does not
 *     land, the cross renders half-drawn or not at all.
 *
 * And the animation could never have paid for that: BOTH are triggered by
 * `onMouseEnter`. There is no hover on a phone, so in the PWA the library was
 * pure cost — the rendering fault with none of the effect.
 */
import { Calendar, Shield as ShieldIcon, PiggyBank, UserX, Menu as MenuIcon, X as XIcon } from "lucide-react";
import MagicBellNotification from "@/Pages/webpush/MagicBellNotification";
import { FaFileInvoice } from "react-icons/fa";

/*
 * How long after the drawer last SCROLLED a click is swallowed.
 *
 * ⚠️ Long enough to cover the tap that arrests iOS momentum, short enough that
 * someone who waits for the list to settle and then taps is never refused —
 * a menu whose links stop working reads as a far worse bug than the one this
 * fixes. Measured against real momentum: a flick settles well inside 300ms of
 * its last `scroll` event.
 */
const SCROLL_CLICK_GUARD_MS = 300;

export default function Header({ classMagicword }) {
    const { global_currency, auth } = usePage().props;
    const { url } = usePage();

    const getNavLinkClass = (path) => {
        let pathName = path;
        if (typeof path === "string" && path.startsWith("http")) {
            try {
                pathName = new URL(path).pathname;
            } catch (e) {}
        }
        const isActive =
            url === pathName ||
            (typeof pathName === "string" &&
                pathName !== "/" &&
                url.startsWith(pathName));
        return `relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] pr-6 border-l-4 transition-all duration-200 ${
            isActive
                ? "border-black bg-black/[0.06] text-black"
                : "border-transparent hover:border-black text-black/90 hover:text-black"
        }`;
    };

    const deviceid = DeviceID();
    const [isActive, setActive] = useState(false);
    const [shows, setShows] = useState(false);
    const menuTouchStartRef = useRef({ x: 0, y: 0 });
    const suppressMenuClickUntilRef = useRef(0);

    const toggleClass = () => {
        setActive(!isActive);
        setTimeout(() => {
            setShows(!isActive);
        }, 300);
    };

    const handleMenuTouchStart = useCallback((e) => {
        const touch = e.touches?.[0];
        if (!touch) return;

        menuTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }, []);

    const handleMenuTouchMove = useCallback((e) => {
        const touch = e.touches?.[0];
        if (!touch) return;

        const deltaX = Math.abs(touch.clientX - menuTouchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - menuTouchStartRef.current.y);

        if (deltaX > 8 || deltaY > 8) {
            suppressMenuClickUntilRef.current = Date.now() + 350;
        }
    }, []);

    /*
     * 🚨 MOMENTUM SCROLLING FIRES NO `touchmove`, so the guard above cannot see
     * it. On iOS the list keeps travelling after the finger lifts, and the tap
     * that ARRESTS that momentum is a fresh touchstart/touchend with zero
     * movement — indistinguishable from a deliberate tap on whatever happens to
     * be under the thumb. That is the "menu scroll karo aur koi bhi link khul
     * jaata hai" report, and it is why the drawer needed a second signal.
     *
     * `scroll` DOES fire throughout momentum, so "the list moved within the
     * last SCROLL_CLICK_GUARD_MS" is the honest test. Wait for it to settle and
     * a real tap still works; tap to stop it and nothing opens.
     */
    const lastMenuScrollAtRef = useRef(0);
    const handleMenuScroll = useCallback(() => {
        lastMenuScrollAtRef.current = Date.now();
    }, []);

    /*
     * 🚨 CAPTURE PHASE, ON THE SCROLL CONTAINER — never per link. The two
     * per-link guards this replaces covered `NavLinkWithIcon` and the profile
     * row; the OTHER ~20 rows in this drawer are plain `onClick={toggleClass}`
     * and were completely unguarded, so a scroll landed on whichever one it
     * stopped over. A capture handler on the scroller intercepts every click
     * inside it, including links added later, so the rule cannot drift out of
     * step with the markup again.
     *
     * ⚠️ It must NOT wrap the close button or the header controls — those sit
     * OUTSIDE this container, and suppressing a close tap right after a scroll
     * would leave the drawer feeling stuck.
     */
    const swallowMenuClick = useCallback((e) => {
        const now = Date.now();
        const scrolling =
            now - lastMenuScrollAtRef.current < SCROLL_CLICK_GUARD_MS;

        if (now < suppressMenuClickUntilRef.current || scrolling) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, []);

    const [count, setCount] = useState();

    const fetchCounter = useCallback(async () => {
        try {
            const resp = await axios.get(`/counter/${deviceid}`);
            setCount(Number(resp.data.counter));
        } catch (_err) {
            console.error("Error fetching cart counter:", _err);
        }
    }, [deviceid, auth?.user?.id]);

    useEffect(() => {
        const handleCartCounterRefresh = (event) => {
            // handle if needed
        };

        window.addEventListener(
            "cartCounterRefreshed",
            handleCartCounterRefresh,
        );
        fetchCounter();
        return () => {
            window.removeEventListener(
                "cartCounterRefreshed",
                handleCartCounterRefresh,
            );
        };
    }, [fetchCounter]);

    const NavLinkWithIcon = ({
        href,
        icon: Icon,
        label,
        onClick,
        activeColor,
        isExternal = false,
        ...props
    }) => {
        const iconRef = useRef(null);
        const timeoutRef = useRef(null);
        const Component = isExternal ? "a" : Link;

        useEffect(() => {
            const startLoop = () => {
                if (iconRef.current) {
                    iconRef.current.startAnimation?.();
                }
                const nextDelay = 4000 + Math.random() * 3000;
                timeoutRef.current = setTimeout(startLoop, nextDelay);
            };

            const initialDelay = Math.random() * 3000;
            const initialTimeout = setTimeout(startLoop, initialDelay);

            return () => {
                clearTimeout(initialTimeout);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
        }, []);

        const handleNavClick = (e) => {
            if (Date.now() < suppressMenuClickUntilRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            onClick?.(e);
        };

        return (
            <li>
                <Component
                    onClick={handleNavClick}
                    href={href}
                    onMouseEnter={() => iconRef.current?.startAnimation?.()}
                    /* `rounded-xl` in this config is 3rem (48px), not Tailwind's
                       0.75rem — the drawer's rows were nearly pills while every
 other control in the menu sat on the 20/30 tokens. The lift
 stays: it is paired with a hard offset shadow, which is the
 house press idiom rather than a hover-scale. */
 className={`${getNavLinkClass(href)} rounded-box-sm border-[3px] border-transparent hover:border-black ${activeColor} hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                    {...(isExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    {...props}
                >
                    <span className="inline-flex justify-center items-center ml-2">
                        <Icon
                            ref={iconRef}
                            className="text-gray-800 group-hover:text-black transition-colors"
                            size={24}
                            duration={1.5}
                        />
                    </span>
                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                        {label}
                    </span>
                </Component>
            </li>
        );
    };

    return (
        <>
            {/* ── Deep teal, three zones ───────────────────────────────────
                The header was a flat `#1a1a1a` charcoal band — a colour that
                appears nowhere else on the site, which is what made it read as a
                separate object sitting on the page rather than part of it.

                🚨 THE LOGO CHOSE THE COLOUR. It is pink lettering with a yellow
                outline, so on a PINK bar the lettering disappears and on a YELLOW
                bar the outline does — both were ruled out however good they look
                as a swatch. Mint at full strength (#05EFB8) is a LIGHT ground, so every control on
                it is black — white on mint is 1.6:1 and invisible. Black on mint
                measures 12.8:1.

                ⚠️ Do NOT re-tint the logo. It used to carry `brightness(0)` to
                force it dark; that throws away the asset. It is used at full
                colour and the ground is chosen to suit it, not the other way round.

                ── Placement ──
                The old bar put NINE things in one row at one weight: menu, star,
                wordmark, logo, currency, search, basket and two buttons — three
                utilities, three destinations, three actions, evenly spaced and
                therefore unreadable as groups. It is now THREE ZONES separated by
                real space: brand, then where you can go, then what you can do.

                ⚠️ The 🌟 emoji became the word "Leaderboard" — it linked there
                already, and an emoji beside a text link to the same place was the
                duplication that made the left group look like three unrelated
                things. No destination was removed. */}
            {/* ⚠️ `top` is a VARIABLE, not 0. The install banner is a full-bleed
                bar ABOVE this header (client direction, 16 Aug 2026), so when it
                is on screen the header has to start below it. The banner sets
                `--sp-topbanner-h` from its own measured height and clears it on
                dismiss; with no banner the fallback is 0 and this is byte-for-byte
                the old behaviour. Never type the banner's height here — it grows
                when its steps expand. */}
            <div
                className="headermain fixed left-0 w-full z-[100] py-[14px] bg-[#FF007F]"
                style={{ top: 'var(--sp-topbanner-h, 0px)' }}
            >
                <div className="container mx-auto px-4">
                    <div className="header flex w-full items-center gap-3">
                        {/* ── Zone 1 · brand ── */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div
                                className="menu-toggle cursor-pointer cartLink relative hidden md:block"
                                onClick={toggleClass}
                            >
 <MenuIcon size={48} color="#000000" />
                            </div>

 <div className="spennylogo md:ps-4 max-w-[150px] md:max-w-[180px]">
                            {/* The logo is a link home, so it is a tap target and
                                the PWA floor applies — it measured 34px tall. The
                                image is unchanged; only the hit area grows. */}
 {/* `!block inline-flex` set `display` twice — the
 `!important` block won, so `items-center` never
 applied. One display, and a real tap target. */}
 <Link href={route("home")} className="inline-flex min-h-[44px] items-center">
                                <img
                                    alt="Spenny Piggy - Exclusive Content, Memberships & Creator Support"
                                    height={60}
                                    width={210}
                                    src={spennypiggy}
                                    loading="eager"
                                />
                            </Link>
                        </div>
                        </div>

                        <span className="flex-1" aria-hidden="true"></span>

                        {/* ── Zone 2 · where you can go ──
                            Words, not icons. These three destinations existed only
                            behind the hamburger (or as a bare emoji), so a visitor
                            could not see where to go without opening something.
                            Below `lg` they fold back into the drawer, which already
                            lists all three. */}
                        <nav className="hidden lg:flex items-center gap-7 shrink-0">
                            {[
                                { label: "Discover", href: route("discover"), active: url.startsWith("/discover") },
                                { label: "Leaderboard", href: "/leaderboard", active: url.startsWith("/leaderboard") },
                                { label: "Oink Store", href: "/giftstore", active: url.startsWith("/giftstore") },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`font-gulfs uppercase text-[18px] tracking-wider transition-colors text-[#E6EA7B] hover:text-[#E6EA7B]/80 ${
                                        item.active ? "underline underline-offset-8 decoration-2" : ""
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <span className="flex-1" aria-hidden="true"></span>

                        {/* ── Zone 3 · what you can do ── */}
                        <div className="cartLogin shrink-0">
                            <ChangeCurrency
                                defaultvalue={global_currency}
                                changer={true}
                            />

                            {auth && auth.user ? (
                                <div className="ms-3">
                                    <MagicBellNotification
                                        word={classMagicword}
                                    />
                                </div>
                            ) : (
                                ""
                            )}

 {/* ⚠️ Desktop only (client direction, 12 Aug 2026).
 On a phone the bar carries the logo, currency,
 cart, Sign Up and the hamburger already, and
 Discover is the first row inside the menu — so
 this was a second way to the same place, taking
 44px from a bar that has none to spare. */}
                            <Link
                                title="Discover"
                                href={route("discover")}
 className="ms-2 hidden md:ms-3 md:block discover-icon"
                            >
                                {/* ⚠️ Ghost, not a solid fill. These were three
                                    saturated pink circles, which is three accents —
                                    and three accents is no accent. Sign Up is the
                                    only filled control on the bar, because it is the
                                    one thing the page is trying to cause. */}
 <div className="rounded-full w-11 h-11 md:w-12 md:h-12 flex items-center justify-center bg-white hover:bg-white/85 transition-colors">
 <SearchIcon color="#000000" />
                                </div>
                            </Link>

                            <Link
                                title="cart page"
                                href={route("cart")}
                                as="button"
                                className={`cartLink ms-3 relative flex ${
                                    auth?.user && window?.innerWidth < 768
                                        ? "hidden"
                                        : ""
                                }`}
                            >
 <div className="rounded-full w-11 h-11 md:w-12 md:h-12 flex items-center justify-center bg-white hover:bg-white/85 transition-colors">
 <ShoppingCartIcon color="#000000" />
                                </div>
                                {count > 0 ? (
                                    <span className="site-counter block">
                                        {count}
                                    </span>
                                ) : (
                                    ""
                                )}
                            </Link>

                            {auth?.user?.username || false ? (
                                ""
                            ) : (
                                <div className="hidden lg:flex gap-2 ms-3 ">
                                    <Link
                                        href={route("login")}
 className="bg-white hover:bg-gray-200 uppercase text-lg font-gulfs rounded-full px-5 py-2 text-black  transition-colors"
                                    >
                                        Login
                                    </Link>
                                    {/* ⚠️ MINT, and it cannot be pink. The bar is
                                        pink and the logo's lettering is pink, so a
                                        third pink would be invisible between them.
                                        Mint is the widest gap from this ground in
                                        the whole palette and carries black type at
                                        12.8:1 — the one filled action on the bar. */}
                                    <Link
                                        href={route("register")}
                                        className="hidden xl:block bg-[#05EFB8] text-[#04120E] uppercase text-lg font-gulfs rounded-full px-5 py-2 hover:brightness-105 transition-[filter]"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                            <div
                                className="block ps-2  me-[-10px] md:hidden menu-toggle cursor-pointer cartLink relative"
                                onClick={toggleClass}
                            >
                                <MenuIcon size={48} color="#000000" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Clears the fixed header. ⚠️ It must include the SAME safe-area inset the
                header pads by, or in an installed iOS app the first content sits
                under the bar by exactly the height of the status bar.
                ⚠️ And the install banner's height, for the same reason — the header
                moved down by it, so everything below has to as well. */}
            <div
                className="h-[67px] sm:h-[67px] md:h-[80px] lg:h-[80px] xl:h-[80px]"
                style={{
                    marginTop:
                        'calc(env(safe-area-inset-top, 0px) + var(--sp-topbanner-h, 0px))',
                }}
            ></div>

            {isActive ? (
                <div
                    className={`fixed top-0 z-[1000001] h-full w-full rounded-r-xl
                    transform transition-transform duration-600 ease-in-out
                    flex flex-col p-8 bg-[#0008] select-none opacity-0
                    `}
                    onClick={toggleClass}
                ></div>
            ) : (
                ""
            )}
            <div
                className={`fixed top-0 left-0 z-[1000002] h-full w-full md:w-[350px] rounded-r-xl
                    transform transition-transform duration-500 ease-in-out 
                    ${isActive ? "translate-x-0" : "-translate-x-full"}
                    flex flex-col p-8 select-none ${isActive ? "Open" : null}`}
            >
                {/* ⚠️ `max-h-dvh`, not `max-h-screen` — a phone's `100vh` is taller
                    than the visible viewport, so the drawer's scroll container was
                    sized past the bottom of the screen in the installed PWA. */}
                <div className="fixed menu p-2 z-10 top-0 customScrollbar left-0 bg-[#fdfbf7] max-h-dvh overflow-auto w-full sm:max-w-[350px] h-full">
                    <button
                        onClick={toggleClass}
                        aria-label="Close menu"
                        /* ⚠️ The drawer is `fixed top-0` and the app declares
                           `apple-mobile-web-app-status-bar-style: black-translucent`,
                           so y=0 is UNDER the iOS status bar — a bare `top-4` put this
                           button on top of the clock and the battery. The header pads
                           for the same inset; this panel is a separate fixed layer and
                           has to do it for itself. */
                        style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
                        className="absolute h-[45px] min-w-[45px] right-4 md:right-4 bg-white border-[3px] border-black rounded-box-sm p-1 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all z-20"
                    >
                        <XIcon color="#000" size={32} />
                    </button>
                    <div
                        className="overflow-y-auto overflow-x-hidden flex-grow"
                        onTouchStart={handleMenuTouchStart}
                        onTouchMove={handleMenuTouchMove}
                        onScroll={handleMenuScroll}
                        onClickCapture={swallowMenuClick}
                    >
                        {/* Tracks the close button, which is offset by the same
                            inset — without it the profile row slides under the
                            status bar on a notched phone. */}
                        <div
                            className="pb-[110px] px-2"
                            style={{ paddingTop: 'calc(60px + env(safe-area-inset-top, 0px))' }}
                        >
                            {auth?.user && (
                                <Link
                                    href={route("user.show", {
                                        username: auth.user.username,
                                    })}
                                    onClick={(e) => {
                                        if (
                                            Date.now() <
                                            suppressMenuClickUntilRef.current
                                        ) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return;
                                        }
                                        toggleClass();
                                    }}
                                    /* No offset-shadow partner on this row, so the bare
                                       hover lift is the banned "grow on hover" gimmick
                                       by another name. A light surface shifts instead. */
                                    className="flex items-center gap-4 p-4 mb-6 rounded-box-sm transition-colors duration-200 hover:bg-black/[0.04] group"
                                >
                                    <div className="relative">
                                        <div className="w-17 h-17 rounded-box-sm border-[3px] border-black overflow-hidden bg-pink-100 ">
                                            <img
                                                src={auth.user.avatar_url}
                                                alt={auth.user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-[2px] border-black rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-black text-base uppercase tracking-tight truncate leading-tight">
                                            {auth.user.name}
                                        </span>
                                        <span className="text-black/60 text-xs font-bold uppercase tracking-widest truncate">
                                            @{auth.user.username}
                                        </span>
                                        <div className="mt-1 inline-flex items-center gap-1">
                                            <span className="text-[12px] font-black bg-[#FF007F] text-black px-2 py-0.5 rounded-full border border-black uppercase leading-[1.4]">
                                                {auth.user.role == 1
                                                    ? "Creator"
                                                    : "User"}
                                            </span>
                                            {auth.user.role == 1 &&
                                                auth.user.default_currency && (
                                                    <span className="text-[12px] font-black bg-yellow-300 text-black px-2 py-0.5 rounded-full border border-black uppercase leading-[1.4]">
                                                        {
                                                            auth.user
                                                                .default_currency
                                                        }
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </Link>
                            )}
                            <ul className="flex flex-col pt-[0px] space-y-4">
                                <>
                                    {auth?.user?.username ? (
                                        <>
                                            <NavLinkWithIcon
                                                href="/account"
                                                onClick={toggleClass}
                                                icon={SettingsIcon}
                                                label="My Account"
                                                activeColor="hover:bg-yellow-300"
                                            />
                                            <NavLinkWithIcon
                                                href={`/${auth?.user?.username || ""}`}
                                                onClick={toggleClass}
                                                icon={HeartIcon}
                                                label={
                                                    auth?.user?.role == 1
                                                        ? "My Wishlist"
                                                        : "My Profile"
                                                }
                                                activeColor="hover:bg-[#FF007F]"
                                            />
                                            <NavLinkWithIcon
                                                href="https://billing.stripe.com/p/login/4gw3eK9Za0sDf045kk"
                                                icon={Calendar}
                                                label="Subscription Billing"
                                                activeColor="hover:bg-[#A2E4B8]"
                                                isExternal={true}
                                            />
                                        </>
                                    ) : (
                                        ""
                                    )}

                                    {auth?.user?.username && (
                                        <>
                                            <NavLinkWithIcon
                                                href="/shop"
                                                onClick={toggleClass}
                                                icon={ShoppingBagIcon}
                                                label="Shop"
                                                activeColor="hover:bg-[#b892ff]"
                                            />
                                            {auth?.user?.role === 1 && (
                                                <NavLinkWithIcon
                                                    href="/piggy-pots"
                                                    onClick={toggleClass}
                                                    icon={PiggyBank}
                                                    label="Piggy Pots"
                                                    activeColor="hover:bg-[#A2E4B8]"
                                                />
                                            )}
                                        </>
                                    )}

                                    {auth && auth.user ? (
                                        <NavLinkWithIcon
                                            href="/task/dashboard"
                                            activeColor="hover:bg-[#A2E4B8]"
                                            onClick={toggleClass}
                                            icon={ClipboardIcon}
                                            label="Tasks"
                                        />
                                    ) : (
                                        ""
                                    )}

                                    {auth &&
                                    auth.user &&
                                    auth.user.role == 1 ? (
                                        <>
                                            <NavLinkWithIcon
                                                href="/financial/dashboard/payouts"
                                                onClick={toggleClass}
                                                icon={DashboardIcon}
                                                label="Payouts"
                                                activeColor="hover:bg-[#A2E4B8]"
                                            />
                                            <NavLinkWithIcon
                                                href="/earnings"
                                                onClick={toggleClass}
                                                icon={HandCoinsIcon}
                                                label="Earnings"
                                                activeColor="hover:bg-[#ff6b6b]"
                                            />
                                            <NavLinkWithIcon
                                                href={route(
                                                    "creator.disputes.index",
                                                )}
                                                onClick={toggleClass}
                                                icon={ShieldCheckIcon}
                                                label="Dispute & Refund Center"
                                                activeColor="hover:bg-[#A2E4B8]"
                                            />
                                            {auth?.user?.role == 1 && (
                                                <NavLinkWithIcon
                                                    href={route(
                                                        "financial.dashboard",
                                                    )}
                                                    onClick={toggleClass}
                                                    icon={DashboardIcon}
                                                    label="Finance & Tax"
                                                    activeColor="hover:bg-yellow-300"
                                                />
                                            )}
                                            <NavLinkWithIcon
                                                href="/membership-dashboard"
                                                onClick={toggleClass}
                                                icon={HouseIcon}
                                                label="Membership Dashboard"
                                                activeColor="hover:bg-[#FF007F]"
                                            />
                                            {/* Bill Dashboard - Using FaFileInvoice icon */}
                                            {/* <NavLinkWithIcon
                                                href="/billing-dashboard"
                                                onClick={toggleClass}
                                                icon={FaFileInvoice}
                                                label="Bill Dashboard"
                                                activeColor="hover:bg-[#007BFF]"
                                            /> */}
                                            {/* <NavLinkWithIcon
                                                href="/admin/feature-suggestions"
                                                onClick={toggleClass}
                                                icon={InfoIcon}
                                                label="Feature Suggestions"
                                                activeColor="hover:bg-[#EFEA7B]"
                                            /> */}
                                        </>
                                    ) : (
                                        ""
                                    )}
                                    {auth?.user?.username ? (
                                        <NavLinkWithIcon
                                            href="/history"
                                            onClick={toggleClass}
                                            icon={HandCoinsIcon}
                                            label="Support History"
                                            activeColor="hover:bg-[#b892ff]"
                                        />
                                    ) : (
                                        ""
                                    )}
                                    {auth?.user?.username ? (
                                        <NavLinkWithIcon
                                            href="/my-purchases"
                                            onClick={toggleClass}
                                            icon={ShoppingBagIcon}
                                            label="My Purchases"
                                            activeColor="hover:bg-[#b892ff]"
                                        />
                                    ) : (
                                        ""
                                    )}
                                </>

                                {auth?.user?.username ? (
                                    <NavLinkWithIcon
                                        href={route("blocked.users")}
                                        onClick={toggleClass}
                                        icon={UserX}
                                        label="Blocked User List"
                                        activeColor="hover:bg-[#b892ff]"
                                    />
                                ) : (
                                    ""
                                )}
                                {auth?.user?.username ? (
                                    ""
                                ) : (
                                    <>
                                        <NavLinkWithIcon
                                            href={route("register")}
                                            onClick={toggleClass}
                                            icon={UserIcon}
                                            label="Sign Up"
                                            activeColor="hover:bg-[#A2E4B8]"
                                        />
                                        <NavLinkWithIcon
                                            href={route("login")}
                                            onClick={toggleClass}
                                            icon={LockIcon}
                                            label="Login"
                                            activeColor="hover:bg-yellow-300"
                                        />
                                    </>
                                )}

                                <NavLinkWithIcon
                                    href={route("leaderboard")}
                                    onClick={toggleClass}
                                    icon={DashboardIcon}
                                    label="Leaderboard"
                                    activeColor="hover:bg-[#ff6b6b]"
                                />
                                <NavLinkWithIcon
                                    href="/giftstore"
                                    onClick={toggleClass}
                                    icon={HeartIcon}
                                    label="Oink Store"
                                    activeColor="hover:bg-[#b892ff]"
                                />
                                {auth?.user?.role == 1 && (
                                    <>
                                        <NavLinkWithIcon
                                            href="/refer-and-earn"
                                            onClick={toggleClass}
                                            icon={HandCoinsIcon}
                                            label="Refer & Earn"
                                            activeColor="hover:bg-[#A2E4B8]"
                                        />
                                    </>
                                )}

                                <NavLinkWithIcon
                                    href={route("how-spenny-piggy-works")}
                                    onClick={toggleClass}
                                    icon={SettingsIcon}
                                    label="How it works"
                                    activeColor="hover:bg-yellow-300"
                                />

                                <NavLinkWithIcon
                                    href="#"
                                    onClick={toggleClass}
                                    icon={InfoIcon}
                                    label="Need help ?"
                                    activeColor="hover:bg-[#FF007F]"
                                />
                                <li className="bg-black h-[3px] w-full max-w-[85%] m-auto mt-3"></li>
                            </ul>
                            <ul className="pt-3 text-black space-y-2">
                                <NavLinkWithIcon
                                    href="https://blog.spennypiggy.co"
                                    onClick={toggleClass}
                                    icon={DashboardIcon}
                                    label="Blog"
                                    activeColor="hover:bg-[#A2E4B8]"
                                    isExternal={true}
                                />
                                <NavLinkWithIcon
                                    href={route("terms-and-conditions")}
                                    onClick={toggleClass}
                                    icon={ShieldCheckIcon}
                                    label="Privacy Policy"
                                    activeColor="hover:bg-yellow-300"
                                />
                                <NavLinkWithIcon
                                    href={route("terms-and-conditions")}
                                    onClick={toggleClass}
                                    icon={InfoIcon}
                                    label="Cookies Policy"
                                    activeColor="hover:bg-[#FF007F]"
                                />
                                <NavLinkWithIcon
                                    href={route("terms-and-conditions")}
                                    onClick={toggleClass}
                                    icon={DashboardIcon}
                                    label="Acceptable Use Policy"
                                    activeColor="hover:bg-[#b892ff]"
                                />
                                <NavLinkWithIcon
                                    href={route("terms-and-conditions")}
                                    onClick={toggleClass}
                                    icon={ShieldCheckIcon}
                                    label="Terms"
                                    activeColor="hover:bg-yellow-300"
                                />
                                <NavLinkWithIcon
                                    href={route("promotion-terms")}
                                    onClick={toggleClass}
                                    icon={HeartIcon}
                                    label="Promotion Terms"
                                    activeColor="hover:bg-[#FF007F]"
                                    isExternal={true}
                                />

                                {auth && auth?.user?.username ? (
                                    <NavLinkWithIcon
                                        href={route("logout")}
                                        onClick={toggleClass}
                                        method="post"
                                        as="button"
                                        icon={LogoutIcon}
                                        label="Logout"
                                        activeColor="hover:bg-[#ff6b6b]"
                                    />
                                ) : (
                                    ""
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
