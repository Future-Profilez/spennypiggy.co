import { Toaster } from 'react-hot-toast'; 
import React from 'react';
import Header from '@/includes/Header'; 
import BottomBar from './BottomBar';
const Footer = React.lazy(() => import('@/includes/Footer'));

export default function Guest({children, auth}) {
    return <>
        <Header auth={auth ||''} />
        {children}
        <Footer auth={auth ||''} />
        <Toaster  />
        <BottomBar />
    </>
}


