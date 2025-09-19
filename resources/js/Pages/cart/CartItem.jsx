import { useState } from "react";
import cartproductimg from '../../../assets/img/cartproductimg.png';
import PriceFormat from "@/includes/PriceFormat";
import { useAlerts } from "@/Components/Alerts";
import axios from "axios";

export default function CartItem({data, removeCart, quantityUpdate, currency}) {

    const { formatMultiPrice } = PriceFormat();
    const [quantity, setQuantity] = useState(data && data.quantity || 1);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [intialItem, setInitialItem] = useState();

    const updatequantity = (quantity) => {
        axios.get(`cart-update-quantity/${data && data.uuid}/${quantity}`).then(resp => {
        }).catch(_err => {
            console.error("error", _err);
            errorAlert("Unable to update quantity.")
            setQuantity(intialItem);
        });
    };

    async function incrementCount(){
        setInitialItem(quantity);
        let counts = quantity + 1;
        setQuantity(counts);
        updatequantity(counts);
        quantityUpdate("add", data && data.price, data && data.tax);
    }

    async function decrementCount(){
        setInitialItem(quantity);
        let counts = quantity - 1;
        setQuantity(counts);
        updatequantity(counts);
        quantityUpdate("minus", data && data.price, data && data.tax);
    }

    return (
        <div className={`border cartlist flex flex-wrap justify-between  content-between items-center border-black shadow-black rounded-[20px]
            mb-3 mb-md-4 mb-ml-5 p-3 p-md-4`}>
            <div className='prodcartbox items-center'>
                <div className='productimg !rounded-[10px] me-3'>
                    <img src={data.url || cartproductimg} alt='img' />
                </div>
                <div>
                    <div className=' !text-normal md:!text-lg font-bold !text-black '>{data.wishname}</div>
                    <div className='font-bold'>
                        {formatMultiPrice(data.price, currency)}
                    </div>
                </div>
            </div>


            <div className='cartProRtbox   items-center'>
                <div className="quty flex items-center me-4 ">
                    <button className="disabled" disabled={quantity == 1} onClick={decrementCount}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12.998H5V10.998H19V12.998Z" fill="black"/>
                        </svg>
                    </button>
                    <div className="qutynum">{quantity}</div>
                    <button className="disabled" onClick={incrementCount}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z" fill="black"/>
                        </svg>
                    </button>
                </div>

                <button className='del' onClick={()=>removeCart(data && data.uuid)} ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" fill="#FF6565"/>
                    </svg></button>
                    {/* <ToCart actionfrom={true} removeItem={removeItem} item={data}
                    uuid={data.uuid} custom={<><button className='del'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" fill="#FF6565"/>
                        </svg>
                    </button></>} >
                    </ToCart> */}
            </div>
        </div>
    )
}
