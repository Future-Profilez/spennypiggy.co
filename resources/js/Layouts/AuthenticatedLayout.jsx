import { lazy } from "react";
import { Toaster } from 'react-hot-toast';
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import PullToRefresh from '@/Components/PullToRefresh';
import FlashMessenger from '@/Components/FlashMessenger';
import IntercomProviderFixed from '@/Components/IntercomProviderFixed';
import TermsUpdatePopup from '@/Components/TermsUpdatePopup';
import { Link } from '@inertiajs/react';
const Footer = lazy(() => import('@/includes/Footer'));
const Header = lazy(() => import('@/includes/Header'));

export default function Authenticated(props){ 

    const { auth, user, children, cart_count } = props;

    return <>
        {auth?.is_emulated && (
            <div className="bg-purple-600 text-white px-4 py-2 flex justify-between items-center sticky top-0 z-[100] shadow-md border-b border-purple-400/30">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🎭</span>
                    <span className="text-sm font-bold">Emulating: {user?.username || auth.user?.username}</span>
                </div>
                <Link 
                    href={route('admin.emulate.stop')} 
                    method="post" 
                    as="button"
                    className="bg-white text-purple-600 px-3 py-1 rounded-full text-xs font-black hover:bg-gray-100 transition-all active:scale-95"
                >
                    STOP
                </Link>
            </div>
        )}
        <Header auth={auth} user={user}  />
        <main>
            <PullToRefresh />
            {children}
            <Toaster
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                className: '',
                duration: 3000,
                style: {
                background: '#363636',
                color: '#fff',
                marginTop: 'env(safe-area-inset-top)',
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
        {/* <IntercomProviderFixed /> */}
    </>
}

 