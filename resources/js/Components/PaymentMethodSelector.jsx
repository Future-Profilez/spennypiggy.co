import { useEffect, useRef, useState } from "react";
import axios from "axios";

// Hoisted so it isn't re-created (and remounted) on every parent render.
function Radio({ checked }) {
    return (
        <span
            aria-hidden="true"
            className="shrink-0 w-[22px] h-[22px] rounded-full border-[3px] border-black bg-white flex items-center justify-center"
        >
            <span
                className={`w-[10px] h-[10px] rounded-full bg-[#FF007F] transition-transform duration-150 motion-reduce:transition-none ${
                    checked ? "scale-100" : "scale-0"
                }`}
            />
        </span>
    );
}

/**
 * Card vs Bank payment method selector with method-aware supporter prices.
 *
 * Fetches /payments/price-preview (single source of truth — the same pricing
 * engine the checkout charges with) and renders both prices so the supporter
 * sees the bank saving. Renders nothing when bank payments are disabled or
 * unavailable for the currency, so parents can drop it in unconditionally.
 *
 * Props:
 *  - amount        listed price (creator currency, major units)
 *  - currency      item/creator currency ISO (e.g. "GBP")
 *  - chargeCurrency optional charge currency if different
 *  - symbol        optional currency symbol for display (falls back to ISO)
 *  - email         optional buyer email (guest risk checks)
 *  - value         'card' | 'bank' (controlled)
 *  - onChange      (method) => void
 */
export default function PaymentMethodSelector({
    amount,
    currency,
    chargeCurrency = null,
    symbol = null,
    email = null,
    value = "card",
    onChange,
    onPrices = null,
    className = "",
}) {
    const [preview, setPreview] = useState(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!amount || Number(amount) <= 0 || !currency) {
            setPreview(null);
            onPrices?.(null);
            return;
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            axios
                .post("/payments/price-preview", {
                    amount: Number(amount),
                    currency,
                    charge_currency: chargeCurrency || undefined,
                    email: email || undefined,
                })
                .then((res) => {
                    if (res.data?.status) {
                        setPreview(res.data);
                        onPrices?.(res.data.prices);
                    } else {
                        setPreview(null);
                        onPrices?.(null);
                    }
                })
                .catch(() => {
                    // Clear the parent's prices too — otherwise it keeps showing a
                    // stale bank total from the previous amount/quantity.
                    setPreview(null);
                    onPrices?.(null);
                });
        }, 350);

        return () => clearTimeout(debounceRef.current);
    }, [amount, currency, chargeCurrency, email]);

    const cardDisabled = preview ? !preview.rules?.card_allowed : false;

    // Keep the parent's selection valid if card becomes unavailable.
    useEffect(() => {
        if (cardDisabled && value === "card") {
            onChange?.("bank");
        }
    }, [cardDisabled, value]);

    if (!preview || !preview.bank_enabled || preview.prices?.bank == null) {
        return null;
    }

    const { prices, rules } = preview;
    const cur = symbol || `${preview.charge_currency} `;
    const fmt = (v) =>
        `${cur}${Number(v).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    return (
        <div
            role="radiogroup"
            aria-label="How you pay"
            className={`select-none ${className}`}
        >
            <p className="font-black uppercase tracking-widest text-[11px] mb-2 text-black/80">
                How you pay
            </p>

            <div className="space-y-3">
                {/* ---- Bank option ---- */}
                <button
                    type="button"
                    role="radio"
                    aria-checked={value === "bank"}
                    onClick={() => onChange?.("bank")}
                    className={`relative w-full text-left border-[3px] border-black rounded-box-sm px-4 py-3.5 transition-[transform,box-shadow,background-color] duration-150 motion-reduce:transition-none focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 ${
                        value === "bank"
                            ? "bg-[#A2E4B8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]"
                            : "bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] motion-reduce:hover:translate-y-0"
                    }`}
                >
                    {/* Signature: tilted save sticker */}
                    {prices.saving > 0 && (
                        <span className="absolute -top-3 right-3 rotate-[-4deg] bg-[#FF007F] text-white border-[3px] border-black rounded-box-sm px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
                            Save {fmt(prices.saving)}
                        </span>
                    )}

                    <span className="flex items-center gap-3">
                        <Radio checked={value === "bank"} />
                        <span className="flex-1 min-w-0">
                            <span className="block font-black uppercase tracking-wide text-sm leading-tight">
                                Pay by bank
                            </span>
                            <span className="block text-[11px] font-bold text-black/60 mt-0.5">
                                {rules.bank_recommended
                                    ? "Lower fees · higher limits"
                                    : "Approve in your banking app"}
                            </span>
                            {preview.delayed_settlement && (
                                <span className="block text-[11px] font-bold text-black/60 mt-0.5">
                                    Content unlocks once your bank confirms —
                                    usually 1–2 days
                                </span>
                            )}
                        </span>
                        <span className="text-right">
                            <span className="block font-black text-lg leading-none">
                                {fmt(prices.bank)}
                            </span>
                            {prices.saving > 0 && (
                                <span className="block text-[11px] font-bold text-black/60 line-through mt-1">
                                    {fmt(prices.card)}
                                </span>
                            )}
                        </span>
                    </span>
                </button>

                {/* ---- Card option ---- */}
                <button
                    type="button"
                    role="radio"
                    aria-checked={value === "card"}
                    onClick={() => !cardDisabled && onChange?.("card")}
                    disabled={cardDisabled}
                    className={`w-full text-left border-[3px] border-black rounded-box-sm px-4 py-3.5 transition-[transform,box-shadow,background-color] duration-150 motion-reduce:transition-none focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 ${
                        cardDisabled
                            ? "bg-gray-100 border-black/30 cursor-not-allowed"
                            : value === "card"
                            ? "bg-[#A2E4B8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]"
                            : "bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] motion-reduce:hover:translate-y-0"
                    }`}
                >
                    <span className={`flex items-center gap-3 ${cardDisabled ? "opacity-50" : ""}`}>
                        <Radio checked={value === "card" && !cardDisabled} />
                        <span className="flex-1 min-w-0">
                            <span className="block font-black uppercase tracking-wide text-sm leading-tight">
                                Card · Apple Pay
                            </span>
                            <span className="block text-[11px] font-bold text-black/60 mt-0.5">
                                {cardDisabled
                                    ? "Not available for this purchase — use Pay by bank"
                                    : rules.force_3ds
                                    ? "Includes a quick bank verification step"
                                    : "Debit & credit cards, Apple Pay, Google Pay"}
                            </span>
                        </span>
                        <span className="font-black text-lg leading-none">
                            {fmt(prices.card)}
                        </span>
                    </span>
                </button>
            </div>
        </div>
    );
}
