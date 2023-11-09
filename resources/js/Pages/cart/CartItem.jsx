import React, { useState } from "react";
import cartproductimg from '../../../assets/img/cartproductimg.png';
import ToCart from "@/wishlist/ToCart";

export default function CartItem({data}) {

    const [itemRemoved, setItemRemoved] = useState(null);
    const removeItem = (e) => { 
        setItemRemoved(e);
    }

    let [count, setCount] = useState(0);
    function incrementCount(){
        count = count + 1;
        setCount(count);
    }

    function decrementCount(){
        count = count - 1;
        setCount(count);
    }

  return (
        <div className={`${itemRemoved === data.uuid ? 'd-none' : ''} border cartlist flex flex-wrap justify-between items-center content-between items-center border-purple shadow-purple rounded-xl mb-5 p-4`}>
            <div className='prodcartbox items-center'>
                <div className='productimg'>
                    <img src={data.url || cartproductimg} alt='img' />
                </div>
                <div className='cartProdTitle ps-3'>{data.wishname}</div>
            </div>

            <div className="d-none quty flex items-center">
                <button onClick={decrementCount} disabled>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12.998H5V10.998H19V12.998Z" fill="black"/>
                </svg>
                </button>
                {/* <div className="qutynum">{count}</div> */}
                <div className="qutynum">1</div>
                <button onClick={incrementCount}  disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z" fill="black"/>
                    </svg>
                </button>
            </div>

            <div className='cartProRtbox  items-center'>
                <div className='cartPric pe-5'>
                    £ {data.price}
                </div>
                <ToCart  removeItem={removeItem} uuid={data.uuid} custom={<><button className='del'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" fill="#FF6565"/>
                    </svg>
                </button></>} >
                </ToCart>
            </div>
        </div>
  )
}
