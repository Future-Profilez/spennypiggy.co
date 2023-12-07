import React from 'react';
import ShareProfile from './ShareProfile';
import { useState } from 'react';
import uploadedimg from '../../assets/img/uploadedimg.png';
import { useEffect } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Wishlist from '@/Pages/Auth/Wishlist';
import PriceFormat from '@/includes/PriceFormat';
const AddCart = React.lazy(() => import('./AddCart'));

export default function Wishlistbox(props) {

  const { format } = PriceFormat();
  const { itm, itemid, auth, IsloggedIn, fetchingcats, categories } = props;
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
    const r = (paid/actual)*100;
    return r.toFixed(1);
  }
 
  const price = () => { 
      return itm.price;
  };
  

  return <>
      <div className='wishlistcntbox mb-4 whbg relative  shadow-voilet '>
        {IsloggedIn ?   
          <Wishlist openPop={open} item={itm} editpop={true} fetchingcats={fetchingcats} categories={categories} />  
          : 
          <AddCart  IsloggedIn={IsloggedIn} auth={auth} item={itm} uuid={itm.uuid} action={open} />  
        }
        <div onClick={openAddtocart} className='wishlistimg cursor-pointer'>
          <img src={itm?.perma_link ? itm?.perma_link : uploadedimg} alt='img' className='' />
        </div>
        <div onClick={openAddtocart} className='wishlistdetial cursor-pointer relative'>
          <div>
            <h4 className={`fon-bold text-dark ${itm.subscription !== '0' ? 'el1' : 'el2'}`} >{itm.wishname}</h4>
            <h5 className='font-CeraGRBold text-dark titleprice'>{format(price())}
                <button className='tooltipbtn' >?<p>*not including 20% service fee.</p></button>
            </h5>
          </div>
          {itm.subscription == '2' ? 
            <div className='crowd pt-2'>
            <ProgressBar now={itm.fullfill_amount} max={itm.price} />
            <p className='mt-1 mb-0 text-small' >{getPercentage(itm.price, itm.fullfill_amount)}% granted</p>
            </div> 
          : '' }
          {itm && itm.subscription == '1' ? <div className='subscribletag' > Subscribable </div> : ''}
        </div>
        <div className='sharelinks'>
          <ShareProfile username={itm.wishname} custom={`${window.location.href}?item=${itm.uuid}`} >
            <div className='text-pink font-GillSans'>Share Link</div>
          </ShareProfile>
        </div>
    </div>
  </>
}
