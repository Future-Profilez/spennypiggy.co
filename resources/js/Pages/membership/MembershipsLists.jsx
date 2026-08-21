import Membership from './Membership';
import { memo, useMemo } from 'react';
import Nocontent from '@/includes/Nocontent';
import { usePage } from '@inertiajs/react';
import AddMoreTile from '@/Components/AddMoreTile';

function MembershipsLists(props) {
    const { username, IsloggedIn, isUpdated, suppressEmptyState = false } = props;
    const { memberships } = usePage().props;
    
    // Memoize the memberships list to prevent unnecessary re-renders
    const memoizedMemberships = useMemo(() => {
        if (!memberships || !memberships.length) return null;
        
        return memberships.map((m, i) => (
            <div key={`membership-${m.id || i}`} className=" ">
                <Membership IsloggedIn={IsloggedIn} item={m} />
            </div>
        ));
    }, [memberships, IsloggedIn]);

    const hasNoMemberships = useMemo(() => 
        !memberships || memberships.length < 1, 
        [memberships]
    );

    if (hasNoMemberships && suppressEmptyState) return null;

    return (
        <div className='min-height'>
            {hasNoMemberships ? (
                suppressEmptyState ? null : <Nocontent text="Nothing here yet" subheading="This creator has no membership tiers on sale." />
            ) : 
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 !gap-2 sm:!gap-3 md:!gap-5'>
                    {memoizedMemberships}
                    {IsloggedIn && (
                        <AddMoreTile title="Add Membership" subtitle="Create another tier for your supporters." onClick={() => window.dispatchEvent(new Event("toggleAddOptions"))} minHeightClass="min-h-[300px]" />
                    )}
                </div>
            }
        </div>
    );
}

// Export with memo
export default memo(MembershipsLists, (prevProps, nextProps) => {
    return (
        prevProps.username === nextProps.username &&
        prevProps.IsloggedIn === nextProps.IsloggedIn &&
        prevProps.isUpdated === nextProps.isUpdated &&
        prevProps.suppressEmptyState === nextProps.suppressEmptyState
    );
});
