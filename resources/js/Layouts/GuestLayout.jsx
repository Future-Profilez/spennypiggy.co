import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { useAlerts } from '@/Components/Alerts';
import { useEffect } from 'react';
import Footer from '@/includes/Footer';
import Header from '@/includes/Header';
export default function Guest(props) {
    const {successAlert, errorAlert} = useAlerts();
    const {flash} = usePage().props;
    useEffect(() => {
        // console.log("flash", flash);
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

    const {children, auth} = props;

    return <>
        <Header auth={auth ||''} />
        {children}
        <Footer />
        <Toaster />
    </>
}
