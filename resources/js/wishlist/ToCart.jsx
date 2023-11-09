import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import { router } from '@inertiajs/react'
import { useState } from 'react';

export default function ToCart({uuid, text, classes}){

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);

    const addtocart = (e) => {
        setLoading(true);
        router.post('/add-to-cart/', { "uuid": uuid }, {
            preserveScroll: true,
            onSuccess: (resp) => {
                if (resp.props.flash?.success) {
                    successAlert(resp.props.flash?.success || "Added");
                }
                if (resp.props.flash?.error) {
                    errorAlert(resp.props.flash?.error);
                }
                setLoading(false);
            },
            onError: (_err) => {
                console.error("error", _err);
                setLoading(false);
            }
        });
    };

  return <>

    <LoaderButton disabled={loading} onClick={addtocart}
        className={`flex  ${classes} max-w-xs mx-auto`}
        spinnerClassName='fill-red-600'>
        {loading ? "Proccessing" : text}
    </LoaderButton>

    {/* <button className={classes} onClick={addtocart} >{text}</button> */}
  </>
}
