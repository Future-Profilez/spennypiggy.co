import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import { router } from '@inertiajs/react'
import axios from 'axios';
import { useState } from 'react';

export default function ToCart({ uuid, text, classes, custom }) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);

     
    const addtocart = (e) => {
        setLoading(true);
        axios.get(`/add-to-cart/${uuid}`).then(resp => {
            setLoading(false);
            if (resp.data.status && resp.data.added) {
                successAlert(resp.data.msg);
            }
            else {
                errorAlert(resp.data.msg);
            }
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
