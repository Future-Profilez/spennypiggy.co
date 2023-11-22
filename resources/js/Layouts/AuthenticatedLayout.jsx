import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { useAlerts } from '@/Components/Alerts';
import Header from '@/includes/Header';
import Footer from '@/includes/Footer';
import SiteMeta from '@/includes/SiteMetas';

export default function Authenticated({auth, user, header, children }) {

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const { successAlert, errorAlert } = useAlerts();
    const { flash } = usePage().props;

    useEffect(() => {
        console.log("flash", flash);
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
    },[]);

    return <>
         <SiteMeta />
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
    </>
}
