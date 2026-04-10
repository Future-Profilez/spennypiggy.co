import { lazy } from "react";
import { Toaster } from 'react-hot-toast';
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import PullToRefresh from '@/Components/PullToRefresh';
import FlashMessenger from '@/Components/FlashMessenger';
import IntercomProviderFixed from '@/Components/IntercomProviderFixed';
const Footer = lazy(() => import('@/includes/Footer'));
const Header = lazy(() => import('@/includes/Header'));

export default function Authenticated(props){ 

    const { auth, user, children, cart_count } = props;

    return <>
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
        {/* <IntercomProviderFixed /> */}
    </>
}

 