import { usePage } from '@inertiajs/react';
import Bill from "./Bill";
import Nocontent from "@/includes/Nocontent";

export default function Billslist({IsloggedIn }) {
    const { bills } = usePage().props;
    return (
        <>
        {bills && bills.length ? 
            <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 !gap-2 sm:!gap-3 md:!gap-4`} >
                {bills && bills.map((b, i)=>{
                    return <Bill  IsloggedIn={IsloggedIn}
                    key={`wish-item-${i}`}
                    classes=" "
                    itm={b} />
                })}
            </div>
        :  <Nocontent text='nothing to see' /> 
        }
        </>
    );
}
