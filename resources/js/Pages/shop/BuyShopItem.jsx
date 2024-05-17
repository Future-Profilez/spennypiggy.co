import Popup from '@/Components/Popup'
import { Link, usePage } from '@inertiajs/react';
import React from 'react'
import { useState } from 'react';
import userdefaultphoto from '../../../assets/img/userphoto.png';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';
import toast from 'react-hot-toast';
import PriceFormat from '@/includes/PriceFormat';

export default function BuyShopItem({classes, text, s}) {

   const { formatMultiPrice} = PriceFormat();
   const { global_currency, auth, user } = usePage().props;
   const [open, setOpen] = useState(false);
   const [close, setClose] = useState();
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
               {fairPrice ? <p className="text-gray-500 my-2 ">You will be charged <strong  className='text-black' > {formatMultiPrice((fairPrice || s.price), s?.currency || 'GBP') } + processing fee </strong>.</p> 
               : 
               <p className="text-gray-500 my-2 ">You will get it for free.</p> 
               }
            </div>

            <div className='my-3 shop-item flex justify-between w-full items-center bg-white rounded-xl' >
               <div className='shop-item-user flex bg-gray-200 p-3 rounded-4 items-center' >
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
         </div>
      </Popup>
    </>
  )
}
