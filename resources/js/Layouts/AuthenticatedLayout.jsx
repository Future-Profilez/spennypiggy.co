import { lazy } from "react";
import { Toaster } from 'react-hot-toast';
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import NetworkStatusBanner from '@/Components/NetworkStatusBanner';
import PullToRefresh from '@/Components/PullToRefresh';
import FlashMessenger from '@/Components/FlashMessenger';
import IntercomProvider from '@/Components/IntercomProvider';
import TermsUpdatePopup from '@/Components/TermsUpdatePopup';
import OnboardingNudge from '@/Components/OnboardingNudge';
import { Link, usePage } from '@inertiajs/react';
const Footer = lazy(() => import('@/includes/Footer'));
const Header = lazy(() => import('@/includes/Header'));

export default function Authenticated(props){ 

    const pageprops = usePage().props;
    const { auth, user, children, cart_count } = props;

    return <>
        {auth?.is_emulated && (
            <div className="bg-purple-600 w-full text-white px-12 py-2 flex justify-between items-center fixed bottom-0 z-[100] shadow-md border-b border-purple-400/30">
                <div className="flex items-center gap-[#8px]">
                    <div>✨ Logged in as: <b>{auth?.user?.name} (@{auth?.user?.username})</b></div>
                </div>
                <div>
                    <Link href={route("admin.emulate.stop")} className="bg-white hover:bg-neutral-100 text-purple-700 font-bold px-[#12px] py-[#6px] rounded-[20px] shadow text-[#13px] border transition flex items-center gap-[#6px] cursor-pointer">Stop Emulation</Link>
                </div>
            </div>
        )}
        <Header auth={auth} cart_count={cart_count} />
        <OnboardingNudge />
        <main className="pb-16 sm:pb-0">
            <NetworkStatusBanner />
            <PullToRefresh />
            {children}
            <Toaster 
                position="top-center" 
                toastOptions={{
                className: '',
                style: {
                    border: '1px solid #713200',
                    padding: '16px',
                    color: '#713200',
                },
                success: {
                duration: 3000,
                theme: {
                    primary: 'green',
                    secondary: 'black',
                },
                },
                }}
            />
        </main>
        <Footer auth={auth} />
        <BottomBar />
        <PwaInstallPrompt />
        <FlashMessenger />
        <TermsUpdatePopup />
        <IntercomProvider />
    </>;
}