import GuestLayout from "@/Layouts/GuestLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import { Head, Link, useForm } from "@inertiajs/react";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

export default function VerifyEmail({ status }) {

    const { get, processing } = useForm({});
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const [loading, setLoading] = useState(false);
    const [send, setSent] = useState(false);
    const submit = (e) => {
        e.preventDefault();
        setLoading(true);
        axios.get(`/email/send-verification-email`).then(resp => {
            setSent(true);
            setLoading(false);
        }).catch(_err => {
            console.error("error", _err);
            setLoading(false);
        });
    };

    return <div className="blackbg pageheight p-4">
        <style>{`
            .mailicon svg {max-width:200px;}
        `}</style>
        <div>
            <Head title="Email Verification" />
            <div  >
                <div className="mailicon m-auto d-table" >
                    <svg width="341" height="287" viewBox="0 0 341 287" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M54.1393 241.814V237.535H49.8604H31.1628C16.3152 237.535 4.27889 225.499 4.27889 210.651V79.7678C4.27889 64.9202 16.3152 52.8839 31.1628 52.8839H261.767C276.615 52.8839 288.651 64.9202 288.651 79.7677V210.651C288.651 225.499 276.615 237.535 261.767 237.535H102.837H101.26L100.06 238.559L54.1393 277.727V241.814Z" fill="#F94F97" stroke="#E6EA7B" stroke-width="8.55778" />
                        <rect x="266.941" width="4.62903" height="33.9462" rx="2.31452" fill="#E6EA7B" />
                        <rect x="302.994" y="9.2583" width="4.62903" height="33.9462" rx="2.31452" transform="rotate(31.1065 302.994 9.2583)" fill="#E6EA7B" />
                        <rect x="327.876" y="30.0889" width="4.62903" height="33.9462" rx="2.31452" transform="rotate(57.1905 327.876 30.0889)" fill="#E6EA7B" />
                        <rect x="340.071" y="62.4917" width="4.62903" height="33.9462" rx="2.31452" transform="rotate(84.3885 340.071 62.4917)" fill="#E6EA7B" />
                        <path d="M70.207 101.583H232.648V199.048H70.207V101.583Z" fill="#3CFCCF" />
                        <path d="M79.2324 16.7536C79.2324 8.77908 85.6971 2.31445 93.6716 2.31445H189.331L204.673 17.6561L225.429 38.4124V159.341C225.429 167.315 218.965 173.78 210.99 173.78H93.6716C85.6971 173.78 79.2324 167.315 79.2324 159.341V16.7536Z" fill="#8C52FF" />
                        <path d="M189.331 2.31445L225.429 38.4124H194.746C191.755 38.4124 189.331 35.9882 189.331 32.9977V2.31445Z" fill="#05EFB8" />
                        <path d="M146.733 90.07C143.724 93.0795 138.844 93.0795 135.835 90.07L128.659 82.8938C126.603 80.8381 126.603 77.5052 128.659 75.4495C130.717 73.3916 134.054 73.3941 136.109 75.455L140.475 79.8342C140.921 80.2822 141.647 80.2825 142.094 79.835L163.569 58.3386C165.625 56.2801 168.961 56.2793 171.019 58.3367C173.075 60.3934 173.075 63.728 171.019 65.7847L146.733 90.07Z" fill="#05EFB8" />
                        <g filter="url(#filter0_d_1039_862)">
                            <path d="M70.207 101.583L149.623 145.803L70.207 199.048V101.583Z" fill="#05EFB8" />
                        </g>
                        <g filter="url(#filter1_d_1039_862)">
                            <path d="M232.648 101.583L153.233 145.803L232.648 199.048V101.583Z" fill="#05EFB8" />
                        </g>
                        <g filter="url(#filter2_d_1039_862)">
                            <path d="M70.207 199.048L139.714 130.359C143.767 126.354 150.231 126.174 154.5 129.949L232.648 199.048H70.207Z" fill="#05EFB8" />
                        </g>
                        <defs>
                            <filter id="filter0_d_1039_862" x="70.207" y="88.9492" width="119.123" height="122.733" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                                <feOffset dx="27.0735" />
                                <feGaussianBlur stdDeviation="6.31714" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1039_862" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1039_862" result="shape" />
                            </filter>
                            <filter id="filter1_d_1039_862" x="113.526" y="88.9492" width="119.123" height="122.733" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                                <feOffset dx="-27.0735" />
                                <feGaussianBlur stdDeviation="6.31714" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1039_862" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1039_862" result="shape" />
                            </filter>
                            <filter id="filter2_d_1039_862" x="57.5727" y="100.159" width="187.709" height="98.8894" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                                <feOffset dy="-14.4392" />
                                <feGaussianBlur stdDeviation="6.31714" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1039_862" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1039_862" result="shape" />
                            </filter>
                        </defs>
                    </svg>
                </div>
                <h3 className="headingSm shadow-yellow mb-3 text-center" >Confirm your email</h3>
                <h5 className="font-large  text-center text-mint w-75 m-auto d-table" >Thanks for signing up! Before getting started, please verify
                    your email.</h5>
                <form onSubmit={submit}>
                    <div className="mt-4 flex items-center justify-content-center">
                        <PrimaryButton className="btn-pink md   py-3 px-2" disabled={loading}>
                            {loading ? "Sending..." : send ? " Email Sent" : "Send Verification Link"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    </div>
}
