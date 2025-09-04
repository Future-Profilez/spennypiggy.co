import ProfileProduct from './ProfileProduct'
import { useState, memo, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';
import LoadingScreen from '@/includes/LoadingScreen';

function ProfileProductLists({profileuser}) {
    const { global_currency, auth, user, shops } = usePage().props;
    const [lists, setLists] = useState(shops || []);
    const [loading, setLoading] = useState(false);

    const fetchItems = useCallback(() => {
        // If we already have shops from props, don't make additional API call
        if (shops && shops.length > 0) {
            setLists(shops);
            return;
        }
        
        setLoading(true);
        axios.get(`/shop/list/${profileuser && profileuser.username}`)
        .then(res => {
            setLists(res.data.shops);
            setLoading(false);
        }).catch(err => {
            setLoading(false);
        });
    }, [profileuser?.username, shops]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);
    
    // Memoize the product list to prevent unnecessary re-renders
    const memoizedProducts = useMemo(() => {
        if (!lists || !lists.length) return null;
        
        return lists.map((item, index) => (
            <ProfileProduct 
                key={`product-${item.id || index}`} 
                item={item} 
            />
        ));
    }, [lists]);
    
    const hasNoProducts = useMemo(() => 
        !loading && (!lists || lists.length < 1), 
        [loading, lists]
    );

    return (
        <>
            <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                {memoizedProducts}
            </div>
            {loading && <LoadingScreen />}
            {hasNoProducts && <Nocontent text="Nothing to see" />}
        </>
    );
}

// Export with memo
export default memo(ProfileProductLists, (prevProps, nextProps) => {
    return prevProps.profileuser?.username === nextProps.profileuser?.username;
});
