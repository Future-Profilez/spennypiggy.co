
import { useCallback, useRef, useState } from "react";
import { useForm, usePage, router } from "@inertiajs/react";
import PriceFormat from '@/includes/PriceFormat';
import {piggynose, piggyface, tipheading, leftleg, rightleg} from '@/includes/Icons';
import { useEffect } from 'react';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';
import toast from 'react-hot-toast';
import Turnstile from "@/Components/Turnstile";

export default function TipInner({classes, idd}) {

  const { rates, global_currency, auth, user, turnstileSiteKey } = usePage().props;
  const checkRef = useRef();
  const turnstileRef = useRef(null);
  const { formatMultiPrice } = PriceFormat();

  const [defaultAmount, setdefaultAmount] = useState(25);
  const [amount, setAmount] = useState(defaultAmount);
  const { errorAlert } = useAlerts();
  const [verified, setVerified] = useState(false);

  const [selectegTag, setselectegTag] = useState(25);
  const customAmountTag = (e) => {
    setAmount(e);
    setdefaultAmount(e);
    setselectegTag(e);
  }
  const customAmount = (e) => {
    if(e.target.value > 99){
      toast.error("Maximum amount is 99");
      return false;
    }
    setAmount(e.target.value);
    setdefaultAmount(e.target.value);
  }

  const { data, setData } = useForm({
    email: auth && auth.user?.email || '',
    name: auth && auth.user?.name || '',
    message: 'Just a small token of appreciation 💖',
    anonymous: 0,
    amount: amount,
    cf_turnstile_response: "",
  });

  useEffect(()=>{
    setData("amount", amount);
  },[amount, setData]);

  const [loading, setLoading] = useState(false);
  const usdToGbp = (amount, currency) => {
        const upCorrency = currency && currency.toUpperCase() || global_currency && global_currency.toUpperCase();
        const conversion_rate = rates[upCorrency];
        const gbpamount  = amount/conversion_rate;
        return gbpamount
  }

  const onVerify = useCallback((token) => {
    setData("cf_turnstile_response", token || "");
    setVerified(!!token);
  }, [setData]);

  const send = (e) => {
    e.preventDefault();
    if(data.email === "" || data.name === "" ){
        errorAlert("Please enter all the required details.");
        return false;
    }
    if (!checkRef.current?.checked) {
        errorAlert("Please accept the terms to continue.");
        return false;
    }
    if (turnstileSiteKey && !verified) {
        toast.error("Please verify the captcha");
        return false;
    }
    if(auth && !auth.user && usdToGbp(data.amount) > 50){
        errorAlert("Larger payments more than £50 need to login.");
        router.visit(`/login?redirect=${window.location.pathname}&message=Larger payments more than £50 need to login.`);
        return false;
    }
    setLoading(true);
    const tipresp = axios.post(`/tip-jar/pay/${user.uuid}`, data);
    tipresp.then((res) => {
      if(res.data.status){
        window.location.href = res.data.url
      } else {
        errorAlert(res.data.msg);
      }
      setLoading(false);
    }).catch((err) => {
      const responseErrors = err?.response?.data?.errors;
      const firstError =
          responseErrors &&
          Object.values(responseErrors).flat().filter(Boolean)[0];
      errorAlert(firstError || err?.response?.data?.message || "Something went wrong.");
      setVerified(false);
      setData("cf_turnstile_response", "");
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setLoading(false);
    });
  }



  return <div className='tip-wrapper'>
      <div className='piggyface' dangerouslySetInnerHTML={{ __html: piggyface }} />
      <div className='piggynose' dangerouslySetInnerHTML={{ __html: piggynose }} />
      <div className={`${classes} p-2 p-md-4  box-inner`}>

          <div className='legleft'  dangerouslySetInnerHTML={{ __html: leftleg }} />
          <div className='legright'  dangerouslySetInnerHTML={{ __html: rightleg }} />
          <h2 className='p-3 text-pink !font-normal font-GillSans uppercase text-2xl mb-1 mt-4 pe-5'>Support Me</h2>
          <div className='border-top p-3 pt-3' >

            {/* <div className='tip-counter flex items-center justify-between mb-3' >
                <p className='tipheading flex items-center' >
                  <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} />
                {defaultAmount} &nbsp;Each</p>
                <div className='incresecounter flex items-center' >
                      <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px]  border  rounded-4 ' onClick={decresevalue} >-</button>
                      <div className='border px-3 py-2 rounded-5 mx-1' >{tipQuantity}</div>
                      <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px] border  rounded-4 ' onClick={incresevalue} >+</button>
                </div>
            </div> */}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 mt-2">
                <button className={`${ selectegTag == 25 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(25)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(25, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 30 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(30)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(30, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 35 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(35)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(35, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 40 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center hidden md:flex items-center !text-[16px] !font-bold `} onClick={()=>customAmountTag(40)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(40, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 45 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(45)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(45, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 50 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(50)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(50, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 75 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(75)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(75, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 85 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(85)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(85, global_currency || "GBP")}</button>
                <button className={`${ selectegTag == 99 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(99)}  > <span className='me-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(99, global_currency || "GBP")}</button>
                {/* <button className={`${ selectegTag === 'custom' ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[20px] p-2 px-3  !text-md font-gulfs`} onClick={selectCustom} >Custom Support</button> */}
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
              <textarea className="form-input w-100 rounded" defaultValue={'Just a small token of appreciation 💖'}
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
                <label htmlFor={`termaccept${idd || 1}`}>
                  <p className='text-small text-dark font-normal' >
                    <input className='cursor-pointer'
                    type="checkbox" ref={checkRef}
                    id={`termaccept${idd || 1}`}  name="termaccept"
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
            {turnstileSiteKey ? (
              <div className="flex justify-center my-3">
                <Turnstile
                  ref={turnstileRef}
                  size="normal"
                  theme="light"
                  onVerify={onVerify}
                />
              </div>
            ) : null}
            <button disabled={loading || (turnstileSiteKey && !verified)} onClick={send} className={`items-center px-4  shadow-black
               rounded-[30px] btn-pink md justify-content-center btn-shadow !font-normal
              ease-in-out duration-150 flex button text-center w-100
                mx-auto  ${(checkRef.current && checkRef.current.checked && !(turnstileSiteKey && !verified) && !loading) ? '' :'disabled'} font-gulfs`}
               > {loading ? "Processing..." : 'Support Me'} </button>



            <div className='securestripe text-center mt-3' >
              🔒 Secured via <b>Stripe</b>
            </div>
          </div>
      </div>
      <></>
  </div>
}
