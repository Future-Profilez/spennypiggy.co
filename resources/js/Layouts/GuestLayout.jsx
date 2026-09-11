import BrandToaster from '@/Components/Toast/BrandToaster';
import Header from '@/includes/Header';
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import NetworkStatusBanner from '@/Components/NetworkStatusBanner';
import PullToRefresh from '@/Components/PullToRefresh';
import FlashMessenger from '@/Components/FlashMessenger';
import MaintenanceBanner from '@/Components/MaintenanceBanner';
import IntercomProvider from '@/Components/IntercomProvider';
import Footer from '@/includes/Footer';
import TermsUpdatePopup from '@/Components/TermsUpdatePopup';
import OnboardingNudge from '@/Components/OnboardingNudge';
import { usePage } from '@inertiajs/react';
export default function Guest({children, auth, className}) {
    const pageprops = usePage().props;
    return <div className={`guest-layout ${className || ''}`}>
        {/* 🚨 SKIP LINK — the first focusable element on the page, and there was
            none. A keyboard user landed in the install banner and then had to tab
            the entire header, the currency pill, the bell, search, basket, login
            and sign-up before reaching any content. Visually hidden until focused,
            then a real black-on-yellow control (brand yellow on black is 16.4:1).
            ⚠️ `<main>` below carries the matching `id`; without it this scrolls
            nowhere and the failure is silent. */}
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000003]
                       focus:inline-flex focus:min-h-[44px] focus:items-center focus:rounded-box-sm
                       focus:bg-[#E6EA7B] focus:px-5 focus:font-gulfs focus:uppercase focus:tracking-wider
                       focus:text-black focus:outline-none focus:ring-4 focus:ring-black"
        >
            Skip to content
        </a>
        <Header auth={auth ||''} />
        {/* ⚠️ IN FLOW, and above every other strip — it is a banner now, not a
            modal, so its position in the tree IS its position on the page. It
            used to sit below `<main>` because a fixed scrim does not care. */}
        <PwaInstallPrompt />
        <OnboardingNudge />
        {/* ⚠️ `tabIndex={-1}` is what makes the skip link actually work. Without
            it the anchor moves the browser's sequential-focus starting point but
            leaves `document.activeElement` on `<body>`, so a screen reader's
            reading cursor never moves — the link appears to work in Chrome and
            does nothing for the user it exists for. `-1` makes `<main>`
            programmatically focusable without adding it to the tab order. */}
        {/* 🚨 THE BOTTOM BAR PAINTED OVER THE LAST 53px OF EVERY GUEST-LAYOUT
            PAGE. `AuthenticatedLayout` reserves that space on its own `<main>`;
            this one never did, and it renders the same `<BottomBar/>` below —
            so on a phone the foot of the task form (its terms checkbox and
            "Continue to Summary" button) sat behind the fixed pink bar. The
            `check-bottom-bar` scanner cannot see this: nothing here is fixed or
            sticky, it is ordinary content running under something that is.

            ⚠️ Gated on `body:has(.retro-bottom-bar)` because `BottomBar`
            returns null for a signed-out visitor — an unconditional pad would
            leave a strip of dead space under every login and signup screen.
            ⚠️ `md:`, never `sm:` — the bar is `md:hidden`, so it is still there
            at 640–767px.
            ⚠️ Measured from the bar's OWN tokens rather than a typed number:
            its height and safe-area inset both vary, and a literal was 5px
            short of the tallest case elsewhere in the app. */}
        <main
            id="main-content"
            tabIndex={-1}
            className="focus:outline-none [body:has(.retro-bottom-bar)_&]:pb-[calc(var(--sp-bottombar-h)+var(--sp-bottombar-inset)+1rem)] md:[body:has(.retro-bottom-bar)_&]:pb-0"
        >
            <NetworkStatusBanner />
            <PullToRefresh />
            {children}
        </main>
        <Footer auth={auth ||''} />
        <BrandToaster />
        <BottomBar />
        <MaintenanceBanner />
        <FlashMessenger />
        <TermsUpdatePopup />
        <IntercomProvider />
    </div>
}


