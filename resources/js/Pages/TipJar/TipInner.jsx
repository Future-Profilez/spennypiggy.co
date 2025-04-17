import React, { useRef, useState } from 'react';
import { useForm, Link, usePage, router } from "@inertiajs/react";
import PriceFormat from '@/includes/PriceFormat';
import {piggynose, piggyface, tipheading, leftleg, rightleg} from '@/includes/Icons';
import { useEffect } from 'react';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';
import toast from 'react-hot-toast';

export default function TipInner({classes}) {

  const { global_currency, auth, user } = usePage().props;
  const checkRef = useRef();
  const { formatMultiPrice } = PriceFormat();

  const [defaultAmount, setdefaultAmount] = useState(5);
  const [amount, setAmount] = useState(defaultAmount);
  const [tipQuantity, setTipQuantity] = useState(1);
  const [coinsQuantity, setCoinsQuanitity] = useState(1)
  const { successAlert, errorAlert, errorsHandling } = useAlerts();

  const incresevalue = () =>{
      const c = parseInt(tipQuantity+1);
      setAmount(defaultAmount*c);
      setTipQuantity(c);
  }

  const decresevalue = () =>{
    if(tipQuantity > 1){
      const c = parseInt(tipQuantity-1);
      setAmount(defaultAmount*c);
      setTipQuantity(c);
    }
  }

  const [selectegTag, setselectegTag] = useState(5);
  const [custom, setCustom] = useState(false);
  const selectCustom = ()=> {
     setCustom(true);
     setselectegTag("custom")
  }
  const customAmountTag = (e) => {
    setAmount(e);
    setdefaultAmount(e);
    setTipQuantity(1);
    setCoinsQuanitity();
    setCustom(false);
    setselectegTag(e);
  }
  const customAmount = (e) => {
    if(e.target.value > 99){
      toast.error("Maximum amount is 99");
      return false;
    }
    setAmount(e.target.value);
    setdefaultAmount(e.target.value);
    setTipQuantity(1);
    setCoinsQuanitity();
    setCustom(false);
  }

  const { data, setData, post, processing, errors, reset } = useForm({
    email: auth && auth.user?.email || '',
    name: auth && auth.user?.name || '',
    message: '',
    anonymous: 0,
    amount: amount
  });

  useEffect(()=>{
    setData("amount", amount);
  },[amount]);

  const [loading, setLoading] = useState(false);

  const send = (e) => {
    e.preventDefault();
    if(auth && auth.user == null ){
        errorAlert("You must login first.");
        router.visit("/login?redirect=" + window.location.pathname);
        return false;
    }
    setLoading(true);
    const resp = axios.post(`tip-jar/pay/${user.uuid}`, data);
    resp.then((res) => {
      if(res.data.status){
        window.location.href = res.data.url
      } else {
        errorAlert(res.data.msg);
      }
      setLoading(false);
    }).catch((err) => {
      console.log("err", err)
      setLoading(false);
    });
  }



  return <div className='tip-wrapper'>
      <div className='piggyface' dangerouslySetInnerHTML={{ __html: piggyface }} />
      <div className='piggynose' dangerouslySetInnerHTML={{ __html: piggynose }} />
      <div className={`${classes} p-2 p-md-4  box-inner`}>

          <div className='legleft'  dangerouslySetInnerHTML={{ __html: leftleg }} />
          <div className='legright'  dangerouslySetInnerHTML={{ __html: rightleg }} />
          <h2 className='p-3 text-pink font-GillSans uppercase text-large mb-1 mt-4 pe-5'>Fill My Piggy bank 🐖</h2>
          <div className='border-top p-3 pt-3' >

            <div className='tip-counter d-flex align-items-center justify-content-between mb-3' >
                <p className='tipheading flex align-items-center' >
                  <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} />
                {defaultAmount} &nbsp;Each</p>
                <div className='incresecounter d-flex align-items-center' >
                      <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px]  border  rounded-4 ' onClick={decresevalue} >-</button>
                      <div className='border px-3 py-2 rounded-5 mx-1' >{tipQuantity}</div>
                      <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px] border  rounded-4 ' onClick={incresevalue} >+</button>
                </div>
            </div>

            <div className="flex flex-wrap grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4 mt-2">
                <button className={`${ selectegTag == 25 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3`} onClick={()=>customAmountTag(25)}  >{formatMultiPrice(25, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 50 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3`} onClick={()=>customAmountTag(50)}  >{formatMultiPrice(50, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 99 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3`} onClick={()=>customAmountTag(99)}  >{formatMultiPrice(99, global_currency || "GBP")}</button>
                <button className={`${ selectegTag === 'custom' ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3`} onClick={selectCustom} >Custom</button>
            </div>

            {selectegTag === 'custom' ? <div className="form-field mb-4 ">
                <div className="position-relative currency-wrapper " >
                    <span className="currency-tag">{global_currency || 'GBP'}</span>
                    <input className="form-input w-100 rounded" value={amount}
                    onChange={customAmount}
                    type="number" placeholder="Enter amount.. " />
                </div>
            </div> : ''}

            <div className="form-field mb-3">
              <textarea className="form-input w-100 rounded"
              onChange={(e) => setData('message', e.target.value)}
              placeholder="Write a short note." />
            </div>

            {auth && auth.user ? '' :
              <>
                <div className="form-field mb-4">
                  <input required
                    className="form-input w-100 rounded"
                    defaultValue={auth && auth.user?.name}
                    onChange={(e) => setData('name', e.target.value)}
                    type="text" placeholder="Enter nickname.. "
                  />
                </div>

                <div className="form-field mb-4">
                  <input required  disabled={auth && auth.user?.email ? true : false}
                    className="form-input w-100 rounded"
                    defaultValue={auth && auth.user?.email}
                    onChange={(e) => setData('email', e.target.value)}
                    type="email" placeholder="Enter email.. " />
                  <p className='text-small text-muted mt-1 ' >Your email address is kept private and will not be shown to anyone.</p>
                </div>
              </>
            }

            <div className='termselect mt-3 mb-3'>
                <label htmlFor="termaccept">
                  <p className='text-small text-dark font-normal' >
                    <input className='cursor-pointer'
                    type="checkbox" ref={checkRef}
                    id="termaccept"  name="termaccept"
                    value="termaccept" required
                    onChange={(e) => setData("termaccept", e.target.value)}></input>
                      By supporting me, you agree that this support is a gift and as a thank you, you get access to my profile feed and supporter only posts. To view these, you will need to create an account with the e-mail you used to send the support, as effectively you are purchasing a supporter Membership attached to your e-mail for 30 days.
                  </p>
                </label>
            </div>

            <div className='termselect mt-3 mb-3'>
                <label htmlFor="keepanonymous">
                  <p className='text-small text-dark font-normal'>
                    <input className='cursor-pointer' type="checkbox"
                    id="keepanonymous" name="keepanonymous"
                    value="keepanonymous"
                    onChange={(e) => setData("anonymous", e.target.checked ? 1 : 0 )}
                    ></input> Keep anonymous
                  </p>
                </label>
                <p className="text-muted text-small mt-1 mb-3" >Your personal email and name will be private.</p>
            </div>
            <button onClick={send} className={`inline-flex items-center px-4 border shadow-black
               rounded-[30px] btn-pink md justify-content-center  border-0
              ease-in-out duration-150 flex button text-center w-100
              font-CeraGR mx-auto ${checkRef.current && checkRef.current.checked ? '' :'disabled'}`}
               > {processing ? "Processing" : 'Support Me'} </button>
            {/* <div className='securestripe text-center mt-3' >
              🔒 Secured via <b>Stripe</b>
            </div> */}
          </div>
      </div>
      <></>
  </div>
}
