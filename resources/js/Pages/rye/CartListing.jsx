import React from 'react'
import { useEffect } from 'react';
import Axios from "axios";
import { useState } from 'react';
import { usePage } from '@inertiajs/react';


export default function CartListing() {
    const { auth, user } = usePage().props;
    const [ cartsItems, setCartItems ] = useState([]);
    const [loading, setLoading]= useState(false);
    const fetchCartItem = (e) => { 
        console.log("Hello");
        setLoading(true);
        Axios.get(`get-cart-details`).then(resp => {
            console.log("resp?.data",resp?.data);
            // setCartItems(resp.data.carts);
            setLoading(false);
        }).catch(_err => {
            console.error("error", _err);
            setLoading(false);
        });
    };

    useEffect(()=>{
        if(auth ){
            fetchCartItem();
        }
    },[]);
  return (
    <div>CartListing</div>
  )
}