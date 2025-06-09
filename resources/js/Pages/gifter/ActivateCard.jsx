import React from "react";
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

    return (
        <>
            <div className="blackbg">
                <div className=" mb-md-4 mx-auto border-mints swhbg shadow-mints rounded-[30px]">
                    {(auth?.user?.profile_status_lock == 1 || auth?.user?.profile_status_lock == 0) && auth?.user?.is_500_limit_exceeded == 1 && auth?.user?.is_subscribed !== 1  ? (
                        <div className="dark2 rounded-[30px] p-3">
                            <div className="stripNote p-3 p-md-4">
                                <h4 className="text-[30px] font-GillSans text-white text-center text-uppercase mb-3">
                                   {auth?.user?.profile_reject_reason ? 'Re-Activate Account' : ' Activate Account' }
                                </h4>
                                {auth?.user?.profile_reject_reason ? (
                                    <div className="mt-3 text-center mb-6">
                                        <strong className="text-red-500 text-lg">
                                            Previous Verification Rejected
                                        </strong>
                                        <p className="text-red-500">
                                            {auth?.user?.profile_reject_reason}
                                        </p>
                                    </div>
                                ) : (
                                    ""
                                )}
                                <p className="mb-1 text-[17px] text-center text-gray-400">
                                    To activate your card and unlock the ability
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
                                    className={"p-3 lg"}
                                    spinnerClassName="fill-red-600"
                                >
                                    {auth?.user?.profile_reject_reason
                                        ? "Re-Activate Account"
                                        : "Activate Account"}
                                </LoaderButton>
                            </div>

                        </div>
                    ) : (
                        ""
                    )}

                    {auth?.user?.profile_status_lock == 1 && auth?.user?.is_subscribed == 1 ? (
                        <div className="dark2 rounded-[30px] p-3">
                            <div className="stripNote p-3 p-md-4">
                                <h4 className="text-[25px] font-GillSans text-yellow-400 text-center text-uppercase mb-3">
                                    Verification Pending
                                </h4>
                                <p className="mb-1 text-[18px] text-center max-w-[400px] m-auto text-gray-400">
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
