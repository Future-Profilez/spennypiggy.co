import React from 'react';
import miniplantimg from '../../assets/img/miniplantimg.jpg';
import { Link } from '@inertiajs/react';
import ToCart from './ToCart';
import ShareProfile from './ShareProfile';
import AddCart from './AddCart';
import { useState } from 'react';
import uploadedimg from '../../assets/img/uploadedimg.png';
import { useEffect } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Wishlist from '@/Pages/Auth/Wishlist';

 

export default function Wishlistbox({ itm, itemid, auth, IsloggedIn, fetchingcats, categories }) {

  const [itemUID, setItemUID] = useState(itemid);
  const [open, setOpen] = useState();

  const openAddtocart = () => {
    setOpen(true);
    setTimeout(()=>{
      setOpen();
    },1000);
  } 

  useEffect(()=>{
    if(itemUID == itm.uuid){
      setOpen(true);
    }
  },[itemUID]);


  const getPercentage = (actual, paid) => { 
    const r = (paid/actual)*100
    return r.toFixed(0);
  }

  console.log("itm", itm)

 
  return <>
      <div className='wishlistcntbox mb-4 whbg relative  shadow-voilet '>
        {IsloggedIn ?   
          <Wishlist item={itm} editpop={true} fetchingcats={fetchingcats} categories={categories} />  
          : 
        <AddCart auth={auth} item={itm} uuid={itm.uuid} action={open} /> 
        }

      <div onClick={openAddtocart} className='wishlistimg cursor-pointer'>
        <img src={itm?.perma_link ? itm?.perma_link : uploadedimg} alt='img' className='' />
      </div>
      <div onClick={openAddtocart} className='wishlistdetial cursor-pointer relative'>
        <div>
          <h4 className={`fon-bold text-dark ${itm.subscription == '2' ? 'el1' : 'el2'}`} >{itm.wishname}</h4>
          <h5 className='font-CeraGRBold text-dark'>£{itm.price}</h5>
        </div>
        {itm.subscription == '2' ? 
          <div className='crowd pt-2'>
          <ProgressBar now={itm.fullfill_amount} max={itm.price} />
          <p className='mt-1 mb-0 text-small' >{getPercentage(itm.price, itm.fullfill_amount)}% granted</p>
          </div> 
        : '' }
      </div>
      <div className='sharelinks'>
        <ShareProfile custom={`${window.location.href}?item=${itm.uuid}`} >
          <Link to="/" className='font-GillSans'>Share Link</Link>
        </ShareProfile>
      </div>
    </div>
  </>
}
