import { lazy } from "react";
import BrandToaster from '@/Components/Toast/BrandToaster';
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import NetworkStatusBanner from '@/Components/NetworkStatusBanner';
import PullToRefresh from '@/Components/PullToRefresh';
import FlashMessenger from '@/Components/FlashMessenger';
import MaintenanceBanner from '@/Components/MaintenanceBanner';
import IntercomProvider from '@/Components/IntercomProvider';
import TermsUpdatePopup from '@/Components/TermsUpdatePopup';
import OnboardingNudge from '@/Components/OnboardingNudge';
import { Link, usePage } from '@inertiajs/react';
const Footer = lazy(() => import('@/includes/Footer'));
const Header = lazy(() => import('@/includes/Header'));

export default function Authenticated(props){ 

    const pageprops = usePage().props;
    const { auth, user, children, cart_count } = props;

    /*
     * 🚨 EVERY SPACING CLASS ON THE EMULATION BAR BELOW EMITTED NO CSS.
     * `px-[#12px]`, `py-[#6px]`, `text-[#13px]`, `gap-[#6px]` and `gap-[#8px]` are
     * not valid arbitrary values — the leading `#` makes Tailwind read them as
     * colours and the utility is dropped silently, so the Stop Emulation control
     * had no padding and no font size at all. Same class of silent failure as an
     * opacity modifier on a colour Tailwind cannot resolve.
     *
     * ⚠️ This note is a JS comment, not a JSX one: a `{/* … *\/}` block as the
     * FIRST item inside a parenthesised `&&` return parses as an object literal
     * and takes the whole module down.
     */
    return <>
        {auth?.is_emulated && (
            <div className="bg-purple-600 w-full text-white px-4 sm:px-12 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-wrap gap-2 justify-between items-center fixed bottom-0 z-[100] border-b border-purple-400/30">
                <div className="flex min-w-0 items-center gap-2 text-[13px] sm:text-sm">
                    <div className="truncate">✨ Logged in as: <b>{auth?.user?.name} (@{auth?.user?.username})</b></div>
                </div>
                <div className="shrink-0">
                    <Link href={route("admin.emulate.stop")} className="bg-white hover:bg-neutral-100 text-purple-700 font-bold px-4 py-2 min-h-[44px] rounded-box-sm text-[13px] border transition-colors duration-200 inline-flex items-center gap-1.5 cursor-pointer">Stop Emulation</Link>
                </div>
            </div>
        )}
        <Header auth={auth} cart_count={cart_count} />
        <OnboardingNudge />
        {/* ⚠️ The fixed bottom nav is `md:hidden`, so the clearance must lift at
            `md:` too. At `sm:pb-0` every screen between 640px and 768px — the
            whole large-phone/small-tablet band — had its last ~72px of content
            sitting under the bar. `pb-28` matches the bar's own height plus its
            safe-area padding. */}
        <main className="pb-28 md:pb-0">
            <NetworkStatusBanner />
            <PullToRefresh />
            {children}
        </main>
        <Footer auth={auth} />
        <BottomBar />
        <PwaInstallPrompt />
        <MaintenanceBanner />
        {/*
          * ⚠️ A top-level sibling, NOT inside `<main>` where this used to live.
          * The Toaster positions itself `fixed`, and a `fixed` element resolves
          * against the nearest ancestor carrying a transform / filter /
          * backdrop-filter rather than against the viewport — so nesting it
          * inside page chrome is one animated wrapper away from the toast
          * silently docking to the middle of the page.
          */}
        <BrandToaster />
        <FlashMessenger />
        <TermsUpdatePopup />
        <IntercomProvider />
    </>;
}