import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import PriceFormat from "@/includes/PriceFormat";
import { LazyLoadImage } from "react-lazy-load-image-component";
import axios from "axios";
import { usePage } from '@inertiajs/react';
import Bill from "./Bill";
import LoadingScreen from "@/includes/LoadingScreen";
import Nocontent from "@/includes/Nocontent";

export default function Billslist({IsloggedIn, billupdate}) {

    const { global_currency, auth, user } = usePage().props;
    const { format, formatMultiPrice } = PriceFormat();

    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchBills = (signal) => {
        setLoading(true);
        axios.get(`/bills/${user && user.username}`, {signal}).then(resp => {
        setLists(resp.data.bills || []);
        setLoading(false);
        }).catch(_err => {
            console.error("error", _err);
            setLoading(false);
        });
    }

    useEffect(()=>{ 
        console.log('bills update')
        const controller = new AbortController();
        const {signal} = controller;
        fetchBills(signal)
        return () => controller.abort();
    },[billupdate]);

    return (
        <>
        {lists && lists.length ? 
            <div className={`bills_lists row`} >
                {lists && lists.map((b, i)=>{
                    return <Bill IsloggedIn={IsloggedIn}
                    key={`wish-item-${i}`}
                    classes="col-xl-3 col-lg-3 col-md-4 col-6"
                    itm={b} />
                })}
            </div>
        : !loading ? <Nocontent text='nothing to see' /> : ''
        }
        
        {loading ? <LoadingScreen /> : ''}
        </>
    );
}
