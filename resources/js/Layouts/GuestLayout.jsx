import { usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { useAlerts } from '@/Components/Alerts';
import React, { useEffect } from 'react';
import Header from '@/includes/Header';
const Footer = React.lazy(() => import('@/includes/Footer'));

export default function Guest({children, auth}) {

    const {successAlert, errorAlert} = useAlerts();
    const {flash, errors} = usePage().props;

    useEffect(() => {
        if(errors){
            Object.entries(errors).forEach(([key, value]) => {
                errorAlert(value);
            });
        }
        if(flash?.error){
            errorAlert(flash.error);
        }
        if(flash?.success){
            successAlert(flash.success);
        }
        if(flash?.warning){
            warningAlert(flash.warning);
        }
        if(flash?.info){
            successAlert(flash.info);
        }
    },[]);

    return <>
        <Header auth={auth ||''} />
        {children}
        <Footer auth={auth ||''} />
        <Toaster  />
    </>
}


