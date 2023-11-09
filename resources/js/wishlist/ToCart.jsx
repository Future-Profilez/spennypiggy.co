import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

export default function ToCart({ uuid, text, classes, custom, removeItem, type }) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
     
    const addtocart = (e) => {
        setLoading(true);
        axios.get(`/add-to-cart/${uuid}`).then(resp => {
            if (resp.data.added == true) {
                successAlert(resp.data.msg);
            } else {
                errorAlert(resp.data.msg);
            }
            if(resp.data.uuid){ 
              removeItem && removeItem(uuid);
            }
            setLoading(false);
            if(type == 'checkout'){ 
               window.location = '/cart';
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
            className={`flex  ${classes} mx-auto`}
            spinnerClassName='fill-red-600'>
            {loading ? "Proccessing" : text}
        </LoaderButton>
    }
  </>
}
