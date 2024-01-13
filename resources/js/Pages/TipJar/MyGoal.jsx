import React, { useRef, useState } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useForm, Link, usePage } from "@inertiajs/react";
import PriceFormat from '@/includes/PriceFormat';
import Popup from '@/Components/Popup';
import { useEffect } from 'react';

export default function MyGoal({goal, IsloggedIn}) {

  const { global_currency, auth } = usePage().props;
  const { formatMultiPrice } = PriceFormat();

  const getPercentage = (actual, paid) => {
    const r = (paid/actual)*100;
    return r.toFixed(2);
  }
  const [keepAnonmyous, setKeepAnonmyous] = useState(false);
  const SendTip = () => { 
    const anoymous = useRef();
    const checkRef = useRef();
    const [close, setClose ] = useState();


    const { data, setData, post, processing, errors, reset } = useForm({
      amount: goal.default_price || '',
      email: auth && auth.user?.email || '',
      name: auth && auth.user?.name || '',
      message: '',
      anonymous: '',
    }); 

    return <>
      <Popup
          modalclassName="pinkmodal sendSurprize-modal shadow-pink"
          space="4" size="md" action={close} classes={`btn-pink mt-3 lg px-4 my-2 w-100`}
          text={`Send me a tip `} >
          <h2 className='text-large font-semibold mb-4'>Give me a tip</h2>
          
          <div className='row' >

            <div className='col-md-6' >
              <div className="form-field mb-4">
                  <label className="d-block text-start mb-2 text-small">Amount<sup className='text-danger' >*</sup></label>
                  <div className="position-relative currency-wrapper " >
                      <span className="currency-tag">{global_currency || 'GBP'}</span>
                      <input defaultValue={goal.default_price} className="form-input w-100 rounded" 
                      onChange={(e) => setData('amount', e.target.value)} 
                      type="number" placeholder="Enter amount.. " />
                  </div>
                  <p className='text-small text-muted mt-2' >Minimum amount is set to {formatMultiPrice(goal?.default_price, goal?.currency)}</p>
              </div>
            </div>

            <div className='col-md-6' >
              <div className="form-field mb-4">
                <label className="d-block text-start mb-2 text-small">Nickname<sup className='text-danger' >*</sup></label>
                <input required
                  className="form-input w-100 rounded"
                  defaultValue={auth && auth.user?.name}
                  onChange={(e) => setData('name', e.target.value)}
                  type="text" placeholder="Enter nickname.. "
                />
              </div>
            </div>

          </div>

          <div className="form-field mb-4">
            <label className="d-block text-start mb-2 text-small">Email<sup className='text-danger' >*</sup></label>
            <input required  disabled={auth && auth.user?.email ? true : false}
              className="form-input w-100 rounded"
              defaultValue={auth && auth.user?.email}
              onChange={(e) => setData('email', e.target.value)}
              type="email" placeholder="Enter email.. " />
            <p className='text-small text-muted mt-1 ' >Your email address is kept private and will not be shown to anyone.</p>
          </div>

          <div className="form-field mb-3">
            <label className="d-block text-start mb-2 text-small">Tip Note (optional)</label>
            <textarea
              className="form-input w-100 rounded"
              onChange={(e) => setData('message', e.target.value)}
              placeholder="Write a short note." />
          </div>

          <div className='termselect mt-3 mb-3'>
              <label htmlFor="termaccept">
                <p>
                  <input className='cursor-pointer' 
                  type="checkbox" ref={checkRef}  
                  id="termaccept"  name="termaccept"  
                  value="termaccept" required 
                  onChange={(e) => setData("termaccept", e.target.value)}></input>
                    By sending this tip, you agree that this tip is only being made as a gift and not for any service in return.
                </p>
              </label>
          </div>

          <div className='termselect mt-3 mb-3'>
              <label htmlFor="keepanonymous">
                <p> 
                  <input className='cursor-pointer' type="checkbox" 
                  id="keepanonymous" name="keepanonymous"  
                  value="keepanonymous"
                  onChange={(e) => setData("anonymous", e.target.checked ? 1 : 0 )}
                  ></input> Keep anonymous 
                </p> 
              </label>
              <p className="text-muted text-small mt-1 mb-3" >Your personal email and name will be private.</p>
          </div>

          <Link className={`inline-flex items-center px-4 border 
            border-transparent rounded-md font-semibold text-xs text-white 
            uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 
            active:bg-gray-900 focus:outline-none focus:ring-2 
            focus:ring-indigo-500 focus:ring-offset-2 transition 
            ease-in-out duration-150 false flex btn-pink lg w-100  
            font-CeraGR mx-auto ${checkRef.current && checkRef.current.checked ? '' :'disabled'}`} 
            href={`tip-jar/pay/${goal.uuid}`} 
            method="post" data={data} > 
            {processing ? "Processing" : 'Send Tip'} 
          </Link>
          <div className='securestripe text-center mt-3' >
            🔒 Secured via <b>Stripe</b>
          </div>
      </Popup>
    </>
  }

  return (
    <div className='box rounded-lg mt-4 shadow-voilet border p-4'>
      <h2 className='text-large font-semibold mb-2'>{goal?.name || ''}</h2>
      <p className='mb-3 '>{ goal?.description || ''}</p>
      {goal.days ? <p className='mb-3 text-voilet '>{goal.days > 1 ? `${goal.days} Days` : `${goal.days} Day`} left to goal ends.</p> : ''}
      <ProgressBar now={goal?.fullfilled} max={goal?.target} />
      <p className='text-muted text-small mt-1' >{getPercentage(goal?.target, goal?.fullfilled)}% of {formatMultiPrice(goal?.target, goal?.currency)} goal.</p>
      {!IsloggedIn ? <SendTip /> :''}
    </div>
  )
}
