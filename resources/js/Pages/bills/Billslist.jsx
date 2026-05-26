import { usePage } from '@inertiajs/react';
import { memo, useMemo } from 'react';
import Bill from "./Bill";
import Nocontent from "@/includes/Nocontent";
import AddMoreTile from "@/Components/AddMoreTile";

function Billslist({ IsloggedIn, suppressEmptyState = false }) {
    const { bills } = usePage().props;
    
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

    const showAddMore = IsloggedIn && bills && bills.length > 0;
    
    return (
        <>
            {bills && bills.length ? 
                <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 !gap-3 sm:!gap-3 md:!gap-4`}>
                    {memoizedBills}
                    {showAddMore && (
                        <AddMoreTile
                            title="Add Bill"
                            subtitle="Create a new bill for your supporters."
                            onClick={() => window.dispatchEvent(new Event("toggleAddOptions"))}
                            minHeightClass="min-h-[300px]"
                        />
                    )}
                </div>
                : suppressEmptyState ? null : <Nocontent text='nothing to see' /> 
            }
        </>
    );
}

// Export with memo
export default memo(Billslist, (prevProps, nextProps) => {
    return (
        prevProps.IsloggedIn === nextProps.IsloggedIn &&
        prevProps.suppressEmptyState === nextProps.suppressEmptyState
    );
});
