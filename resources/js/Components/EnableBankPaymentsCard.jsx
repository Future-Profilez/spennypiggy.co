import { useEffect, useState, useCallback } from "react";
import axios from "axios";

/**
 * Creator self-service card: shows only when the creator's connected account
 * is missing an eligible bank payment capability, and lets them request it
 * with one tap — no support ticket, no artisan command.
 *
 * States from /payments/bank-status:
 *   not_connected | unsupported_region | active | needs_enable | error
 * The card renders ONLY for needs_enable (and a success flash after enabling).
 */
const LABELS = {
    pay_by_bank_payments: "Pay by Bank (UK/EU)",
    sepa_debit_payments: "SEPA Direct Debit",
    us_bank_account_ach_payments: "ACH bank debit (US)",
};

export default function EnableBankPaymentsCard() {
    const [status, setStatus] = useState(null);
    const [enabling, setEnabling] = useState(false);
    const [justEnabled, setJustEnabled] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        axios
            .get("/payments/bank-status")
            .then((resp) => {
                if (!cancelled) setStatus(resp.data);
            })
            .catch(() => {
                /* card simply doesn't render — never block the dashboard */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const enable = useCallback(() => {
        if (enabling) return;
        setEnabling(true);
        setError(null);
        axios
            .post("/payments/enable-bank")
            .then((resp) => {
                setStatus(resp.data);
                if (resp.data?.state === "active") setJustEnabled(true);
            })
            .catch((err) => {
                setError(
                    err?.response?.data?.message ||
                        "Could not enable bank payments — please try again.",
                );
            })
            .finally(() => setEnabling(false));
    }, [enabling]);

    if (justEnabled) {
        return (
            <div className="rounded-box border-[3px] border-black bg-[#A2E4B8] p-4 md:p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <p className="font-black uppercase tracking-widest text-sm">
                    Bank payments enabled ✓
                </p>
                <p className="text-sm mt-1">
                    Supporters can now pay you straight from their bank at a
                    lower fee.
                </p>
            </div>
        );
    }

    if (!status || status.state !== "needs_enable") return null;

    return (
        <div className="rounded-box border-[3px] border-black bg-white p-4 md:p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex-1">
                    <p className="font-black uppercase tracking-widest text-sm">
                        Accept bank payments 🏦
                    </p>
                    <p className="text-sm mt-1 text-gray-700">
                        Let supporters pay you straight from their bank —
                        cheaper for them, same payout for you. One tap to
                        switch on{" "}
                        {(status.missing || [])
                            .map((c) => LABELS[c] || c)
                            .join(", ")}
                        .
                    </p>
                    {error && (
                        <p className="text-sm mt-2 text-red-600 font-semibold">
                            {error}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={enable}
                    disabled={enabling}
                    className="rounded-box-sm min-h-[44px] px-6 py-3 bg-[#FF007F] text-white font-black uppercase tracking-widest text-sm border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 transition-all"
                >
                    {enabling ? "Enabling…" : "Enable now"}
                </button>
            </div>
        </div>
    );
}
