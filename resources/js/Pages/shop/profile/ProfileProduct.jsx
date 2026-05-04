import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
import AddItem from "../AddItem";

export default function ProfileProduct({ item, IsloggedIn }) {
    const { auth, user } = usePage().props;
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();

    const slug = (inputString) => {
        return inputString
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const url = `/shop/item/${slug(item.name)}/${item.uuid}`;

    const isOwner = auth?.user?.id === item?.user_id;
    const variants = item?.shop_varients || [];
    const basePrice = variants.length ? Math.min(...variants.map(v => parseFloat(v.price || 0))) : parseFloat(item?.price || 0);
    
    // Get baseline shipping price for physical items
    const shippingPrice = item?.type === 'physical' ? (() => {
        const shippingRates = item?.shop_shipping_info || [];
        const baselineRate = shippingRates.find(s => 
            s.country?.toLowerCase() === 'all' || 
            s.country?.toLowerCase() === 'worldwide'
        ) || shippingRates[0];
        return parseFloat(baselineRate?.shipping_price || 0);
    })() : 0;

    const vatPercent = item?.user?.vat_amount_percentage ?? user?.vat_amount_percentage ?? 0;
    const vatAmount = (basePrice * vatPercent) / 100;
    const basePriceWithShippingAndVat = basePrice + vatAmount + shippingPrice;
    const supporterPays = calculateTotalSupporterPays(basePriceWithShippingAndVat, item?.currency || "GBP")?.total_supporter_pays ?? basePriceWithShippingAndVat;
    
    return (
        <article 
            onClick={() => router.visit(url)}
            className="cursor-pointer max-w-sm w-full bg-white border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden flex flex-col justify-between"
        >
            <div className="p-3 md:p-4">
                <div className="relative ">
                    {IsloggedIn && item?.approved === 0 && (
                        <div className="absolute top-2 left-5 right-5 bg-yellow-300 border-2 border-black z-10 text-black text-xs font-black p-2 rounded-lg text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            Waiting for approval
                        </div>
                    )}
                    {isOwner && item?.edited_status == 0 && item?.edited_reason && (
                        <div className="absolute top-12 left-5 right-5 bg-red-100 border-2 border-red-500 z-10 text-red-700 text-xs font-black p-2 rounded-lg text-center shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
                            Admin requested changes: {item.edited_reason}
                        </div>
                    )}
                    <div className="">
                        <div className="block border border-black rounded-[20px] overflow-hidden relative">
                            <img
                                className="object-cover h-[130px] sm:h-[160px] w-full"
                                src={item.perma_link}
                                alt={item.name}
                                onError={(e) => {
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
                        </div>
                    </div>
                </div>

                <div
                    className="flex flex-col gap-1 mt-2 sm:mt-4 mb-3 flex-grow"
                >
                    <div className='flex items-center gap-2'>
                        <h2 className="text-sm line-clamp-1 sm:text-lg font-black text-black uppercase tracking-wide">
                            {item.name}
                        </h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border-2 border-black font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${item.type === 'physical' ? 'bg-blue-300' : 'bg-green-300'}`}>
                            {item.type === 'physical' ? 'Physical' : 'Digital'}
                        </span>
                    </div>
                    <span className="text-[13px] sm:text-normal font-bold text-gray-700 line-clamp-2">
                        {item.description}
                    </span>
                </div>

                <div className=" mb-4 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className="font-black text-lg sm:text-2xl text-black">
                            {variants.length && !isOwner ? 'From ' : ''}
                            {formatMultiPrice(isOwner ? basePrice : supporterPays, item?.currency || "GBP") || "FREE"}
                        </h2>
                        {!isOwner && (
                            <span className="text-[13px] text-gray-500 font-normal mt-1 leading-tight">
                                *Includes platform and payment processing fees{item?.type === 'physical' ? (shippingPrice > 0 ? " and shipping" : ". Free shipping") : ""}
                            </span>
                        )}
                    </div>
                </div>

                {isOwner ? (
                    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <AddItem 
                            classes="font-black cursor-pointer bg-blue-300 border-2 border-black px-4 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 text-black text-sm sm:text-base uppercase"
                            pre_title={item.name} title="Edit Item"
                            pre_description={item.description} 
                            pre_price={item.price} 
                            product_type={item.type}
                            item={item} isEdit={true}
                            IsloggedIn={IsloggedIn}
                        />
                    </div>
                ) : auth?.user ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.visit(url);
                        }}
                        className="font-black cursor-pointer bg-yellow-300 border-2 border-black px-4 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 text-black text-sm sm:text-base uppercase"
                    >
                        Buy Now
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.visit(url);
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
