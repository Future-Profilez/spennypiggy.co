import { Toaster } from 'react-hot-toast';
import Header from '@/includes/Header'; 
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import NetworkStatusBanner from '@/Components/NetworkStatusBanner';
import PullToRefresh from '@/Components/PullToRefresh';
import FlashMessenger from '@/Components/FlashMessenger';
import IntercomProvider from '@/Components/IntercomProvider';
import Footer from '@/includes/Footer';
import TermsUpdatePopup from '@/Components/TermsUpdatePopup';
import OnboardingNudge from '@/Components/OnboardingNudge';
import { usePage } from '@inertiajs/react';
export default function Guest({children, auth, className}) {
    const pageprops = usePage().props;
    return <div className={`guest-layout ${className || ''}`}>
        <Header auth={auth ||''} />
        <OnboardingNudge />
        <main >
            <NetworkStatusBanner />
            <PullToRefresh />
            {children}
        </main>
        <Footer auth={auth ||''} />
        <Toaster 
            toastOptions={{
                style: {
                    marginTop: 'env(safe-area-inset-top)'
                }
            }}
        />
        <BottomBar />
        <PwaInstallPrompt />
        <FlashMessenger />
        <TermsUpdatePopup />
        <IntercomProvider />
    </div>
}


