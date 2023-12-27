import React, { useState } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import  LoaderButton from "@/Components/LoaderButton";
import { useForm } from "@inertiajs/react";
import PriceFormat from '@/includes/PriceFormat';
import Popup from '@/Components/Popup';

export default function MyGoal({goal}) {

  const { formatMultiPrice } = PriceFormat();
  

  const getPercentage = (actual, paid) => {
    const r = (paid/actual)*100;
    return r.toFixed(1);
  }

  const SendTip = () => { 

    const [close,setClose] = useState();
    const { data, setData, post, processing, errors, reset } = useForm({
      amount: goal.default_price || '',
      email: '',
      name: '',
      tipnote: '',
    }); 

    const givetip = () => { 
      console.log("data",data)
    }

    return <>
          <Popup
            modalclassName="pinkmodal sendSurprize-modal shadow-pink"
            space="4" size="md" action={close} classes={`btn-pink mt-3 lg px-4 my-2 w-100`}
            text={`Send Tip `} >
            <h2 className='text-large font-semibold mb-4'>Give me a tip</h2>

            <div className="form-field mb-4">
              <label className="d-block text-start mb-2">Amount<sup className='text-danger' >*</sup></label>
              <input defaultValue={goal.default_price} className="form-input w-100 rounded" onChange={(e) => setData('amount', e.target.value)} type="number" placeholder="Enter amount.. " />
            </div>

            <div className="form-field mb-4">
              <label className="d-block text-start mb-2">Nickname<sup className='text-danger' >*</sup></label>
              <input
                className="form-input w-100 rounded"
                onChange={(e) => setData('name', e.target.value)}
                type="text" placeholder="Enter nickname.. "
              />
            </div>

            <div className="form-field mb-4">
              <label className="d-block text-start mb-2">Email<sup className='text-danger' >*</sup></label>
              <input
                className="form-input w-100 rounded"
                onChange={(e) => setData('email', e.target.value)}
                type="email" placeholder="Enter email.. " />
              <p className='text-small text-muted ' >Your email address is kept private and will not be shown to anyone.</p>
            </div>

            <div className="form-field mb-4">
              <label className="d-block text-start mb-2">Tip Note (optional)</label>
              <textarea
                className="form-input w-100 rounded"
                onChange={(e) => setData('tipnote', e.target.value)}
                placeholder="Write a short note."
              />
            </div>

            <LoaderButton 
            onClick={givetip} 
            disabled={processing}
            type='submit' className="flex w-100 btn-pink sm mx-auto mt-3 "
            spinnerClassName="fill-red-600" >
            {processing ? "Processing" : "Send Tip "}
            </LoaderButton>
        </Popup>

      
    </>
  }

  return (
    <div className='box rounded-lg mt-4 shadow-voilet border p-4'>
      <h2 className='text-large font-semibold mb-2'>{goal?.name || ''}</h2>
      <p className='mb-3 '>{ goal?.description || 'Hello everyone please help me to grow.It can not happen without your support.'}</p>
      
      <p className='mb-3 text-voilet '>30 Days left to goal ends.</p>
      <ProgressBar now={goal?.fullfilled} max={goal?.target} />
      <p className='text-muted text-small' >{getPercentage(goal?.target, goal?.fullfilled)}% of {formatMultiPrice(goal?.target, goal?.currency)} goal.</p>
      <SendTip />
    </div>
  )
}
