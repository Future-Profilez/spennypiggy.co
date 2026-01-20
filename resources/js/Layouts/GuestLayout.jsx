import { Toaster } from 'react-hot-toast';
import Header from '@/includes/Header'; 
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import FlashMessenger from '@/Components/FlashMessenger';
// import IntercomProvider from '@/Components/IntercomProvider';
import Footer from '@/includes/Footer';
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


