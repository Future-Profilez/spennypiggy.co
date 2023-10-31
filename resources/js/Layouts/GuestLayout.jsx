import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { useAlerts } from '@/Components/Alerts';
import { useEffect } from 'react';

export default function Guest({ children }) {
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
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100">
            <div>
                <Link href="/">
                    <ApplicationLogo className="w-20 h-20 fill-current text-gray-500" />
                </Link>
            </div>

            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg">
                {children}
            </div>
            <Toaster />
        </div>
    );
}
