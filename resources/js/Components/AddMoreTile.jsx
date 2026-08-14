export default function AddMoreTile({
    title,
    subtitle,
    onClick,
    variant = "tile",
    density = "normal",
    className = "",
    minHeightClass = "min-h-[300px]",
}) {
    if (variant === "bill") {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`group relative billbox wish-item-box transition-colors duration-200 hover:bg-black/[0.03] w-full ${className}`}
            >
                <div className="mb-3 sm:mb-4 bg-white h-full relative !rounded-box !border-[3px] border-black overflow-hidden w-full">
                    <div className="relative !overflow-hidden !bg-white p-3 !pb-0">
                        <div className="relative !rounded-box-sm object-cover border-2 border-black w-full h-[180px] mx-auto bg-gradient-to-br from-white via-pink-50 to-yellow-50 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10" />
                            <div className="relative z-10 w-20 h-12 bg-[#FF007F] rounded-full border-[3px] border-black flex items-center justify-center">
                                <span className="text-black font-black text-3xl mb-1">
                                    +
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="wishlistdetial relative bg-[#fdfbf7] p-4 flex flex-col flex-grow min-h-[250px]">
                        <div>
                            <h4 className="text-xl font-black !text-black text-center el1 uppercase tracking-wide">
                                {title}
                            </h4>
                            <div className="text-center font-black text-2xl text-black mt-1 mb-1 titleprice">
                                Set your price
                            </div>
                        </div>

                        {subtitle ? (
                            <p className="text-xs mt-3 text-center font-bold text-black/80">
                                {subtitle}
                            </p>
                        ) : (
                            <p className="text-xs mt-3 text-center font-bold text-black/80">
                                Create another bill for your supporters.
                            </p>
                        )}

                        <div className="flex justify-center mt-auto mb-2 pt-5">
                            <div className="bg-[#FF007F] border-[3px] border-black text-black font-black uppercase text-[13px] md:text-sm py-2 px-6 rounded-box-sm">
                                Create Bill
                            </div>
                        </div>

                        <div className="flex items-center justify-center mt-3">
                            <span className="text-xs text-black font-black uppercase">
                                by
                            </span>
                            <span className="ml-1 text-xs font-black uppercase text-[#FF007F] underline">
                                you
                            </span>
                        </div>
                    </div>
                </div>
            </button>
        );
    }

    if (variant === "row") {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`group w-full bg-[#fdfbf7] rounded-box border-[3px] border-black transition-colors duration-200 hover:bg-black/[0.03] ${className}`}
            >
                <div className="p-5 md:p-6 lg:flex items-center space-y-4 lg:gap-6">
                    <div className="relative shrink-0">
                        <div className="absolute -inset-2 rounded-full" />
                        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] border-black bg-white flex items-center justify-center transition-colors duration-200 group-hover:bg-black/[0.04]">
                            <span className="text-black font-black text-3xl md:text-4xl mb-1">
                                +
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 text-left">
                        <div className="font-black uppercase tracking-widest text-black text-lg md:text-xl">
                            {title}
                        </div>
                        {subtitle ? (
                            <div className="mt-1 text-sm font-bold text-black/80 max-w-[520px]">
                                {subtitle}
                            </div>
                        ) : null}
                    </div>

                    <div className="shrink-0">
                        <div className="bg-[#FF007F] border-[3px] border-black px-5 py-2 rounded-full font-bold text-black uppercase text-sm">
                            Add New
                        </div>
                    </div>
                </div>
            </button>
        );
    }

    const isCompact = density === "compact";
    const buttonClasses = `group bg-[#fdfbf7] rounded-box border-[3px] border-black overflow-hidden w-full ${minHeightClass} transition-colors duration-200 hover:bg-black/[0.03] ${className}`;

    return (
        <button type="button" onClick={onClick} className={buttonClasses}>
            <div
                className={`h-full flex flex-col items-center justify-center text-center ${
                    isCompact ? "p-4 gap-2" : "p-6 gap-3"
                }`}
            >
                <div className="relative">
                    <div className="absolute -inset-2 rounded-full" />
                    <div
                        className={`relative rounded-full border-[3px] border-black bg-white flex items-center justify-center transition-colors duration-200 group-hover:bg-black/[0.04] ${
                            isCompact ? "w-16 h-16" : "w-20 h-20"
                        }`}
                    >
                        <span
                            className={`text-black font-black mb-1 ${
                                isCompact ? "text-3xl" : "text-4xl"
                            }`}
                        >
                            +
                        </span>
                    </div>
                </div>

                <div
                    className={`font-black uppercase tracking-widest text-black ${
                        isCompact ? "text-base" : "text-lg"
                    }`}
                >
                    {title}
                </div>
                {subtitle ? (
                    <div
                        className={`font-bold text-black/80 max-w-[260px] ${
                            isCompact ? "text-xs" : "text-sm"
                        }`}
                    >
                        {subtitle}
                    </div>
                ) : null}

                <div
                    className={`bg-[#FF007F] border-[3px] border-black rounded-full text-black font-bold uppercase ${
                        isCompact
                            ? "mt-2 px-5 py-2 text-xs"
                            : "mt-2 px-6 py-2 text-sm"
                    }`}
                >
                    Add New
                </div>
            </div>
        </button>
    );
}
