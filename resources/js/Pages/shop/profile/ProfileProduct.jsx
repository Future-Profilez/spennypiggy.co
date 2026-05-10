import ShopCard from "@/Components/ShopCard";

export default function ProfileProduct({ item, IsloggedIn }) {
    return <ShopCard item={item} IsloggedIn={IsloggedIn} showCreator={false} />;
}
