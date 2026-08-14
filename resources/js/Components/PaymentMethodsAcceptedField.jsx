/**
 * Creator-side per-listing payment method preference (card / bank / both).
 * Client spec July 2026: creators control which methods each item accepts;
 * bank payments lower the supporter price while the creator payout is
 * unchanged — the copy below sells that benefit.
 */
export default function PaymentMethodsAcceptedField({ value = "both", onChange, className = "" }) {
    const options = [
        { key: "both", label: "Card + Bank", hint: "Recommended — supporters choose" },
        { key: "bank", label: "Bank only", hint: "Lowest price for supporters" },
        { key: "card", label: "Card only", hint: "Cards, Apple Pay, Google Pay" },
    ];

    return (
        <div className={className}>
            <p className="font-black uppercase tracking-widest text-xs mb-1">
                Payment methods for this item
            </p>
 <p className="text-[12px] font-bold text-black/60 mb-2">
                Accept Bank Payments and your supporters pay less while you
                still receive the same payout.
            </p>
            <div className="grid grid-cols-3 gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.key}
                        type="button"
                        onClick={() => onChange?.(opt.key)}
 className={`border-[3px] border-black rounded-box-sm p-2 text-left transition-all ${
                            value === opt.key
 ? "bg-[#A2E4B8] "
 : "bg-white "
                        }`}
                    >
 <span className="block font-black uppercase text-[12px]">
                            {opt.label}
                        </span>
 <span className="block text-[12px] font-bold text-black/60 mt-0.5">
                            {opt.hint}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
