import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { add_to_cart } from "../Pages/redux/UserSlice"; // Update the path accordingly

export default function ToCart({ actionfrom, checkoutbtn, ItemAdded, item, crowd, pending, uuid, text, classes, custom, removeItem, type, is_cart, amount, isEqual }) {
    
    const cartData = useSelector(state => state.data.cart.cart);
   
    // const static_cart = useState([
    //     {
    //         "user": {
    //             "id": 2,
    //             "name": "John Deo",
    //             "username": "naveen",
    //             "uuid": "ae03d616-3007-4d7b-b7f2-96af4d246c2c"
    //         },
    //         "items": [
    //             {
    //                 "id": 6,
    //                 "uuid": "3991ff24-93e9-401c-94c3-87927a456fb7",
    //                 "user_id": 2,
    //                 "wishname": "Hello Everyone !!",
    //                 "stripe_product_id": null,
    //                 "price": 66,
    //                 "price_id": "price_1OH8JrG7xsNScLmXcPcrWPSv",
    //                 "item_url": null,
    //                 "subscription": 2,
    //                 "subscription_period": null,
    //                 "repeat_purchase": 1,
    //                 "category": null,
    //                 "url": "https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/"
    //             },
    //             {
    //                 "id": 5,
    //                 "uuid": "4870f1a1-5936-42e7-bbfd-c280fb7dc469",
    //                 "user_id": 2,
    //                 "wishname": "Naveen Tehrpariya",
    //                 "stripe_product_id": "prod_P3k2jBHXMIOKbd",
    //                 "price": 555,
    //                 "price_id": "price_1OFcYYG7xsNScLmXvVXaTljK",
    //                 "item_url": null,
    //                 "subscription": 0,
    //                 "subscription_period": null,
    //                 "repeat_purchase": 1,
    //                 "category": null,
    //                 "url": "https://ucarecdn.com/29d065e3-5b8a-4ff0-972e-dad84ee164fb/?token=exp=1701105313~acl=/29d065e3-5b8a-4ff0-972e-dad84ee164fb/~hmac=4b74c60e29630a6edbbf13783d18f8b36dfae38ec12379821bc6dad370c817e9"
    //             }
    //         ],
    //         "loggeInUser":2
    //     }
    // ]);
    
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
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const addtocart = async (sets) => {
        if(item && item.product == 'surprise'){
            removeGiftItem();
            return false;
        } else {
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
            let cart_item = item;
            if(item && item.subscription == "2"){
                cart_item['price'] = amount;
            }
            dispatch(add_to_cart(cart_item));
            // axios.get(`/add-to-cart/${uuid}${amount ? `/${amount}` : ''}`).then(resp => {
            //     if (resp.data.success) {
            //         if (resp.data.added == true) {
            //             successAlert(resp.data.msg);
            //             // setis_Cart(true);
            //             ItemAdded("added");
            //             if(sets == 1){
            //             }
            //             if (resp.data.uuid) {
            //                 removeItem && removeItem(uuid);
            //             }
            //             if (type == "checkout") {
            //                 window.location = "/cart";
            //             }
            //         } else {
            //             successAlert(resp.data.msg);
            //             // setis_Cart(false);
            //             ItemAdded("removed");

            //         }
            //         if (resp.data.uuid) {
            //             removeItem && removeItem(uuid);
            //         }
            //         if (checkoutbtn) {
            //             window.location = '/cart';
            //         }
            //     } else {
            //         errorAlert(resp.data.msg);
            //     }
            //     if(actionfrom){
            //         window.location = '/cart';
            //     }
            //     setLoading(false);
            // }).catch(_err => {
            //     console.error("error", _err);
            //     setLoading(false);
            // });
        }
    };

    return <>
        {custom ?
            <div onClick={addtocart} >{custom}</div> :
            <LoaderButton disabled={loading} onClick={()=>addtocart(1)}
                className={`flex ${classes} mx-auto`}
                spinnerClassName='fill-red-600'>
                {loading ? "Proccessing" : is_cart ? "Remove From Cart" : text }
            </LoaderButton>
        }
    </>
}
