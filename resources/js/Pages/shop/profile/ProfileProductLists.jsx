import ProfileProduct from "./ProfileProduct";
import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Nocontent from "@/includes/Nocontent";
import AddMoreTile from "@/Components/AddMoreTile";
export default function ProfileProductLists({ IsloggedIn, suppressEmptyState = false }) {
    const { shops } = usePage().props;
    const [lists, setLists] = useState(shops || []);

    useEffect(() => {
        setLists(shops || []);
    }, [shops]);

    useEffect(() => {
        const onChanged = () => {
            router.reload({ only: ["shops"], preserveScroll: true });
        };
        window.addEventListener("shop:item-changed", onChanged);
        return () => window.removeEventListener("shop:item-changed", onChanged);
    }, []);

    return (
        <>
            {lists && lists.length ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {lists.map((item, index) => (
                        <ProfileProduct
                            IsloggedIn={IsloggedIn}
                            key={index}
                            item={item}
                        />
                    ))}
                    {IsloggedIn && (
                        <AddMoreTile
                            title="Add Item"
                            subtitle="Create another product for your shop."
                            onClick={() => window.dispatchEvent(new Event("toggleAddOptions"))}
                            minHeightClass="min-h-[300px]"
                        />
                    )}
                </div>
            ) : suppressEmptyState ? null : (
                <Nocontent text="Nothing to see" />
            )} 
        </>
    );
}
