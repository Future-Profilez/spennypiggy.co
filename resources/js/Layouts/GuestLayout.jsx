import { Link, usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { useAlerts } from '@/Components/Alerts';
import { useEffect } from 'react';
import Footer from '@/includes/Footer';
import Header from '@/includes/Header';

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

    console.log("props guest", props)

    return <>
        <Header auth={auth ||''} />
        {children}
        <Footer auth={auth ||''} />
        <Toaster  />
    </>
}
