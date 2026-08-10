import { useState } from 'react';
import Popup from '@/Components/Popup';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import RiskMessage from '@/Components/Risk/RiskMessage';

/**
 * The one-time code step, as a self-contained modal.
 *
 * 🚨 A checkout that can receive STEP_UP and cannot render this is a DEAD END:
 * the supporter is told the payment failed, the code they were emailed has
 * nowhere to go, and the sale is lost. That is exactly what Piggy Pot had —
 * its risk enforcement was broken, so STEP_UP was unreachable and nobody
 * noticed the widget had no modal. Fixing the enforcement made it reachable.
 *
 * ⚠️ ANY checkout wired to `RiskEnforcement` must render this. The trait
 * answers with `step_up_required: true` plus `ui` and `step_up_context` — note
 * it is `step_up_required`, NOT `step_up`; a screen checking the latter silently
 * never opens.
 *
 * Seven other checkout screens each carry their own copy of this flow. This is
 * the shared version; migrate them onto it rather than writing a ninth.
 */
export default function StepUpModal({
    open,
    ui,
    context,
    fallbackEmail,
    fallbackDeviceId,
    onVerified,
    onClose,
}) {
    const { errorAlert, successAlert } = useAlerts();
    const [otp, setOtp] = useState('');
    const [typedConfirmation, setTypedConfirmation] = useState('');
    const [verifying, setVerifying] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (verifying) return;

        setVerifying(true);
        try {
            const payload = {
                otp,
                typed_confirmation: typedConfirmation,
                amount: context?.amount,
                currency: context?.currency,
                creator_id: context?.creator_id,
                // The context's email is the one the code was actually sent to.
                email: context?.email || fallbackEmail,
                device_id: context?.device_id || fallbackDeviceId,
                is_checkout_session: true,
            };
            if (context?.risk_identity_id) {
                payload.risk_identity_id = context.risk_identity_id;
            }

            const res = await axios.post('/api/risk/step-up/verify', payload);

            if (res.data?.success) {
                successAlert('Verified — carrying on with your payment.');
                setOtp('');
                setTypedConfirmation('');
                onVerified?.();
                return;
            }

            // The server's own wording: it distinguishes a wrong code from an
            // expired one from too many tries, and each has a different fix.
            errorAlert(res.data?.error || 'That code did not go through. Try another one.');
        } catch (err) {
            errorAlert(
                err?.response?.data?.error ||
                    'That code did not go through. Try another one.',
            );
        } finally {
            setVerifying(false);
        }
    };

    const resend = async () => {
        try {
            const payload = {
                amount: context?.amount,
                currency: context?.currency,
                creator_id: context?.creator_id,
                email: context?.email || fallbackEmail,
                device_id: context?.device_id || fallbackDeviceId,
            };
            if (context?.risk_identity_id) {
                payload.risk_identity_id = context.risk_identity_id;
            }
            await axios.post('/api/risk/step-up/resend', payload);
            successAlert('Sent — check your inbox, and your spam folder.');
        } catch (err) {
            errorAlert(
                err?.response?.data?.error ||
                    "We couldn't send that one. Give it another go in a moment.",
            );
        }
    };

    if (!open) return null;

    // ⚠️ Popup's `action` IS the open flag, and closing is vetoed/handled by its
    // own control via `onHide` — there is no `close` prop. Passing one is a
    // silent no-op, which on this modal would leave someone with a code they
    // cannot escape.
    return (
        <Popup size="sm" action={open} onHide={onClose}>
            <div className="p-5 sm:p-6">
                {/* The server's copy, so the reassurance ("this isn't a
                    rejection") is identical wherever step-up appears. */}
                <RiskMessage message={ui} />

                <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                        <label htmlFor="stepup-otp" className="block text-[15px] font-semibold text-black">
                            Your code
                        </label>
                        <input
                            id="stepup-otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            className="mt-2 w-full min-h-[48px] rounded-box-sm border-2 border-black px-4 text-[16px] tracking-[0.3em]"
                            placeholder="------"
                        />
                    </div>

                    <div>
                        <label htmlFor="stepup-confirm" className="block text-[15px] font-semibold text-black">
                            Type <span className="font-bold">CONFIRM</span> to continue
                        </label>
                        <input
                            id="stepup-confirm"
                            value={typedConfirmation}
                            onChange={(e) => setTypedConfirmation(e.target.value)}
                            className="mt-2 w-full min-h-[48px] rounded-box-sm border-2 border-black px-4 text-[16px]"
                            placeholder="CONFIRM"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                        <button
                            type="submit"
                            disabled={verifying || !otp || !typedConfirmation}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-box-sm bg-[#FF007F] px-6 text-[15px] font-semibold text-white disabled:opacity-50"
                        >
                            {verifying ? 'Processing…' : 'Confirm payment'}
                        </button>
                        <button
                            type="button"
                            onClick={resend}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-2 border-black bg-white px-6 text-[15px] font-semibold text-black"
                        >
                            Resend code
                        </button>
                    </div>
                </form>
            </div>
        </Popup>
    );
}
