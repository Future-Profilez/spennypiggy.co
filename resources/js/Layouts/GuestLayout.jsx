import { Toaster } from 'react-hot-toast';
import { lazy } from 'react';
import Header from '@/includes/Header'; 
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import FlashMessenger from '@/Components/FlashMessenger';
// import IntercomProvider from '@/Components/IntercomProvider';
const Footer = lazy(() => import('@/includes/Footer'));
export default function Guest({children, auth}) {
    return <>
        <Header auth={auth ||''} />
        {children}
        <Footer auth={auth ||''} />
        <Toaster  />
        <BottomBar />
        <PwaInstallPrompt />
        <FlashMessenger />
    </>
}


