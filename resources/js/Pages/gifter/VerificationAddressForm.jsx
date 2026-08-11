import { useMemo, useState } from "react";
import axios from "axios";
import { COUNTRIES } from "@/includes/Countries";
import { useAlerts } from "@/Components/Alerts";

/**
 * The billing address a gifter types once, at the £500 verification gate.
 *
 * 🚨 This exists so the admin review has TWO records to compare. Moments after
 * this form, Stripe Checkout collects the address again and `cardVerificationSuccess`
 * stores it as `stripe_address`. Both being typed independently is the entire
 * value of the check — which is why nothing here is ever pre-filled from Stripe,
 * and why the address is asked for BEFORE the redirect rather than derived from it.
 *
 * Asked ONCE. A saved address collapses to a summary; the gifter can still open it,
 * because a rejection may well have been about the address itself and locking it
 * would leave them with a refusal they cannot act on.
 */

const FIELD =
    "w-full min-h-[44px] px-4 py-2.5 rounded-box-sm border-2 border-black bg-white " +
    "text-[15px] text-black placeholder:text-black/40 " +
    "focus:outline-none focus:ring-2 focus:ring-black/20";

const LABEL = "block text-[13px] font-semibold text-black mb-1.5";

function Row({ label, hint, children }) {
    return (
        <div>
            <label className={LABEL}>
                {label}
                {hint ? (
                    <span className="ml-1.5 font-normal text-black/60">{hint}</span>
                ) : null}
            </label>
            {children}
        </div>
    );
}

export default function VerificationAddressForm({ address, onSaved }) {
    const { errorAlert, successAlert } = useAlerts();

    // A gifter with nothing saved lands straight in the form; one who already gave
    // us an address sees what we hold and is not asked to type it again.
    const [editing, setEditing] = useState(!address?.is_complete);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        street_address: address?.street_address || "",
        city: address?.city || "",
        state: address?.state || "",
        postal_code: address?.postal_code || "",
        country: address?.country || "",
    });

    const countries = useMemo(
        () => [...COUNTRIES].sort((a, b) => a.label.localeCompare(b.label)),
        []
    );

    const set = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const countryLabel = (code) =>
        countries.find((c) => c.code === code)?.label || code;

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return; // the disabled re-render loses the double-tap race
        setSaving(true);
        setErrors({});

        try {
            const { data } = await axios.post(
                route("gifter.verification.address"),
                form
            );
            onSaved?.(data.address);
            setEditing(false);
            successAlert("Billing address saved.");
        } catch (err) {
            const res = err.response?.data;
            if (res?.errors) setErrors(res.errors);
            errorAlert(
                res?.error ||
                    "We could not save your address. Please check your connection and try again."
            );
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <div className="mb-5 rounded-box border-2 border-black bg-[#F7F7F7] p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold uppercase tracking-wide text-black/60">
                            Your billing address
                        </p>
                        <p className="mt-1.5 text-[15px] leading-[1.5] text-black">
                            {[
                                form.street_address,
                                form.city,
                                form.state,
                                form.postal_code,
                                countryLabel(form.country),
                            ]
                                .filter(Boolean)
                                .join(", ")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="min-h-[44px] shrink-0 rounded-box-sm border-2 border-black bg-white px-4 text-[14px] font-semibold text-black"
                    >
                        Edit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={submit}
            className="mb-5 rounded-box border-2 border-black bg-[#F7F7F7] p-4 md:p-5"
        >
            <p className="text-[13px] font-semibold uppercase tracking-wide text-black/60">
                Your billing address
            </p>
            <p className="mt-1.5 mb-4 text-[15px] leading-[1.5] text-black/75">
                Use the address your card is registered to. We check it against the
                one your bank has on file.
            </p>

            <div className="grid gap-3.5">
                <Row label="Street address">
                    <input
                        type="text"
                        className={FIELD}
                        value={form.street_address}
                        onChange={set("street_address")}
                        placeholder="12 High Street"
                        autoComplete="address-line1"
                    />
                    {errors.street_address ? (
                        <p className="mt-1 text-[13px] text-red-600">
                            {errors.street_address[0]}
                        </p>
                    ) : null}
                </Row>

                <div className="grid gap-3.5 sm:grid-cols-2">
                    <Row label="City">
                        <input
                            type="text"
                            className={FIELD}
                            value={form.city}
                            onChange={set("city")}
                            autoComplete="address-level2"
                        />
                        {errors.city ? (
                            <p className="mt-1 text-[13px] text-red-600">
                                {errors.city[0]}
                            </p>
                        ) : null}
                    </Row>

                    <Row label="Postcode" hint="(if you have one)">
                        <input
                            type="text"
                            className={FIELD}
                            value={form.postal_code}
                            onChange={set("postal_code")}
                            autoComplete="postal-code"
                        />
                    </Row>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                    <Row label="State / province" hint="(if you have one)">
                        <input
                            type="text"
                            className={FIELD}
                            value={form.state}
                            onChange={set("state")}
                            autoComplete="address-level1"
                        />
                    </Row>

                    <Row label="Country">
                        <select
                            className={`${FIELD} appearance-none`}
                            value={form.country}
                            onChange={set("country")}
                            autoComplete="country"
                        >
                            <option value="">Choose your country</option>
                            {countries.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        {errors.country ? (
                            <p className="mt-1 text-[13px] text-red-600">
                                {errors.country[0]}
                            </p>
                        ) : null}
                    </Row>
                </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                {address?.is_complete ? (
                    <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="min-h-[44px] rounded-box-sm border-2 border-black bg-white px-5 text-[14px] font-semibold text-black"
                    >
                        Cancel
                    </button>
                ) : null}
                <button
                    type="submit"
                    disabled={saving}
                    className="min-h-[44px] rounded-box-sm border-2 border-black bg-black px-6 text-[14px] font-semibold text-white disabled:opacity-60"
                >
                    {saving ? "Saving…" : "Save address"}
                </button>
            </div>
        </form>
    );
}
