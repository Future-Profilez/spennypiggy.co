import { usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { useAlerts } from '@/Components/Alerts';
import React from 'react';
import Header from '@/includes/Header';
import { useMemo } from 'react';
const Footer = React.lazy(() => import('@/includes/Footer'));

export default function Guest({children, auth}) {
    const {successAlert, errorAlert} = useAlerts();
    const {flash, errors} = usePage().props;

    return <>
        <Header auth={auth ||''} />
        {children}
        <Footer auth={auth ||''} />
        <Toaster  />
    </>
}


