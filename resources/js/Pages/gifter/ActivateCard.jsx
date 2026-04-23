import LoaderButton from "@/Components/LoaderButton";
import { useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";

export default function ActivateCard() {
    const { auth, gifterCardVerification } = usePage().props;
    const verification_status = auth && auth.verification_status;
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert } = useAlerts();

    const checkTerms = () => {
        if (loading) return;
        setLoading(true);
        axios
            .get(route('gifter.card.verification'))
            .then((resp) => {
                if (resp?.data?.status == true) {
                    window.location.href = resp?.data?.checkout_url;
                    setLoading(false);
                }
                errorAlert(resp?.data?.message);
                setTimeout(() => {
                    window.location.reload(false);
                }, 2000);
                setLoading(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
            });
    };

    const user = auth?.user;
    const isRejected = user?.profile_reject_reason && user.profile_reject_reason.trim() !== '';
    const verification = user?.gifter_card_verification;
    const isFailed = verification?.status === 'failed';
    const isPending = user?.profile_status_lock == 1 && user?.is_subscribed == 1;
    const needsVerification = (isRejected || user?.is_500_limit_exceeded == 1) && user?.profile_status_lock != 2;

    if (!needsVerification && !isPending) {
        return null;
    }

    return (
        <>
            <div className="">
                <div className="mb-6 mx-auto !bg-white rounded-[20px] md:rounded-[30px] border-2 border-black shadow-[5px_5px_0px_rgba(0,0,0,0.9)] ">
                    {needsVerification ? (
                        <div className=" rounded-[30px]  p-3">
                            <div className="stripNote p-3 p-md-4">
                                <h4 className="text-[30px] font-GillSans text-black text-center uppercase mb-3">
                                   {isRejected ? 'Retry Card Verification' : 'Card Verification' }
                                </h4>
                                {isRejected ? (
                                    <div className="mt-3 text-center mb-6 p-4 md:p-6 bg-red-50 border-2 border-red-200 rounded-[30px]">
                                        <strong className="text-red-600 text-lg flex items-center justify-center gap-2 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Verification Rejected
                                        </strong>
                                        <p className="text-red-700 font-bold">
                                            Reason: {auth?.user?.profile_reject_reason}
                                        </p>
                                        <p className="text-red-500 text-sm mt-2">
                                            Please correct the issues above and try again.
                                        </p>
                                    </div>
                                ) : (
                                    ""
                                )}

                                {isFailed && !isRejected ? (
                                    <div className="mt-3 text-center mb-6 p-4 md:p-6 bg-orange-50 border-2 border-orange-200 rounded-2xl">
                                        <strong className="text-orange-600 text-lg flex items-center justify-center gap-2 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Payment Failed or Canceled
                                        </strong>
                                        <p className="text-orange-700">
                                            {verification?.payment_details?.reason || 'The card verification payment was not completed.'}
                                        </p>
                                    </div>
                                ) : (
                                    ""
                                )}
                                <p className="mb-1 text-[19px] text-center text-gray-800">
                                    To activate your card and access the ability
                                    to make payments on our platform, simply
                                    click the button below and complete a
                                    one-time verification fee of £1. This quick
                                    and secure process ensures the safety of all
                                    transactions and helps us maintain a trusted
                                    environment for our users. Once your card is
                                    activated, you’ll be able to seamlessly make
                                    purchases and access all payment features on
                                    the website.
                                </p>


                            </div>

                            <p className="p-2 text-center  text-pink mb-3">
                                Please use the card with same address as you
                                have used for your account.{" "}
                            </p>

                            <div className="text-center flex justify-center mb-2">
                                <LoaderButton
                                    onClick={checkTerms}
                                    disabled={loading} 
                                    className={"main-button p !bg-white "}
                                    spinnerclass="fill-red-600 " >
                                    {isRejected ? "Re-Activate Account" : "Activate Account"}
                                </LoaderButton>
                            </div>

                        </div>
                    ) : (
                        ""
                    )}

                    {isPending ? (
                        <div className=" rounded-[30px]  p-3">
                            <div className="stripNote p-3 p-md-4">
                                <h4 className="text-[25px] font-GillSans text-yellow-600 text-center uppercase mb-3">
                                    Verification Pending
                                </h4>
                                <p className="mb-1 text-[19px] text-center max-w-[400px] m-auto text-gray-800">
                                    Admin will now confirm that you are a
                                    Verified person. Please check back in 1-2
                                    hours.
                                </p>

                                {verification_status?.address_verification_error ? (
                                    <div className="mt-4 text-center">
                                        <strong className="text-red-600">
                                            Address verification error
                                        </strong>
                                        <p className="text-red-600">
                                            {
                                                verification_status?.address_verification_error
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>
                    ) : (
                        ""
                    )}
                </div>
            </div>
        </>
    );
}
