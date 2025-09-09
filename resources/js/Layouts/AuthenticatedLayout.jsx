import { lazy } from "react";
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { useAlerts } from '@/Components/Alerts';
import BottomBar from './BottomBar';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
const Footer = lazy(() => import('@/includes/Footer'));
const Header = lazy(() => import('@/includes/Header'));

export default function Authenticated(props){ 

    const { auth, user, children, cart_count } = props;
    const { successAlert, errorAlert, warningAlert } = useAlerts();
    const { flash, errors } = usePage().props;
    useEffect(() => {
        if(errors){
            Object.entries(errors).forEach(([key, value]) => {
                errorAlert(value);
            });
        }
        if (flash?.error) {
            errorAlert(flash.error);
        }
        if (flash?.success) {
            successAlert(flash.success);
        }
        if (flash?.warning) {
            warningAlert(flash.warning);
        }
        if (flash?.info) {
            successAlert(flash.info);
        }
    },[flash, errors]); // Watch for changes in flash and errors

    return <>
        <Header auth={auth} user={user}  />
        <main>
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
    
    </>
}

 