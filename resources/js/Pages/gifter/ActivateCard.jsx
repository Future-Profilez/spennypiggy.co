import React from "react";
import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Countries from "@/includes/Countries";
import { useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { useRef } from "react";
import axios from "axios";

export default function ActivateCard() {
    const checkRef = useRef();
    const { errorAlert } = useAlerts();
    const { auth  } = usePage().props;
    console.log("auth",auth);
    const { data, setData, get, post, processing, errors, reset } = useForm({
        termaccept: "",
    });

    const [country, setCountry] = useState("GB");
    const getCountry = (e) => {
        setCountry(e);
    };

    const [loading, setLoading] = useState(false);
    const checkTerms = () => {
        if(loading)return;
        setLoading(true);
        axios.get(`gifter-card-verification`)
        .then((resp) => {
            window.location.href = resp?.data?.checkout_url;
            console.log("resp",resp?.data);
            setLoading(false);
        })
        .catch((_err) => {
            console.error("error", _err);
            setLoading(false);
        });
    };

    return (
        <>
            <div className="max-w-3xl mx-auto shadow-voilet rounded-lg mb-6 p-6 bg-white">
                <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">
                    Card Verification
                </h2>
                
                <p className="text-gray-600 text-base leading-relaxed text-center mb-6">
                    To activate your card and unlock the ability to make payments on our platform, simply click the button below and complete a one-time verification fee of £1. This quick and secure process ensures the safety of all transactions and helps us maintain a trusted environment for our users. Once your card is activated, you’ll be able to seamlessly make purchases and access all payment features on the website.
                </p>
                
                <div className="flex justify-center">
                    <button
                    onClick={checkTerms}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                    {loading ? "Activating..." : "Start Free Trial"}
                    </button>
                </div>
            </div>
            {/* <div className="stripbox mb-md-4 mx-auto border-mint whbg shadow-mint rounded-3xl">
                    <div className="py-4">
                        <div className="stripNote p-3 p-md-4">
                            <h4 className="text-[30px] font-GillSans text-center text-uppercase mb-3">
                                Card Verification
                            </h4>
                            <p className="mb-4 text-[18px] text-center">
                                Enjoy a{" "}
                                <span className="text-green-500 font-bold">
                                    3-days free trial
                                </span>{" "}
                                before your monthly subscription begins! Stripe
                                charges £2 a month for this service, and we add
                                a £2 administrator charge due to heightened
                                compliance requirements.
                            </p>
                            <p className="font-semibold text-center text-green-600 text-lg">
                                Start your subscription today and pay nothing
                                for the first 3 days!
                            </p>
                        </div>
                        <div className="text-center flex justify-center mb-4">
                            <LoaderButton
                                 onClick={checkTerms}
                                disabled={loading}
                                className={"p-3 lg"}
                                spinnerClassName="fill-red-600"
                            >
                                {loading ? "Activating.." : "Start Free Trial"}
                            </LoaderButton>
                        </div>
                    </div>
                </div> */}
        </>
    );
}
