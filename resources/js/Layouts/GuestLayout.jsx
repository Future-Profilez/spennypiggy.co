import { Toaster } from 'react-hot-toast';
import { lazy } from 'react';
import Header from '@/includes/Header'; 
import BottomBar from './BottomBar';
const Footer = lazy(() => import('@/includes/Footer'));
export default function Guest({children, auth}) {
    return <>
        <Header auth={auth ||''} />
        {children}
        <Footer auth={auth ||''} />
        <Toaster  />
        <BottomBar />
    </>
}


