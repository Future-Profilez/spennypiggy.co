import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import axios from 'axios';
import { useState } from 'react';

export default function DirectCheckout({ item }) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [quantity, setquantity]  = useState(1);

    console.log("itemsss", item)
    const checkout = (e) => {
        setLoading(true);
        // axios.get(`/anonymous-create-checkout-session/${item.price_id || ''}/${quantity}`).then(resp => {
        //   // successAlert(resp.data.msg);
        //   console.log("resp",resp)
        //     setLoading(false);
        //   }).catch(_err => {
        //     console.error("error", _err);
        //     setLoading(false);
        //   })
        window.location.href = `/anonymous-create-checkout-session/${item.price_id || ''}/${quantity}`;
    };

  return <>
      <button className='btn-pink lg w-100' onClick={checkout} >Pay</button> 
  </>
}
