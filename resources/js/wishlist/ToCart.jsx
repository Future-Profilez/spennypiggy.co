import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

export default function ToCart({ uuid, text, classes, custom, removeItem, type, is_cart }) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [is_Cart, setis_Cart] = useState(is_cart);
     
    const addtocart = (e) => {
        setLoading(true);
        axios.get(`/add-to-cart/${uuid}/50`).then(resp => {
            if (resp.data.added == true) {
                successAlert(resp.data.msg);
                setis_Cart(true);
            } else {
              successAlert(resp.data.msg);
              setis_Cart(false);
            }
            if(resp.data.uuid){ 
              removeItem && removeItem(uuid);
            }
            setLoading(false);
            if(type == 'checkout'){ 
               window.location = '/cart';
            }
          }).catch(_err => {
            console.error("error", _err);
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
            {loading ? "Proccessing" : is_Cart ? "Remove From Cart" : text}
        </LoaderButton>
    }
  </>
}
