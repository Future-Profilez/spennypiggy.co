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
        router.visit(`/login?redirect=${url}&message=Larger payments more than £50 need to login.`);
    };

    const itemPriceGbp = convertUsdToGbp(item.price);

    return (
        <article className="max-w-sm w-full bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden flex flex-col justify-between">
            <div className="relative border-b-[3px] border-black">
                {IsloggedIn && item?.approved === 0 && (
                    <div className="absolute top-2 left-2 right-2 bg-yellow-300 border-2 border-black z-10 text-black text-xs font-black p-2 rounded-lg text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        Waiting for approval
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
                        <div className="absolute bottom-2 left-2 z-1 bg-pink-400 border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg px-2 py-1 text-[10px] text-black">
                            MADE WITH AI
                        </div>
                    )}
                </Link>
            </div>

            <Link
                href={url}
                className="flex flex-col gap-1 mt-2 sm:mt-4 px-3 sm:px-4 flex-grow"
            >
                <h2 className="text-sm line-clamp-1 sm:text-lg font-black text-black uppercase tracking-wide">
                    {item.name}
                </h2>
                <span className="text-[13px] sm:text-normal font-bold text-gray-700 line-clamp-2">
                    {item.description}
                </span>
            </Link>

            <div className="mt-2 sm:mt-4 p-3 sm:p-4 border-t-[3px] flex items-center justify-between border-black bg-gray-50">
                <h2 className="font-black text-lg sm:text-2xl text-black">
                    {formatMultiPrice(item.price, item?.currency || "GBP") ||
                        "FREE"}
                </h2>

                {auth?.user ? (
                    <Link
                        href={url}
                        className="font-black cursor-pointer bg-yellow-300 border-2 border-black px-4 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 text-black text-sm sm:text-base uppercase"
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
                        className="font-black cursor-pointer bg-yellow-300 border-2 border-black px-4 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 text-black text-sm sm:text-base uppercase"
                    >
                        Buy Now
                    </button>
                )}
            </div>
        </article>
    );
}
