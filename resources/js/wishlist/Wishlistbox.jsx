import React from 'react';
import ShareProfile from './ShareProfile';
import { useState } from 'react';
import uploadedimg from '../../assets/img/uploadedimg.png';
import { useEffect } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Wishlist from '@/Pages/Auth/Wishlist';
import PriceFormat from '@/includes/PriceFormat';
const AddCart = React.lazy(() => import('./AddCart'));
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import PinWish from '@/includes/PinWish';


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
      <div className='wishlistcntbox mb-3 mb-sm-4 whbg relative  shadow-voilet '>
        {IsloggedIn ?
          <>
            

            <Wishlist openPop={open} item={itm} editpop={true} fetchingcats={fetchingcats} categories={categories} />  
          </>   
          : 
          <AddCart  IsloggedIn={IsloggedIn} auth={auth} item={itm} uuid={itm.uuid} action={open} />  
        }

       { IsloggedIn ? <DropdownButton 
         className='wishedit' id="dropdown-basic-button" 
         title={<div className='dots' >
          <span></span>
          <span></span>
          <span></span>
        </div>}>
          <Dropdown.Item>
            <PinWish fetchingcats={fetchingcats} id={itm.id} text="Pin item on the top" />
          </Dropdown.Item>
        </DropdownButton> : ''}

        {itm?.is_pin == 1 ? <div className='badge bg-info text-dark font-light pinned-badge' ><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M4 2h7v.278c0 .406-.086.778-.258 1.117-.172.339-.42.63-.742.875v2.86c.307.145.583.328.828.546.245.219.456.464.633.735.177.27.31.565.398.882.089.318.136.646.141.985v.5H8V14l-.5 1-.5-1v-3.222H3v-.5c0-.339.047-.664.14-.977.094-.312.227-.607.4-.883A3.404 3.404 0 0 1 5 7.13V4.27a2.561 2.561 0 0 1-.734-.875A2.505 2.505 0 0 1 4 2.278V2zm1.086.778c.042.125.094.232.156.32a1.494 1.494 0 0 0 .461.43L6 3.715v4.102l-.336.117c-.411.146-.76.383-1.047.711C4.331 8.973 4.09 9.573 4 10h7c-.088-.427-.33-1.027-.617-1.355a2.456 2.456 0 0 0-1.047-.71L9 7.816V3.715l.297-.18c.094-.057.177-.122.25-.195a2.28 2.28 0 0 0 .21-.242.968.968 0 0 0 .157-.32H5.086z"></path></g></svg> Pinned</div> : ''}
           
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
