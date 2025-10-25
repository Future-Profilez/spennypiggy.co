import { usePage } from '@inertiajs/react';
import { memo, useMemo } from 'react';
import Bill from "./Bill";
import Nocontent from "@/includes/Nocontent";

function Billslist({IsloggedIn }) {
    const { bills } = usePage().props;
    
    // Memoize the bills list to prevent unnecessary re-renders
    const memoizedBills = useMemo(() => {
        if (!bills || !bills.length) return null;
        
        return bills.map((b, i) => (
            <Bill
                IsloggedIn={IsloggedIn}
                key={`bill-${b.id || i}`} // Use bill ID if available
                classes=" "
                itm={b}
            />
        ));
    }, [bills, IsloggedIn]);
    
    return (
        <>
            {bills && bills.length ? 
                <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 !gap-2 sm:!gap-3 md:!gap-4`}>
                    {memoizedBills}
                </div>
                : <Nocontent text='nothing to see' /> 
            }
        </>
    );
}

// Export with memo
export default memo(Billslist, (prevProps, nextProps) => {
    return prevProps.IsloggedIn === nextProps.IsloggedIn;
});
