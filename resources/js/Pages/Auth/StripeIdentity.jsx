import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { Head, Link } from "@inertiajs/react";
import {
    parseIdentityError,
    isFraudFlagged,
    isIdentityPending,
} from "@/utils/identityError";

export default function StripeIdentity({ auth }) {

    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert } = useAlerts();
    // identity_status: 0 = not verified / failed · 1 = verified · 2 = submitted,
    // waiting on Stripe · 3 = flagged by the security review. This page used to
    // read 2 as "rejected", a value the backend never wrote, so a rejected
    // creator saw a plain "Verify now" with no reason at all.
    const identityStatus = Number(auth?.user?.identity_status);
    const failure = parseIdentityError(auth?.user?.identity_verification_error);
    const isVerified = identityStatus === 1;
    const isPending = isIdentityPending(identityStatus);
    const isFlagged = isFraudFlagged(failure, identityStatus);
    const hasFailed = !isVerified && !isPending && !!failure;

    // Handle identity verification
    const handleVerification = async () => {
        setLoading(true);
        try {
            const { data: response } = await axios.post(route("stripe.identity.verify"));
            if (response.url) {
                window.location.href = response.url;
                successAlert("Redirecting to Stripe for identity verification...");
            } else {
                errorAlert("Unexpected response from the server. Please try again later.");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Unable to connect to the server. Please check your network and try again.";
            errorAlert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Authenticated auth={auth?.user || ""} user={auth?.user || ""}>
            <Head title="Identity Verification" />
            <div className="min-h-[90dvh] bg-[#A2E4B8] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-gulfs text-black uppercase tracking-wider mb-2">
                            Identity{" "}
                            <span className="text-gradient-wishlist">
                                Verification
                            </span>
                        </h2>
                        <p className="text-gray-800 text-lg font-medium max-w-2xl mx-auto">
                            Complete Stripe identity verification to unlock creator features and payments.
                        </p>
                    </div>

                    <div className="max-w-xl m-auto bg-white rounded-box border-black overflow-hidden">
                        <div className="!border-r-0 !border-l-0 !border-t-0 border-b border-black flex items-center p-4 space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>

                        <div className="p-6 sm:p-8">
                            {isVerified && (
                                <div className="mb-4 text-green-800 bg-green-50 p-4 rounded-box-sm border border-green-200">
                                    <p className="font-bold mb-1">
                                        Identity verified ✅
                                    </p>
                                    <p className="text-sm">
                                        You’re all set — nothing else to do here.
                                    </p>
                                </div>
                            )}

                            {isPending && (
                                <div className="mb-4 text-yellow-900 bg-yellow-50 p-4 rounded-box-sm border border-yellow-200">
                                    <p className="font-bold mb-1">
                                        Check submitted — under review
                                    </p>
                                    <p className="text-sm">
                                        Stripe is checking your documents. This usually takes a few minutes; we’ll email you as soon as there’s a result.
                                    </p>
                                </div>
                            )}

                            {hasFailed && (
                                <div className="mb-4 bg-red-50 p-4 rounded-box-sm border-2 border-red-500">
                                    <p className="text-[12px] font-bold uppercase tracking-widest text-red-600 mb-1">
                                        Why it came back
                                    </p>
                                    <p className="font-bold text-gray-900">
                                        {failure.title}
                                    </p>
                                    <p className="text-sm text-gray-800 mt-1">
                                        {failure.whatHappened}
                                    </p>

                                    {failure.note && (
                                        <div className="mt-3 bg-white border border-red-200 rounded-box-sm p-3">
                                            <p className="text-[12px] font-bold uppercase tracking-widest text-black/60 mb-1">
                                                Note from our team
                                            </p>
                                            <p className="text-sm text-gray-800">
                                                {failure.note}
                                            </p>
                                        </div>
                                    )}

                                    {failure.whatToDo.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-[12px] font-bold uppercase tracking-widest text-black/60 mb-1.5">
                                                What to do next
                                            </p>
                                            <ol className="space-y-1">
                                                {failure.whatToDo.map((s, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-start gap-2 text-[13px] text-gray-700"
                                                    >
                                                        <span className="font-bold text-[#FF007F]">
                                                            {i + 1}.
                                                        </span>
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isVerified && !isFlagged && (
                                <div className="rounded-box-sm border border-gray-200 bg-gray-50 p-4">
                                    <p className="font-bold text-gray-900">
                                        What happens next?
                                    </p>
                                    <ul className="text-sm text-gray-700 mt-2 space-y-1">
                                        <li>1) You upload your passport in Stripe.</li>
                                        <li>2) Stripe verifies it — usually a few minutes.</li>
                                        <li>3) We email you the result either way.</li>
                                    </ul>
                                </div>
                            )}

                            {/* A flagged check can't be retried, so it gets a route
                                to a human instead of a button that cannot help. */}
                            {isFlagged ? (
                                <a
                                    href="mailto:support@spennypiggy.co?subject=Identity%20verification%20review"
                                    className="mt-6 block text-center text-xl px-4 py-[10px] bg-black !text-white w-full rounded-box-sm hover:!bg-[#FF007F] hover:!text-black font-bold"
                                >
                                    CONTACT SUPPORT
                                </a>
                            ) : (
                                <div className="mt-6">
                                    <LoaderButton
                                        disabled={loading || isVerified}
                                        onClick={handleVerification}
                                        className={`relative flex flex-row items-center text-xl px-4 py-[10px] focus:outline-none border-l-4 border-transparent pr-6 bg-black !text-white w-full ${
                                            loading ? "!animate-pulse !bg-green-400" : "hover:!bg-[#FF007F] hover:!text-black"
                                        }`}
                                        spinnerclass="fill-white"
                                    >
                                        {loading
                                            ? "Processing…"
                                            : isVerified
                                                ? "VERIFIED"
                                                : hasFailed
                                                    ? "TRY VERIFICATION AGAIN"
                                                    : isPending
                                                        ? "START AGAIN"
                                                        : "VERIFY NOW"}
                                    </LoaderButton>
                                    {isPending && (
                                        <p className="text-xs text-gray-600 mt-2 text-center">
                                            Didn’t finish the check? You can start a new one.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between text-sm">
                                <Link
                                    href={route("user.show", {
                                        username: auth?.user?.username,
                                    })}
                                    className="text-gray-700 hover:text-black font-semibold"
                                >
                                    Back to profile
                                </Link>
                                <a
                                    href="mailto:support@spennypiggy.co"
                                    className="text-[#FF007F] hover:underline font-semibold"
                                >
                                    support@spennypiggy.co
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
