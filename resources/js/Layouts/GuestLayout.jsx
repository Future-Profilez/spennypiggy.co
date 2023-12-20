import { usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { useAlerts } from '@/Components/Alerts';
import React, { useEffect } from 'react';
import VersionUpdate from '@/Components/VersionUpdate';
const Footer = React.lazy(() => import('@/includes/Footer'));
const Header = React.lazy(() => import('@/includes/Header'));

export default function Guest(props) {

    const {children, auth, cart_count } = props;
    const {successAlert, errorAlert} = useAlerts();
    const {flash} = usePage().props;

    useEffect(() => {
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
