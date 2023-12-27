import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import  LoaderButton from "@/Components/LoaderButton";
import { useForm } from "@inertiajs/react";

export default function MyGoal() {

  const { data, setData, post, processing, errors, reset } = useForm({
    description: ''
 }); 

  return (
    <div className='box rounded-lg mt-4 shadow-voilet border p-4'>
      <h2 className='text-large font-semibold mb-2'>But me a coffee</h2>
      <p className='mb-3 '>Hello everyone please help me to grow.It can not happen without your support.</p>
      
      <p className='mb-3 text-voilet '>30 Days left to goal ends.</p>
      <ProgressBar now={50} max={100} />
      <p className='text-muted text-small' >110% of $60 goal.</p>

      <LoaderButton 
      // onClick={addgoal} 
      disabled={processing}
          type='submit' className="flex w-100 btn-pink sm mx-auto mt-3 "
          spinnerClassName="fill-red-600" >
          {processing ? "Processing" : "Send Tip "}
      </LoaderButton>


    </div>
  )
}
