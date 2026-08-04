import { useState } from "react";
import cartproductimg from '../../../assets/img/cartproductimg.png';
import PriceFormat from "@/includes/PriceFormat";
import { useAlerts } from "@/Components/Alerts";
import axios from "axios";
import RewardSummary from "@/Components/Reward/RewardSummary";

export default function CartItem({data, removeCart, quantityUpdate, currency, isLoggedIn, totalPrice}) {

    const { formatMultiPrice } = PriceFormat();
    const [quantity, setQuantity] = useState(data && data.quantity || 1);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [intialItem, setInitialItem] = useState();

    const updatequantity = (quantity) => {
        axios.get(`cart-update-quantity/${data && data.uuid}/${quantity}`).then(resp => {
            if (
                resp?.data?.success === false &&
                (resp?.data?.message === "Login required" || resp?.data?.code === "AUTH_REQUIRED") &&
                !isLoggedIn
            ) {
                setQuantity(intialItem);
                const msg = resp?.data?.msg || "Larger payments more than £50 need to login.";
                errorAlert(msg);
                window.location = `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`;
                return;
            }
            if (resp?.data?.success === false) {
                errorAlert(resp?.data?.message || "Unable to update quantity.");
                setQuantity(intialItem);
            }
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
        <div className={`fading border cartlist flex justify-between  content-between items-center border-black shadow-black rounded-[20px] 
            mb-3 mb-md-4 mb-ml-5 p-3 p-md-4`}>
            <div className='prodcartbox items-center'>
                <div className='productimg !rounded-[15px]  me-3'>
                    <img src={data.url || cartproductimg} alt='img' />
                </div>
                <div>
                    <div className=' !text-normal md:!text-lg font-bold !text-black '>{data.wishname}</div>
                    <div className='font-bold'>
                        <div className="flex flex-col">
                            <span>
                                {formatMultiPrice(totalPrice || ((data.price || 0) + (data.tax || 0)), currency)}
                            </span>
                            <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight">
                                *Includes platform and payment processing fees{data?.type === 'physical' ? " and shipping" : ""}
                            </span>
                        </div>
                    </div>
                    {/* Each basket row states what it buys — the totals alone
                        never did. */}
                    <RewardSummary
                        className="mt-2"
                        compact
                        title={data?.reward_title}
                        type={data?.reward_type}
                        description={data?.reward_description}
                    />
                </div>
            </div>


            <div className=' items-center'>
                <div className="quty hidden items-center me-4 ">
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
