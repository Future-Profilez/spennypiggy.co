import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
export default function ProfileProduct({ item, IsloggedIn }) {
    const { auth, rates } = usePage().props;
    const { formatMultiPrice } = PriceFormat();
    const { successAlert, errorAlert } = useAlerts();

    const slug = (inputString) => {
        return inputString
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const url = `/shop/item/${slug(item.name)}/${item.uuid}`;

    const convertUsdToGbp = (usdAmount) => {
        const usdRate = rates["USD"] || 1;
        const gbpRate = rates["GBP"] || 1;
        return (usdAmount * gbpRate) / usdRate;
    };

    const gotologin = () => {
        errorAlert("Larger payments more than £50 need you to log in.");
        router.visit(
            `/login?redirect=${url}&message=Larger payments more than £50 need to login.`
        );
    };

    const itemPriceGbp = convertUsdToGbp(item.price);

    return (
        <article className="max-w-sm w-full bg-white rounded-[22px] overflow-hidden">
            <div className="relative">
                {IsloggedIn && item?.approved === 0 && (
                    <div className="approvalmessge membership m-3 rounded-3 p-3 py-2 mb-2">
                        Shop item waiting for approval. Currently only you can
                        see this.
                    </div>
                )}
                <Link href={url}>
                    <img
                        className="object-cover h-[130px] sm:h-[200px] w-full"
                        src={item.perma_link}
                        alt={item.name}
                        onError={(e) => {
                            console.warn('Shop item image failed to load:', item.perma_link);
                            e.target.style.backgroundColor = '#f3f4f6';
                            e.target.style.display = 'flex';
                            e.target.style.alignItems = 'center';
                            e.target.style.justifyContent = 'center';
                            e.target.style.fontSize = '2rem';
                            e.target.innerHTML = '🛍️';
                        }}
                    />
                    {item.ai_generated == 1 && (
                        <div className="absolute bottom-2 left-2 z-1 bg-black shadow-sm rounded-xl px-2 py-1 text-[8px] text-white">
                            MADE WITH AI
                        </div>
                    )}
                </Link>
            </div>

            <Link
                href={url}
                className="flex flex-col gap-1 mt-2 sm:mt-4 px-3 sm:px-4"
            >
                <h2 className="text-sm line-clamp-1 sm:text-lg font-semibold text-black">
                    {item.name}
                </h2>
                <span className="text-[13px] sm:text-normal font-normal text-gray-600 line-clamp-2">
                    {item.description}
                </span>
            </Link>

            <div className="mt-2 sm:mt-4 p-3 sm:p-4 border-t flex justify-between border-gray-200">
                <h2 className="font-bold text-sm sm:text-xl">
                    {formatMultiPrice(item.price, item?.currency || "GBP") ||
                        "FREE"}
                </h2>

                {auth?.user ? (
                    <Link
                        href={url}
                        className="font-bold cursor-pointer hover:underline text-black text-sm sm:text-lg"
                    >
                        Buy Now
                    </Link>
                ) : (
                    <button
                        onClick={() => {
                            // if (itemPriceGbp > 50) {
                            //     gotologin();
                            // } else {
                            router.visit(url);
                            // }
                        }}
                        className="font-bold cursor-pointer hover:underline text-black text-sm sm:text-lg bg-transparent border-none"
                    >
                        Buy Now
                    </button>
                )}
            </div>
        </article>
    );
}
