import React from "react";
import { usePage } from '@inertiajs/react';
import Bill from "./Bill";
import Nocontent from "@/includes/Nocontent";

export default function Billslist({IsloggedIn }) {
    const { bills } = usePage().props;
    return (
        <>
        {bills && bills.length ? 
            <div className={`bills_lists row`} >
                {bills && bills.map((b, i)=>{
                    return <Bill  IsloggedIn={IsloggedIn}
                    key={`wish-item-${i}`}
                    classes="col-xl-3 col-lg-3 col-md-4 col-6"
                    itm={b} />
                })}
            </div>
        :  <Nocontent text='nothing to see' /> 
        }
        </>
    );
}
