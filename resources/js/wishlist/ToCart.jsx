import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import { router } from '@inertiajs/react'
import axios from 'axios';
import { useState } from 'react';

export default function ToCart({uuid, text, classes, custom}){

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);

    // const addtocart = (e) => {
    //     setLoading(true);
    //     router.post('/add-to-cart/', { "uuid": uuid }, {
    //         preserveScroll: true,
    //         onSuccess: (resp) => {
    //             if (resp.props.flash?.success) {
    //                 successAlert(resp.props.flash?.success || "Added");
    //             }
    //             if (resp.props.flash?.error) {
    //                 errorAlert(resp.props.flash?.error);
    //             }
    //             setLoading(false);
    //         },
    //         onError: (_err) => {
    //             console.error("error", _err);
    //             setLoading(false);
    //         }
    //     });
    // };
    const addtocart = (e) => {
        setLoading(true);
        // router.post('/add-to-cart/', { "uuid": uuid }, {
        //     preserveScroll: true,
        //     onSuccess: (resp) => {
        //         if (resp.props.flash?.success) {
        //             successAlert(resp.props.flash?.success || "Added");
        //         }
        //         if (resp.props.flash?.error) {
        //             errorAlert(resp.props.flash?.error);
        //         }
        //         setLoading(false);
        //     },
        //     onError: (_err) => {
        //         console.error("error", _err);
        //         setLoading(false);
        //     }
        // });
        axios.post(`/add-to-cart`, 
        { "uuid": uuid }).then(resp => {
              console.log("resp", resp);
               setLoading(false);
        }).catch(_err => {
            console.log("error", _err);
             setLoading(false);
        })
    };



  return <>

    {custom ? 
        <div onClick={addtocart} >{custom}</div> 
        : 
        <LoaderButton disabled={loading} onClick={addtocart}
            className={`flex  ${classes} max-w-xs mx-auto`}
            spinnerClassName='fill-red-600'>
            {loading ? "Proccessing" : text}
        </LoaderButton>
    }
  </>
}
