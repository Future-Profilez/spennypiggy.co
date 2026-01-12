import Membership from './Membership';
import { memo, useMemo } from 'react';
import Nocontent from '@/includes/Nocontent';
import { usePage } from '@inertiajs/react';

function MembershipsLists(props) {
    const {username, IsloggedIn, isUpdated} = props;
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

    return (
        <div className='min-height'>
            {hasNoMemberships ? 
                <Nocontent text="Nothing to see" /> 
                :
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 !gap-2 sm:!gap-3 md:!gap-5'>
                    {memoizedMemberships}
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
        prevProps.isUpdated === nextProps.isUpdated
    );
});
