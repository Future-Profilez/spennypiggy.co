import React from "react";
import  LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';
import DeviceID from "@/includes/DeviceID";
import { useDispatch, useSelector } from "react-redux";
import { add_to_cart } from "@/Pages/redux/UserSlice";

export default function ToCart({ 

    sub, surprise_amount, surprise_message, owner, 
    auth, actionfrom, checkoutbtn, ItemAdded, item, crowd, pending, uuid, text, classes, custom, removeItem, type, is_cart, amount, isEqual }) {
    
    const deviceID  = DeviceID();
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const cart = useSelector(state => state.data.cart.cart);

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
            toast.error(`Amount can not be more than remaining amount.`);
            return false;
        }
        setLoading(true);
        console.log("auth",auth)
        axios.get(`/add-to-cart/${uuid}/${deviceID}${sub ? `/${sub}` : '/onetime' }${amount ? `/${amount}/` : ''}`).then(resp => {
        if (resp.data.success) {
            if (resp.data.added == true) {
                successAlert(resp.data.msg);
                ItemAdded && ItemAdded("added");
                check();
                dispatch(add_to_cart(cart+1));
            } else {
                successAlert(resp.data.msg);
            }
            if (resp.data.uuid) {
                removeItem && removeItem(uuid);
            }
            } else { errorAlert(resp.data.msg);
            }
            setLoading(false);
        }).catch(_err => {
            console.error("error", _err);
            setLoading(false);
            errorAlert("Something went wrong !!.");
        });
    };

    return <>
        {custom ?
            <div onClick={addtocart} >{custom}</div> :
            <LoaderButton disabled={loading} onClick={()=>addtocart(1)}
                className={`flex ${classes} mx-auto`}
                spinnerClassName='fill-red-600'>
                {loading ? "Processing" : text }
            </LoaderButton>
        }
    </>
}
