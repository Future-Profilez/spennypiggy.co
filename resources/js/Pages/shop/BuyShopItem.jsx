import Popup from '@/Components/Popup'
import { Link, usePage } from '@inertiajs/react';
import React from 'react'
import { useState } from 'react';
import userdefaultphoto from '../../../assets/img/userphoto.png';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';
import toast from 'react-hot-toast';
import PriceFormat from '@/includes/PriceFormat';
import { useEffect } from 'react';
import { useRef } from 'react';

export default function BuyShopItem({opened, classes, text, s, open, isPaid}) {

   const { formatMultiPrice} = PriceFormat();
   const { global_currency, auth, user } = usePage().props;
   const [close, setClose] = useState();

   useEffect(()=>{
      if(open){
         setClose(true)
      }
   },[open]);

   const { successAlert, errorAlert, infoAlert, errorsHandling } = useAlerts();
   const [isfairPrice, setIsfaiPrice] = useState(false);
   
   const actualPrice = () => { 
      if(s && s.is_member == 1 && s.special_member_price){
         return s.special_member_price;
      } else { 
         return s.price
      }
   }

   const [fairPrice, setfaiPrice] = useState(actualPrice());

   const enterFairPrice = (e) => { 
      if(e.target.value){
         setIsfaiPrice(true);
      } else { 
         setIsfaiPrice(false);
      }
      setfaiPrice(e.target.value);
   }
   const slug = (inputString) => { 
      return inputString
      .toLowerCase()  
      .replace(/[^a-z0-9\s-]/g, '') 
      .trim()  
      .replace(/\s+/g, '-')  
      .replace(/-+/g, '-');  
   }

   const [email, setEmail] = useState(auth && auth.user?.email || '');
   const [name, setName] = useState(auth && auth.user?.name || '');
   const [quantity, setQuantity] = useState(1);
   const [loading, setLoading] = useState(false);
   const buyItem = () => {
      if(isfairPrice && (fairPrice < s.price+1)) {
         errorAlert('Fair Price must be greater than actual price');
         return false;
      } 
      setLoading(true);
      axios.get(`/shop/buy/${s.uuid}?from=${name}&email=${email}&quantity=${quantity}&amount=${fairPrice}`).then(res => {
         if(res.data.url){
            window.location.href = res.data.url;
         } else {
            setLoading(false);
            errorAlert('Something went wrong');
         }
       }).catch(err => {
           setLoading(false);
           errorsHandling(err)
       });
   }

   const [replySent, setReplySent] = useState(false);
   const [posting, setposting] = useState(false);
   const [reply, setReply] = useState();
   const inputref = useRef();
   const sendReply = async () => { 
      setposting(true)
      axios.post(`/shop/answer-to-payment/${isPaid}`, { 
         answer: reply
      }).then(res => {
         if(res.data.status){
            inputref.current.value = '';
            setReply();
            successAlert(res.data.msg);
            setReplySent(true)
         } else {
            errorAlert(res.data.msg);
         }
         setposting(false);
       }).catch(err => {
         setposting(false);
         errorsHandling(err);
       });
   }

   const [copied, setCopied] = React.useState(false);
   const handleCopy = () => {
      const text = window.location.href;
      navigator.clipboard.writeText(text).then(() => {
         setCopied(true);
         toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
   };

  return (
    <>
      <Popup
         modalclassName="pinkmodal sendSurprize-modal"
         space="4" size="md"
         action={close} classes={classes}
         text={text} >
         <div class={`${loading ? "item-purchasing" : ""}`}>
            <div className="mx-auto w-32 h-32 relative -mt-16 border-4 border-white rounded-full overflow-hidden">
               <img className="object-cover object-center h-32" src={s.user.avatar_url   || userdefaultphoto } alt='Woman looking front' />
            </div>
            <div className="text-center mt-2">
               <Link href={`/${s.user.username }`} className="font-semibold text-black">{s.user.name || "User"}</Link>
            </div>

            {isPaid && opened == 0 ? 
               <>
                <h2 className='text-center font-bold text-xl py-2' >Thank you for your purchase!</h2>
                  <div className='border border-gray-200 p-3 rounded-[20px] mt-4' >
                     <div className='mb-3 shop-item flex justify-between w-full items-center bg-white rounded-xl' >
                        <div className='shop-item-user w-full flex bg-gray-100 p-3 rounded-4 items-center' >
                           <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-img w-12 h-12 min-w-12' >
                              <img className='w-full h-full object-cover rounded-lg' src={s.perma_link} alt='' />
                           </Link>
                           <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-text ps-3 ' >
                              <h2 className='text-md font-bold'>{s.name}</h2>
                              <p className='text-gray-500 text-sm line-clamp-1 '>{s.description}</p>
                           </Link>
                        </div>
                     </div>

                     {s && s.success_page_type == 'text' ? 
                       <> 
                       <p>{s && s.success_page_value}</p>
                     </> :
                     <a target="_blank" className='text-blue-800 text-break' href={s && s.success_page_value} >{s && s.success_page_value}</a>
                     }

                    {s.ask_question && !replySent ? <>
                     <p className='text-start mt-3' >{s.ask_question} ?</p>
                      <input ref={inputref} onChange={(e)=>setReply(e.target.value)} className='text-black bg-gray-100 rounded-lg w-full mt-2 px-3 py-2 border border-gray-200' type="text" placeholder="Ask your question ??" />
                      {reply ? <button onClick={sendReply} className='pinkbg text-center text-white px-3 py-1 mt-3 m-auto d-table rounded-[20px]' >{posting ? "Posting" : "Post"}</button>: ''}
                    </> : ''
                   }
                  
                  </div>

                  <div className="ShareSupport" >
                     <h2 className="text-black font-bold text-center font-2xl mb-2 mt-10" >Share your support</h2>
                     <p className='text-center' >{s.user.name} would love a shoutout! Share it out or tell your friends using this link:</p>
                     <button onClick={handleCopy} className="bg-gray-200 rounded-[30px] px-4 py-2 m-auto d-table mt-3 text-sm" >Copy Link</button> 
                  </div>

               </> 
               :
            <>
               <div className="text-center mt-2">
                  {fairPrice ? <p className="text-gray-500 my-2 ">You will be charged <strong  className='text-black' > {formatMultiPrice((fairPrice || s.price), s?.currency || 'GBP') } + processing fee </strong>.</p> 
                  : 
                  <p className="text-gray-500 my-2 ">You will get it for free.</p> 
               }
               </div>
               <div className='my-3 shop-item flex justify-between w-full items-center bg-white rounded-xl' >
                  <div className='shop-item-user w-full flex bg-gray-100 p-3 rounded-4 items-center' >
                     <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-img w-12 h-12 min-w-12' >
                        <img className='w-full h-full object-cover rounded-lg' src={s.perma_link} alt='' />
                     </Link>
                     <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-text ps-3 ' >
                        <h2 className='text-md font-bold'>{s.name}</h2>
                        <p className='text-gray-500 text-sm line-clamp-1 '>{s.description}</p>
                     </Link>
                  </div>
               </div>
               {/* <p className='mb-1' >Enter a fair price (optional)</p>
               <input required onChange={enterFairPrice} min={s.price}
               className="form-input w-100 rounded mb-3" placeholder={`+${s.price}`} type="number" /> */}
               <div className="form-field mb-3">
                  <p className='mb-1'>Name</p>
                  <input required disabled={auth && auth.user?.name ? true : false}
                     className="form-input w-100 rounded"
                     defaultValue={auth && auth.user?.name}
                     onChange={(e) => setName(e.target.value)}
                     type="text" placeholder="Enter name.. " />
               </div>
               <div className="form-field mb-3 ">
                  <p className='mb-1'>Email</p>
                  <input required  disabled={auth && auth.user?.email ? true : false}
                     className="form-input w-100 rounded"
                     defaultValue={auth && auth.user?.email}
                     onChange={(e) => setEmail(e.target.value)}
                     type="email" placeholder="Enter email.. " />
                  <p className='text-[12px] text-muted mt-1 ' >Your email address is kept private and will not be shown to anyone.</p>
               </div>
               <button disabled={loading} onClick={buyItem} class={`${loading ? "opacity-[0.5]" : ""}  w-1/2 block mx-auto rounded-full bg-gray-900 hover:shadow-lg font-semibold text-white px-6 py-2`}>{loading ? "Buying.." : "Pay"}</button>
               <div className='securestripe text-center mt-3' >
                  🔒 Secured via <b>Stripe</b>
               </div>
            </>}




         </div>
      </Popup>
    </>
  )
}
