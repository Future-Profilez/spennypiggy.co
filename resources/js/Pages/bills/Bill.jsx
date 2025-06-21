import React from 'react';
import { useState } from 'react';
import uploadedimg from '../../../assets/img/uploadedimg.png';
import { useEffect } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { Link, router, usePage } from "@inertiajs/react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const AddBills = React.lazy(() => import('./AddBills'));
import DropdownButton from 'react-bootstrap/DropdownButton';
import RemoveBill from './RemoveBill';
import { useAlerts } from '@/Components/Alerts';

export default function Bill(props) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();

  const {auth} = usePage().props;
  const { format, formatMultiPrice } = PriceFormat();
  const { itm, itemid, IsloggedIn, classes, key   } = props;
  const { attributes, listeners, isDragging, index, over, setNodeRef, transform, transition } = useSortable({ id: itm && itm.id });
  const style = {
    transform: CSS.Translate.toString(transform)
  };

  const stylenone = {
    transform: '',
  };

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

  const gotologin = () => {
    errorAlert("You must login first.");
    router.visit(`/login?redirect=${`/bill/checkout/${itm.uuid}`}`);
  }

  return <>
    <div key={key} style={IsloggedIn ? style : stylenone}  className={` position-relative billbox wish-item-box ${classes} ${isDragging ? 'dragging' : ''}`}>
      <div  className='wishlistcntbox  mb-3 mb-sm-4 whbg relative !rounded-[23px] shadow-pinks overflow-hidden    border-3 md:border-4 !border-[#F94F97] w-full'>
            {IsloggedIn && itm && itm.approved === 0 ?
              <div className='approvalmessge membership m-3 rounded-3 p-3 py-2 mb-2 ' >
                Bill item waiting for approval. Currently only you can see this bill.</div>
            : ''}

            <div onClick={openAddtocart} className='wishlistimg cursor-pointer relative'>
              <LazyLoadImage
              alt={"image"} useIntersectionObserver={true} effect="blur"
              height={193}
              src={itm?.perma_link ? itm?.perma_link : uploadedimg} className=''
              width={243} />
              <div className='bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full capitalize absolute bottom-3 right-3' >{itm && itm.period || "Monthly"} Subscribable </div>
              {IsloggedIn ?
                <DropdownButton
                className='edit-post pe-0 absolute top-2 m-1 right-3 z-1 ' id="dropdown-basic-button"
                title={
                <div className='dots' >
                <span className='bg-white' ></span>
                <span className='bg-white' ></span>
                <span className='bg-white' ></span>
                </div>}>
                   <RemoveBill classes={`px-[18px] py-2 text-start w-full`}   uuid={itm.uuid} text="Remove Bill" />
                </DropdownButton>
              : ''}
            </div>
            <div onClick={openAddtocart} className='wishlistdetial cursor-pointer relative'>
              <div>
                <h4 className={`text-lg  !text-gray-800 text-center el1 `} >{itm.name}</h4>
                <h5 className='text-center font-bold font-poppins  text-black my-2 titleprice'>{formatMultiPrice(itm.price, itm?.currency || 'GBP')}
                    <button className='tooltipbtn' >?<p>*just not including service fee.</p></button>
                </h5>
              </div>
            <p className=' text-[12px] mt-3 text-center' >Pay bill and gain access to member only posts</p>
            <div className='flex justify-center mt-2' >
              {IsloggedIn ?
                  <AddBills classes="pinkbg hover:opacity-[0.8] text-white   text-[13px] md:text-normal py-2 px-4 rounded-full shadow" text="Update Bill"
                  item={itm} isEdit={true} />
                :
                <>
                {
                  auth && auth.user !== null ?
                  <Link method='get'
                    href={route('bill.checkout',{uuid: itm.uuid})}
                    className='pinkbg hover:opacity-[0.8] text-white  text-[13px] md:text-normal py-2 px-4 rounded-full shadow' >Pay Bill</Link>
                  :
                  <button
                     onClick={gotologin}
                    className='pinkbg hover:opacity-[0.8] text-white   text-[13px] md:text-normal py-2 px-4 rounded-full shadow' >Pay Bill</button>

                }
                </>
              }
            </div>
            </div>

        
      </div>
    </div>
  </>
}
