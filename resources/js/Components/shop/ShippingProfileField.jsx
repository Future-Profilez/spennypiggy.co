import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAlerts } from "@/Components/Alerts";

/**
 * Reusable shipping rates, on the shop form.
 *
 * 🚨 THIS IS WHY `shipping_profiles` HAD 0 ROWS. The table, both models, the three
 * routes (`shop.shipping-profiles`, `.save`, `.delete`), the ownership checks and the
 * whole checkout read path all shipped and work — `ShopsController::shippingPrice()`
 * prefers a profile's zones and only falls back to per-item `ShopShippingInfo` when
 * there is none. But `AddItem.jsx` sent **`shipping_profile_id: null` as a hardcoded
 * literal** on every save, so the fallback was the only branch that could ever run and
 * a creator retyped the same two rates on every physical item they listed. Nothing
 * errored; the feature was simply unreachable.
 *
 * ⚠️ ZONE KEYS DIFFER BETWEEN THE TWO PATHS. The per-item payload uses
 * `{country, price}`; `saveShippingProfile` validates `zones.*.shipping_price`. Sending
 * `price` here fails validation with a message about a field the creator never saw.
 *
 * ⚠️ "Domestic" is the CREATOR's country (`auth.user.country_code`, GB when unset),
 * matching how `AddItem` builds its own rows — a profile written with a different
 * notion of domestic would price the same parcel two ways depending on which path
 * produced it.
 */
export default function ShippingProfileField({
    value = null,
    onChange,
    domestic = "",
    worldwide = "",
    currency = "£",
    countryCode = "GB",
    className = "",
}) {
    const { successAlert, errorAlert } = useAlerts();

    const [profiles, setProfiles] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        if (!window.axios) return;

        window.axios
            .get(route("shop.shipping-profiles"))
            .then((r) => setProfiles(r.data?.profiles || []))
            .catch(() => setProfiles([]))
            .finally(() => setLoaded(true));
    }, []);

    useEffect(load, [load]);

    const selected = profiles.find((p) => Number(p.id) === Number(value)) || null;

    const hasRates = String(domestic).trim() !== "" || String(worldwide).trim() !== "";

    const saveAsProfile = () => {
        if (busy) return;

        if (!name.trim()) {
            errorAlert("Give the rates a name so you can pick them again.");

            return;
        }

        const zones = [];

        if (String(domestic).trim() !== "" && Number(domestic) >= 0) {
            zones.push({ country: countryCode || "GB", shipping_price: Number(domestic) });
        }

        if (String(worldwide).trim() !== "" && Number(worldwide) >= 0) {
            zones.push({ country: "all", shipping_price: Number(worldwide) });
        }

        if (zones.length === 0) {
            errorAlert("Add a domestic or worldwide rate first.");

            return;
        }

        setBusy(true);
        window.axios
            .post(route("shop.shipping-profile.save"), { name: name.trim(), zones })
            .then((r) => {
                if (!r.data?.status) {
                    errorAlert(r.data?.message || "Could not save those rates.");

                    return;
                }

                setName("");
                load();
                // Switch to what they just made — otherwise they save it and the
                // item still carries its own copy, which is the thing being fixed.
                onChange?.(r.data.profile?.id ?? null);
                successAlert("Saved. You can pick these rates on your next item.");
            })
            .catch(() => errorAlert("Could not save those rates."))
            .finally(() => setBusy(false));
    };

    const remove = (profile) => {
        if (busy) return;

        setBusy(true);
        window.axios
            .delete(route("shop.shipping-profile.delete", { id: profile.id }))
            .then(() => {
                // ⚠️ Deselect FIRST. The item would otherwise keep pointing at a
                // profile that no longer exists, and `shippingPrice()` would find no
                // zones and quietly charge 0 for postage.
                if (Number(value) === Number(profile.id)) onChange?.(null);
                load();
                successAlert("Shipping rates deleted.");
            })
            .catch(() => errorAlert("Could not delete those rates."))
            .finally(() => setBusy(false));
    };

    // Nothing saved and nothing typed yet: stay out of the way rather than showing an
    // empty control on a form that is already three steps long.
    if (loaded && profiles.length === 0 && !hasRates) return null;

    return (
        <div className={`space-y-3 ${className}`}>
            {profiles.length > 0 && (
                <div className="space-y-1.5">
                    <label
                        htmlFor="shipping-profile"
                        className="ml-1 text-xs font-black uppercase tracking-widest text-gray-600"
                    >
                        Saved rates
                    </label>
                    <select
                        id="shipping-profile"
                        value={value ?? ""}
                        onChange={(e) => onChange?.(e.target.value === "" ? null : Number(e.target.value))}
                        className="w-full rounded-box-sm border-[3px] border-black bg-gray-100 p-4 font-black focus:bg-white focus:ring-0"
                    >
                        <option value="">Set rates for this item</option>
                        {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selected && (
                <div className="rounded-box-sm border-2 border-black bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[13px] font-black uppercase tracking-wide text-black">
                                {selected.name}
                            </div>
                            <ul className="mt-1 space-y-0.5">
                                {(selected.zones || []).map((z) => (
                                    <li key={z.id} className="text-[13px] font-bold text-black/60">
                                        {z.country === "all" ? "Worldwide" : z.country} — {currency}
                                        {Number(z.shipping_price).toFixed(2)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            type="button"
                            onClick={() => remove(selected)}
                            disabled={busy}
                            aria-label={`Delete ${selected.name}`}
                            className="shrink-0 rounded-box-xs border-2 border-black bg-white p-2 transition-colors duration-200 hover:bg-black/[0.04] disabled:opacity-50"
                        >
                            <Trash2 size={15} strokeWidth={2.2} />
                        </button>
                    </div>
                </div>
            )}

            {/* Offered only while they are typing their own rates — saving a copy of a
                profile that is already selected would just make a second one. */}
            {!value && hasRates && (
                <div className="rounded-box-sm border-2 border-dashed border-black/30 p-3">
                    <div className="text-[13px] font-bold text-black/60">
                        Use these rates again on your next item?
                    </div>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.slice(0, 255))}
                            placeholder="Name them, e.g. Small parcel"
                            aria-label="Name for these shipping rates"
                            className="min-w-0 flex-1 rounded-box-sm border-2 border-black bg-white p-3 text-[14px] font-bold placeholder:text-black/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40"
                        />
                        <button
                            type="button"
                            onClick={saveAsProfile}
                            disabled={busy}
                            className="shrink-0 rounded-box-sm border-2 border-black bg-[#E6EA7B] px-4 py-3 text-[13px] font-black uppercase tracking-wide text-black transition-colors duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-50"
                        >
                            {busy ? "Saving…" : "Save rates"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
