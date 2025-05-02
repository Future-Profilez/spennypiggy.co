import React from "react";
import LoaderButton from "@/Components/LoaderButton";
import { useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";

export default function ActivateCard() {
    const { auth, gifterCardVerification } = usePage().props;
    console.log("gifterCardVerification", gifterCardVerification);
    const verification_status = auth && auth.verification_status;
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert } = useAlerts();

    const checkTerms = () => {
        if (loading) return;
        setLoading(true);
        axios
            .get(`gifter-card-verification`)
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
                <div className=" mb-md-4 mx-auto border-mint whbg shadow-mint rounded-[30px]">
                    <div className="loginheadbox pinkbg">
                        <span className="mintbg"></span>
                        <span className="bluebg"></span>
                    </div>

                    {auth?.user?.profile_status_lock == 0 ? (
                        <div className="py-4">
                            <div className="stripNote p-3 p-md-4">
                                <h4 className="text-[30px] font-GillSans text-center text-uppercase mb-3">
                                    Activate Account
                                </h4>
                                <p className="mb-1 text-[18px] text-center">
                                    {" "}
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

                                {auth?.user?.profile_reject_reason ? (
                                    <div className="mt-4 text-center">
                                        <strong className="text-red-700 text-lg">
                                            Previous Verification Rejected
                                        </strong>
                                        <p className="text-red-400">
                                            {auth?.user?.profile_reject_reason}
                                        </p>
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>

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
                            <p className="p-2 text-center text-red-600">
                                Please use the card with same address as you
                                have used for your account.{" "}
                            </p>
                        </div>
                    ) : (
                        ""
                    )}

                    {auth?.user?.profile_status_lock == 1 ? (
                        <div className="py-4">
                            <div className="stripNote p-3 p-md-4">
                                <h4 className="text-[25px] font-GillSans text-yellow-600 text-center text-uppercase mb-3">
                                    Verification Pending
                                </h4>
                                <p className="mb-1 text-[18px] text-center max-w-[400px] m-auto">
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
