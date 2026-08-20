import ShopCard from "@/Components/ShopCard";

export default function ProfileProduct({ item, discoverySource }) {
    // `discoverySource` is set only by Discover's result grid; a creator's own
    // shop page passes nothing, so their traffic stays theirs.
    return (
        <ShopCard
            item={item}
            showCreator={true}
            discoverySource={discoverySource}
        />
    );
}
