import { useAlerts } from '@/Components/Alerts';
import LoaderButton from '@/Components/LoaderButton';
import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ToCart({ text2, ItemAdded, item, crowd, pending, uuid, text, classes, custom, removeItem, type, is_cart, amount, isEqual }) {


    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [is_Cart, setis_Cart] = useState(is_cart);

    const addtocart = async (sets) => {
        if(item && item.subscription == "2" && isEqual){
            toast.error(`Wish item funding is completed.`);
            return false;
        }

        if (crowd && !amount) {
            toast.error(`Please enter a amount to gift this item. `);
            return false;
        }
        if (crowd && amount > pending) {
            toast.error(`Amount can not be more than remaining amount £${pending}. `);
            return false;
        }

        if (amount && amount < 50) {
            toast.error("Amount must be greater than 50.");
            return false;
        }
        setLoading(true);
        axios.get(`/add-to-cart/${uuid}${amount ? `/${amount}` : ''}`).then(resp => {
            if (resp.data.success) {
                if (resp.data.added == true) {
                    successAlert(resp.data.msg);
                    setis_Cart(true);
                    if(sets == 1){
                        ItemAdded();
                    }
                    if(sets == 2){
                        window.location = '/cart';
                    }
                } else {
                    successAlert(resp.data.msg);
                    setis_Cart(false);
                }
                if (resp.data.uuid) {
                    removeItem && removeItem(uuid);
                }
                if (type == 'checkout') {
                    window.location = '/cart';
                }
            } else {
                errorAlert(resp.data.msg);
            }
            setLoading(false);
        }).catch(_err => {
            console.error("error", _err);
            setLoading(false);
        });
    };

    const checkout = () => {
        window.location = '/cart';
    }

    return <>
        {custom ?
            <div onClick={addtocart} >{custom}</div>
            :
            is_Cart ?
            <>
                <LoaderButton disabled={loading} onClick={()=>addtocart(1)}
                    className={`flex  ${classes} mx-auto`}
                    spinnerClassName='fill-red-600'>
                    {loading ? "Proccessing" : is_Cart ? "Remove From Cart" : text ? text : "Add To Cart"}
                </LoaderButton>

                <LoaderButton disabled={loading} onClick={checkout}
                    className={`flex  ${classes} mx-auto`}
                    spinnerClassName='fill-red-600'>
                    Checkout
                </LoaderButton>
            </> :
            <>
             <LoaderButton disabled={loading} onClick={()=>addtocart(1)}
                    className={`flex  ${classes} mx-auto`}
                    spinnerClassName='fill-red-600'>
                    {loading ? "Proccessing" : is_Cart ? "Remove From Cart" : text ? text : "Add To Cart"}
                </LoaderButton>
                <LoaderButton disabled={loading} onClick={()=>addtocart(2)}
                    className={`flex  ${classes} mx-auto`}
                    spinnerClassName='fill-red-600'>
                    {loading ? "Proccessing" : is_Cart ? "Remove From Cart" : text2}
                </LoaderButton>
            </>

        }
    </>
}

