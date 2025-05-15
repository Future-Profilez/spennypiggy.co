import { useAlerts } from "@/Components/Alerts";
import Popup from "@/Components/Popup";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { IoPhonePortrait } from "react-icons/io5";

export default function TFA() {

    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const [isTFA, setIsTFA] = useState(auth?.user?.is_2fa || 0);
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const inputRefs = useRef([]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index !== 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const [qr, setQr] = useState(null);
    const [backupCodes, setBackupCodes] = useState([]);

    const getQr = async () => {
        setStep(2);
        axios.get(`/show-2fa-qr`).then((resp) => {
            if (resp.data.status){
                setQr(resp.data.qr_code);
            }
        })
        .catch((_err) => {
            console.error("error", _err);
        });
    };

    const [verifying, setVerifying] = useState(false);
    const verify = async () => {
        setVerifying(true);
        const resp = axios.post(`verification-2fa`, { otp: otp.join("") })
        resp.then((resp) => { 
         if (resp.data.status) {
            successAlert(resp.data.msg);
            setBackupCodes(resp.data.codes);
         } else {
            errorAlert(resp.data.msg);
         }
         setVerifying(false);
        }).catch((_err) => {
         console.error("error", _err);
         setVerifying(false);
        });
    };
    const disable2fa = async () => {
        const resp = axios.post(`switch-2fa`, {status:0})
        resp.then((resp) => {
         if (resp.data.status) {
            successAlert(resp.data.msg);
            setIsTFA(0);
            setBackupCodes([]);
            setStep(1);
            setOpen(false);
         } else {
            errorAlert(resp.data.msg);
         }
        }).catch((_err) => {
         console.error("error", _err);
        });
    };



    const copyCodes = (codes) => {
        const codesString = codes.join("\n\n");
        navigator?.clipboard.writeText(codesString);
        successAlert("Backup code copied to clipboard.");
        setIsTFA(1);
        setOpen('close');
    }


    return (
        <>
            <Popup space="4" action={open}
                modalclass="full pinkmodal"
                text={<>TWO FACTOR AUTHENTICATION</>} >
                {isTFA == 0 ?
                        <>
                            {backupCodes && backupCodes.length ? <>
                                <div className="backcodes">
                                    <h2 className="font-bold text-xl mb-1">Backup Codes</h2>
                                    <p className="text-gray-700 mb-4"> Please use the following backup codes to sign in to your account if you lose access to your authenticator app or phone.</p>
                                    <p className="text-gray-700 font-bold mb-4 ">Please take a screenshot or copy these code and store them in a safe place. These are one time generated.</p>
                                    <div className="codes bg-gray-100 p-4 rounded-xl relative">
                                        {backupCodes && backupCodes.map((code, index) => (
                                            <p key={index} className="mb-2 text-lg">{code}</p>
                                        ))}
                                        <button className="absolute top-2 right-3 text-[14px] bg-gray-200 px-3 py-1 rounded-lg" onClick={()=>copyCodes(backupCodes)} >Copy</button>
                                    </div>
                                </div>
                                </>
                                :
                                <>
                                    <div className="enableTFA">
                                        <h2 className="font-bold text-xl mb-1">Two Factor Authentication</h2>
                                        <p className="text-gray-700 mb-4"> Two-step verification adds an extra layer of protection to your account. After you've turned it on,we'll ask you to enter an additional security code when you sign in. We'll provide this security code only to you. </p>

                                        <div className={`step1 ${step === 1 ? "visible" : "hidden"}`}>
                                            <p className="text-gray-700 mb-2 font-bold">
                                                In the following steps, we'll help you:
                                            </p>
                                            <ul className="ps-0 list-dotted">
                                                <li className="text-gray-700">
                                                    1. Make sure you have up-to-date security info where
                                                    you can receive security codes.
                                                </li>
                                                <li className="text-gray-700 mb-1">
                                                    2. Set up an authenticator app if you have a
                                                    smartphone. (With an authenticator app, you can get
                                                    security codes.)
                                                </li>
                                                <li className="text-gray-700 mb-1">
                                                    3. Print or save QR code for security codes.
                                                </li>
                                                <li className="text-gray-700 mb-1">
                                                    4. Everytime when you will sign in will need a
                                                    security code from your autheticator app.
                                                </li>
                                            </ul>
                                            <button onClick={getQr}
                                            className="border-0 pinkbg rounded-2xl px-3 py-2 text-lg text-white m-auto table w-full mt-4 " > Next</button>
                                        </div>

                                        <div className={`step1 ${step === 2 ? "visible" : "hidden"}`}>
                                            <p className="text-gray-700 mb-2 font-bold flex items-center mt-4">
                                                <IoPhonePortrait size={"4rem"} className="me-2" />
                                                <span> Download google authenticator or other similar app to scan the QR code to get security codes.</span>
                                            </p>
                                            <div
                                                className="rounded-xl max-w-[200px] m-auto table my-3"
                                                dangerouslySetInnerHTML={{ __html: qr }}
                                            ></div>
                                            <div className="flex justify-center">
                                                <div className="flex items-center mt-4">
                                                    {otp.map((data, index) => (
                                                        <input
                                                            key={index}
                                                            type="text"
                                                            className="border-gray-300  text-center bg-gray-200 text-black rounded-xl w-full max-w-[40px] min-h-[40px] otp-input mx-1 px-1 py-1 "
                                                            maxLength="1"
                                                            value={data}
                                                            onChange={(e) => handleChange(e.target,index)}
                                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                                            ref={(el) =>(inputRefs.current[index] = el)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <button onClick={verify}
                                                className="border-0 pinkbg rounded-2xl px-3 py-2 text-lg text-white m-auto table w-full mt-4 ">{verifying ? "VERIFYING..." : "VERIFY"}
                                            </button>
                                            {/* <button className="text-center text-primary my-3 cursor-pointer w-75 m-auto d-table font-normal">Verify with backup code.</button> */}
                                        </div>
                                    </div>
                                </>
                            }
                        </>
                    :
                    <div className="backcodes">
                        <h2 className="font-bold text-xl mb-1">Two Factor Authentication</h2>
                        <p className="text-gray-700 mb-4"> Two-step verification adds an extra layer of protection to your account. After you've turned it on,we'll ask you to enter an additional security code when you sign in. We'll provide this security code only to you. </p>
                            <button onClick={disable2fa} className="bg-red-600 text-white m-auto px-3 py-2 rounded-4" >Disable 2FA</button>
                     </div>
                }
            </Popup>

            {/* Enter emergency backup code which you have save in two factor authorization process. */}
        </>
    );
}
