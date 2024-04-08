import React, { useRef, useState } from 'react';
import { useForm, Link, usePage } from "@inertiajs/react";
import PriceFormat from '@/includes/PriceFormat';
import {piggynose, piggyface} from '@/includes/Icons';

export default function TipInner({classes}) {

  const { global_currency, auth, user } = usePage().props;
  const checkRef = useRef();
  const { formatMultiPrice } = PriceFormat();

  const [defaultAmount, setdefaultAmount] = useState(5);
  const [amount, setAmount] = useState(defaultAmount);
  const [tipQuantity, setTipQuantity] = useState(1);
  const [coinsQuantity, setCoinsQuanitity] = useState(1)

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

  const customAmount = (e) => { 
    setAmount(e.target.value);
    setdefaultAmount(e.target.value);
    setTipQuantity(1);
    setCoinsQuanitity();
  }

  const { data, setData, post, processing, errors, reset } = useForm({
    email: auth && auth.user?.email || '',
    name: auth && auth.user?.name || '',
    message: '', 
    anonymous: 0,
  }); 
  
  return <div className='tip-wrapper'>
      <div className='piggyface' dangerouslySetInnerHTML={{ __html: piggyface }} />
      <div className='piggynose' dangerouslySetInnerHTML={{ __html: piggynose }} />
      <div className={`${classes} p-2 p-md-4  box-inner`}>

          <div className='legleft' >
            <svg width="70" height="91" viewBox="0 0 70 91" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M33.9392 4.50553C22.9396 12.8862 4.69418 19.7808 -4.69043 22.8363L9.05911 87.0004C25.4276 83.7267 52.2719 68.6703 64.0573 54.9208C75.8426 41.1712 47.6888 -5.97031 33.9392 4.50553Z" fill="#F94F97" stroke="#E6EA7B" stroke-width="5.16831"/>
            <path d="M-6 22.8363C3.38461 19.7808 21.63 12.8862 32.6297 4.50553C46.3792 -5.97031 74.533 41.1712 62.7477 54.9208C50.9624 68.6703 24.118 83.7267 7.74954 87.0004" stroke="#E6EA7B" stroke-width="5.16831" stroke-linecap="round"/>
            </svg>
          </div>
          <div className='legright' >
            <svg width="64" height="91" viewBox="0 0 64 91" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M35.9338 86.4945C46.9335 78.1138 65.1789 71.2192 74.5635 68.1637L60.8139 3.99963C44.4454 7.27333 17.6011 22.3297 5.81579 36.0792C-5.96954 49.8288 22.1843 96.9703 35.9338 86.4945Z" fill="#F94F97" stroke="#E6EA7B" stroke-width="5.16831"/>
            <path d="M75.873 68.1637C66.4884 71.2192 48.243 78.1138 37.2434 86.4945C23.4939 96.9703 -4.65996 49.8288 7.12536 36.0792C18.9107 22.3297 45.755 7.27333 62.1235 3.99963" stroke="#E6EA7B" stroke-width="5.16831" stroke-linecap="round"/>
            </svg>
          </div>

          <h2 className='p-3 text-pink font-GillSans uppercase text-large black-stroke mb-1 mt-4 pe-5'>Fill My Piggy bank 🐖</h2>
          <div className='border-top p-3 pt-3' >

            <div className='tip-counter d-flex align-items-center justify-content-between mb-3' >
                <p className='tipheading flex align-items-center' >
                  <span className='me-2' >
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 36 36"><circle cx="18" cy="19" r="17" fill="#f4900c"/><circle cx="18" cy="17" r="17" fill="#ffcc4d"/><circle cx="18" cy="18" r="14" fill="#ffe8b6"/><circle cx="18" cy="17" r="14" fill="#ffac33"/><path fill="#ffe8b6" d="M9.543 10.856c0-.545.535-.763.535-.763l7.878-3.7l7.953 3.7s.548.122.548.767v.641H9.543z"/><path fill="#f4900c" d="M25.929 12.836c0-.584-.505-1.057-1.127-1.057H11.129c-.623 0-1.057.473-1.057 1.057c0 .397.204.739.529.92v.666h2.114v-.529h2.114v.529h2.114v-.529h2.114v.529h2.114v-.529h2.114v.529H25.4v-.693c.317-.188.529-.517.529-.893M27.514 24a.793.793 0 0 1-.793.793H9.279a.793.793 0 1 1 0-1.586h17.443c.437 0 .792.355.792.793"/><path fill="#f4900c" d="M26.457 12.2a.529.529 0 0 1-.529.529H10.071a.53.53 0 0 1 0-1.058l15.857.003a.527.527 0 0 1 .529.526m-14.271.614h11.629V14H12.186z"/><path fill="#ffd983" d="M12.714 20.829c0 .584-.316 1.057-.705 1.057h-.705c-.389 0-.705-.473-.705-1.057v-8.014c0-.584.316-1.057.705-1.057h.705c.389 0 .705.473.705 1.057zm12.686 0c0 .584-.315 1.057-.705 1.057h-.705c-.389 0-.705-.473-.705-1.057v-8.014c0-.584.315-1.057.705-1.057h.705c.389 0 .705.473.705 1.057zm-8.457 0c0 .584-.316 1.057-.705 1.057h-.705c-.389 0-.705-.473-.705-1.057v-8.014c0-.584.316-1.057.705-1.057h.705c.389 0 .705.473.705 1.057zm4.228 0c0 .584-.316 1.057-.705 1.057h-.704c-.389 0-.705-.473-.705-1.057v-8.014c0-.584.316-1.057.705-1.057h.704c.389 0 .705.473.705 1.057z"/><path fill="#ffcc4d" d="M25.929 21.357c0 .584-.473 1.057-1.057 1.057H11.129a1.057 1.057 0 1 1 0-2.114h13.743c.583 0 1.057.473 1.057 1.057"/><path fill="#ffd983" d="M26.986 22.414c0 .584-.473 1.057-1.057 1.057H10.071a1.057 1.057 0 1 1 0-2.114h15.857c.584 0 1.058.473 1.058 1.057"/><path fill="#ffd983" d="M27.514 23.207a.793.793 0 0 1-.793.793H9.279a.793.793 0 1 1 0-1.586h17.443c.437 0 .792.355.792.793"/><path fill="#ffcc4d" d="M25.929 12.286c0-.584-.505-1.057-1.127-1.057H11.129c-.623 0-1.057.473-1.057 1.057c0 .397.204.739.529.92v.666h2.114v-.529h2.114v.529h2.114v-.529h2.114v.529h2.114v-.529h2.114v.529H25.4v-.693c.317-.188.529-.517.529-.893"/><path fill="#ffd983" d="M9.543 11.463c0-.545.535-.763.535-.763L17.956 7l7.953 3.7s.548.122.548.767v.291H9.543z"/><path fill="#ffac33" d="M18 8.343s-5.455 2.571-5.999 2.803c-.545.231-.363.611.001.611h11.97c.562 0 .429-.429-.017-.661C23.509 10.865 18 8.343 18 8.343"/><path fill="#ffd983" d="M26.457 11.757a.529.529 0 0 1-.529.529H10.071a.53.53 0 0 1 0-1.058l15.857.003a.527.527 0 0 1 .529.526"/></svg>
                </span> 
                {/* {formatMultiPrice(defaultAmount, global_currency)}  */}

                <input className="amount-coin rounded" value={defaultAmount}
                onChange={customAmount} 
                type="number"  />
                Each</p>
                <div className='incresecounter d-flex align-items-center' >
                      <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px]  border  rounded-4 ' onClick={decresevalue} >-</button>
                      <div className='border px-3 py-2 rounded-5 mx-1' >{tipQuantity}</div>
                      <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px] border  rounded-4 ' onClick={incresevalue} >+</button>
                </div>
            </div>

            {/* <div className="form-field mb-4">
                <div className="position-relative currency-wrapper " >
                    <span className="currency-tag">{global_currency || 'GBP'}</span>
                    <input disabled className="form-input w-100 rounded" value={amount}
                    onChange={customAmount} 
                    type="number" placeholder="Enter amount.. " />
                </div>
            </div> */}

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
                  <p className='text-small text-dark font-bold' >
                    <input className='cursor-pointer' 
                    type="checkbox" ref={checkRef}  
                    id="termaccept"  name="termaccept"  
                    value="termaccept" required 
                    onChange={(e) => setData("termaccept", e.target.value)}></input>
                      By supporting me, you agree that this support is a donation and as a thank you, you get access to my profile feed and supporter only posts. To view these, you will need to create an account with the e-mail you used to send the support
                  </p>
                </label>
            </div>

            <div className='termselect mt-3 mb-3'>
                <label htmlFor="keepanonymous">
                  <p className='text-small text-dark font-bold'> 
                    <input className='cursor-pointer' type="checkbox" 
                    id="keepanonymous" name="keepanonymous"  
                    value="keepanonymous"
                    onChange={(e) => setData("anonymous", e.target.checked ? 1 : 0 )}
                    ></input> Keep anonymous 
                  </p> 
                </label>
                <p className="text-muted text-small mt-1 mb-3" >Your personal email and name will be private.</p>
            </div>
            <Link className={`inline-flex items-center px-4 border shadow-black
               rounded-[30px] btn-pink md justify-content-center  border-0
              ease-in-out duration-150 flex button text-center w-100  
              font-CeraGR mx-auto ${checkRef.current && checkRef.current.checked ? '' :'disabled'}`}  href={`tip-jar/pay/${user.uuid}`} 
              method="post" data={{...data, amount:amount}} > {processing ? "Processing" : 'Support Me'} </Link>
            <div className='securestripe text-center mt-3' >
              🔒 Secured via <b>Stripe</b>
            </div>
          </div>
      </div>
      <></>
  </div>
}
