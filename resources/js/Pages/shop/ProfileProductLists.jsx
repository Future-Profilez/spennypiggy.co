import ProfileProduct from "./ProfileProduct";
import { useState, memo, useMemo, useCallback, useEffect } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import Nocontent from "@/includes/Nocontent";
import LoadingScreen from "@/includes/LoadingScreen";

function ProfileProductLists({ profileuser }) {
    const {
        global_currency,
        auth,
        user,
        shops: initialShops,
    } = usePage().props;
    const [lists, setLists] = useState(initialShops || []);
    const [loading, setLoading] = useState(false);

    const fetchItems = useCallback(
        (forceRefresh = false) => {
            if (!forceRefresh && initialShops && initialShops.length > 0) {
                setLists(initialShops);
                return;
            }

            setLoading(true);
            axios
                .get(`/shop/list/${profileuser && profileuser.username}`)
                .then((res) => {
                    setLists(res.data.shops);
                    setLoading(false);
                })
                .catch((err) => {
                    setLoading(false);
                });
        },
        [profileuser?.username, initialShops],
    );

    useEffect(() => {
        fetchItems();

        // Listen for custom events
        const handleProductCreated = () => {
            fetchItems(true);
        };

        const handleProductDeleted = () => {
            fetchItems(true);
        };

        window.addEventListener("product:created", handleProductCreated);
        window.addEventListener("product:deleted", handleProductDeleted);

        return () => {
            window.removeEventListener("product:created", handleProductCreated);
            window.removeEventListener("product:deleted", handleProductDeleted);
        };
    }, [fetchItems]);

    const memoizedProducts = useMemo(() => {
        if (!lists || !lists.length) return null;

        return lists.map((item, index) => (
            <ProfileProduct key={`product-${item.id || index}`} item={item} />
        ));
    }, [lists]);

    const hasNoProducts = useMemo(
        () => !loading && (!lists || lists.length < 1),
        [loading, lists],
    );

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {memoizedProducts}
            </div>
            {loading && <LoadingScreen />}
            {hasNoProducts && <Nocontent text="Nothing to see" />}
        </>
    );
}

export default memo(ProfileProductLists, (prevProps, nextProps) => {
    return prevProps.profileuser?.username === nextProps.profileuser?.username;
});
