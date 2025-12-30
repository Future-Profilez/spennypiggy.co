import { lazy, memo, useMemo } from "react";
import { useState } from 'react';
import uploadedimg from '../../../assets/img/uploadedimg.png';
import { useEffect } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { Link, router, usePage } from "@inertiajs/react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const AddBills = lazy(() => import('./AddBills'));
import DropdownButton from 'react-bootstrap/DropdownButton';
import RemoveBill from './RemoveBill';
import { useAlerts } from '@/Components/Alerts';

function Bill(props) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const {auth} = usePage().props;
    const { format, formatMultiPrice } = PriceFormat();
    const { itm, itemid, IsloggedIn, classes, key } = props;
    
    const { attributes, listeners, isDragging, index, over, setNodeRef, transform, transition } = useSortable({ id: itm && itm.id });
    
    // Memoize expensive calculations
    const style = useMemo(() => ({
        transform: CSS.Translate.toString(transform)
    }), [transform]);

    const stylenone = useMemo(() => ({
        transform: '',
    }), []);

    const [itemUID, setItemUID] = useState(itemid);
    const [open, setOpen] = useState();
    
    const openAddtocart = useMemo(() => () => {
        setOpen(true);
        setTimeout(() => {
            setOpen();
        }, 1000);
    }, []);

    useEffect(() => {
        if(itemUID == itm.uuid) {
            setOpen(true);
        }
    }, [itemUID, itm.uuid]);

    // Memoize formatted price to avoid recalculation
    const formattedPrice = useMemo(() => 
        formatMultiPrice(itm.price, itm?.currency || 'GBP'), 
        [formatMultiPrice, itm.price, itm?.currency]
    );
    
    // Memoize image source
    const imageSrc = useMemo(() => 
        itm?.perma_link || uploadedimg, 
        [itm?.perma_link]
    );
    
    // Memoize period display
    const periodDisplay = useMemo(() => 
        (itm && itm.period) || "Monthly", 
        [itm?.period]
    );

  return <>
    <div key={key} style={IsloggedIn ? style : stylenone}  className={` position-relative billbox wish-item-box ${classes} ${isDragging ? 'dragging' : ''}`}>
      <div  className='wishlistcntbox  mb-3 mb-sm-4 whbg relative !rounded-[23px] shadow-pinks overflow-hidden    border-3 md:border-4 !border-[#F94F97] w-full'>
            {IsloggedIn && itm && itm.approved === 0 ?
              <div className='approvalmessge membership m-3 rounded-3 p-3 py-2 mb-2 ' >
                Bill item waiting for approval. Currently only you can see this bill.</div>
            : ''}

            <div onClick={openAddtocart} className='wishlistimg cursor-pointer relative'>
              <LazyLoadImage
              alt={"image"}  effect="blur"
              height={193}
              src={imageSrc} className='object-cover w-full '
              width={220} />
              <div className='bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full capitalize absolute bottom-3 right-3' >{periodDisplay} Subscribable </div>
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
                
                <h5 className='text-center font-bold font-poppins  text-black my-2 titleprice'>{formattedPrice}
                    <button className='tooltipbtn' >?<p>*just not including service fee.</p></button>
                </h5>
              </div>
            <p className=' text-[12px] mt-3 text-center' >Pay bill and gain access to member only posts</p>
            <div className='flex justify-center mt-2' >
              {IsloggedIn ?
                  <AddBills classes="pinkbg hover:opacity-[0.8] text-white text-[13px] md:text-normal py-2 px-4 rounded-full shadow" text="Update Bill"
                  item={itm} isEdit={true} />
                :
                <Link method='get' as="button"
                  href={route('bill.checkout',{uuid: itm.uuid})}
                  className='pinkbg hover:opacity-[0.8] text-white  text-[13px] md:text-normal py-2 px-4 rounded-full shadow' >
                    Pay Bill
                </Link>
              }
            </div>
            <div className="flex items-center justify-center mt-2">
                {itm?.user ? (
                    <>
                      <span className="text-xs text-gray-700 font-medium">
                      by 
                    </span>
                    <Link as="button"
                      method="get"
                      href={route('user.show', { username: itm.user.username })}
                      className="ml-1 text-xs text-[#F94F97] underline hover:opacity-90"
                    >
                      @{itm.user.username}
                    </Link>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">Creator Unavailable</span>
                )}
            </div>
          </div>
      </div>
    </div>
  </>
}

// Export with memo and comparison function
export default memo(Bill, (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
        prevProps.itm?.id === nextProps.itm?.id &&
        prevProps.itm?.name === nextProps.itm?.name &&
        prevProps.itm?.price === nextProps.itm?.price &&
        prevProps.itm?.currency === nextProps.itm?.currency &&
        prevProps.itm?.period === nextProps.itm?.period &&
        prevProps.itm?.approved === nextProps.itm?.approved &&
        prevProps.itm?.perma_link === nextProps.itm?.perma_link &&
        prevProps.IsloggedIn === nextProps.IsloggedIn &&
        prevProps.itemid === nextProps.itemid &&
        prevProps.classes === nextProps.classes
    );
});
