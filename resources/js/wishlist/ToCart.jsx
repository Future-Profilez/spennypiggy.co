import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ToCart({ crowd,  pending, uuid, text, classes, custom, removeItem, type, is_cart, amount }) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [is_Cart, setis_Cart] = useState(is_cart);
     
    const addtocart = (e) => {
      
      if(crowd && amount > pending){
        toast.error(`Amount can not be more than remaining amount £${pending}. `);
        return false;
      }

      if(amount && amount < 50){
        toast.error("Amount must be greater than 50.");
        return false;
      }
        setLoading(true);
        axios.get(`/add-to-cart/${uuid}${amount ? `/${amount}` : ''}`).then(resp => {
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
        });
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

