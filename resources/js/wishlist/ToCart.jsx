import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { add_to_cart } from "../Pages/redux/UserSlice"; // Update the path accordingly
import { useEffect } from 'react';
import CartTransform from '@/includes/CartTransform';

export default function ToCart({ 
    is_surprise, surprise_amount, surprise_message, owner, 
    auth, actionfrom, checkoutbtn, ItemAdded, item, crowd, pending, uuid, text, classes, custom, removeItem, type, is_cart, amount, isEqual }) {
    
    const { transform } = CartTransform();
   

    const [itemMain, setItemMain] = useState(item);
    const dispatch = useDispatch();
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);

    const removeGiftItem = () => {
        axios.get(`remove-surprise-from-cart/${uuid}`)
        .then((resp) => {
            if (resp.data.success) {
                successAlert(resp.data.msg);
                window.location = "/cart";
            }
            if (resp.data.error) {
                errorAlert(resp.data.msg);
            }
        }).catch((_err) => {
            console.error("error", _err);
        });
    };

    const addtocart = async (sets) => {
        function check(){
            if (checkoutbtn) {
                window.location = "/cart";
            }
        }
        if (item && item.subscription == "2" && isEqual) {
            toast.error(`Wish item funding is completed.`);
            return false;
        }
        if (!item?.is_cart && crowd && !amount) {
            toast.error(`Please enter a amount to gift this item.`);
            return false;
        }
        if (crowd && amount > pending) {
            toast.error(`Amount can not be more than remaining amount £${pending}.`);
            return false;
        }
        if (amount && amount < 50) {
            toast.error("Amount must be greater than 50.");
            return false;
        }
        setLoading(true);
        console.log("auth",auth)
        if(auth && auth.id){
            axios.get(`/add-to-cart/${uuid}${amount ? `/${amount}` : ''}`).then(resp => {
            if (resp.data.success) {
                if (resp.data.added == true) {
                    successAlert(resp.data.msg);
                    ItemAdded && ItemAdded("added");
                    check();
                } else {
                    successAlert(resp.data.msg);
                }
                if (resp.data.uuid) {
                    removeItem && removeItem(uuid);
                }
                } else { errorAlert(resp.data.msg);
                }
            }).catch(_err => {
                console.error("error", _err);
            });
        }
        else {
            if(is_surprise){
                const surpriseItem = {
                    user_id: owner && owner.id,
                    name: owner && owner.name,
                    username:owner && owner.username,
                    user : {
                        id: owner && owner.id,
                        uuid: owner && owner.uuid,
                        user_id: owner && owner.id,
                        name: owner && owner.name,
                        username:owner && owner.username, 
                    },
                    product: "surprise",
                    surprise_message: surprise_message,
                    wishname: "Surprise Gift",
                    quantity: 1,
                    stripe_product_id: null,
                    price: surprise_amount,
                    price_id: null,
                    item_url: null,
                    subscription: null,
                    subscription_period: null,
                    repeat_purchase: null,
                    category: null,
                    perma_link: "https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/"
                }
                dispatch(add_to_cart(surpriseItem));
                console.log("cart_item surprise", surpriseItem);
                ItemAdded && ItemAdded("added");
            } else {
                let cart_items = {...itemMain};
                if(item && item.subscription == "2"){
                    cart_items['price'] = amount;
                }
                dispatch(add_to_cart(cart_items));
                ItemAdded && ItemAdded("added");
            }
            check();
            ItemAdded && ItemAdded("added");
            successAlert("item added in cart.");
        }
        setLoading(false);
    };

    const cartData = useSelector(state => state.data.cart.cart);
    const loggedInUserId = null;

    async function updateCartData (){
        setTimeout(()=>{
            if(cartData && cartData.length){
                const data = transform(cartData, loggedInUserId);
                localStorage && localStorage.setItem('cart',JSON.stringify(data));
            }
        },1000);
    }

    useEffect(()=>{
        updateCartData();
    },[cartData, loading]);

    return <>
        {custom ?
            <div onClick={addtocart} >{custom}</div> :
            <LoaderButton disabled={loading} onClick={()=>addtocart(1)}
                className={`flex ${classes} mx-auto`}
                spinnerClassName='fill-red-600'>
                {loading ? "Proccessing" : text }
            </LoaderButton>
        }
    </>
}
