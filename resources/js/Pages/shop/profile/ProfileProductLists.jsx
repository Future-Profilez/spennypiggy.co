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
            {/* ⚠️ This comment sits ABOVE the ternary deliberately: inside a
                parenthesised branch `{/* … *\/}` is an object literal, not a
                comment, and fails the whole Vite build. */}
            {lists && lists.length ? (
                /* Two columns on a phone, matching the wish and bill grids.
                   ⚠️ Membership is deliberately NOT on this rule (client
                   direction) — its card carries tier art and a perks list, which
                   do not survive a 170px column. */
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
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
                <Nocontent text="Nothing here yet" subheading="This creator hasn't listed anything in the shop." />
            )} 
        </>
    );
}
