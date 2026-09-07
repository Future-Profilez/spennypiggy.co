import { useEffect, useState, useRef } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { IoPhonePortrait, IoArrowBack } from "react-icons/io5";

export default function TwoFactorSetup({ auth }) {
    const { successAlert, errorAlert } = useAlerts();
    const [step, setStep] = useState(1);
    const [isTFA, setIsTFA] = useState(auth?.user?.is_2fa || 0);
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const inputRefs = useRef([]);
    const [qr, setQr] = useState(null);
    const [secretKey, setSecretKey] = useState(null);
    const [backupCodes, setBackupCodes] = useState([]);
    const [verifying, setVerifying] = useState(false);

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const newOtp = [...otp];
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i];
        }
        setOtp(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
        if (pasted.length === 6) {
            verifyCode(pasted);
        }
    };

    const handleChange = (val, index) => {
        const cleaned = val.replace(/\D/g, "");
        if (!cleaned && val !== "") return;
        const char = cleaned.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);

        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        const full = newOtp.join("");
        if (full.length === 6 && !newOtp.includes("")) {
            verifyCode(full);
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const getQr = async () => {
        setStep(2);
        axios.get(`/show-2fa-qr`).then((resp) => {
            if (resp.data.status){
                setQr(resp.data.qr_code);
                setSecretKey(resp.data.secret_key || null);
            }
        })
        .catch((_err) => {
            console.error("error", _err);
        });
    };

    const copySecretKey = () => {
        if (!secretKey) return;
        navigator?.clipboard?.writeText(secretKey);
        successAlert("Secret key copied to clipboard.");
    };

    const verifyCode = async (codeToVerify) => {
        const fullOtp = codeToVerify || otp.join("");
        if (fullOtp.length !== 6 || verifying) return;
        setVerifying(true);
        try {
            const resp = await axios.post(`/verification-2fa`, { otp: fullOtp });
            if (resp.data.status) {
                successAlert(resp.data.msg);
                setBackupCodes(resp.data.codes);
                setIsTFA(1); // Mark as enabled
            } else {
                errorAlert(resp.data.msg);
            }
        } catch (_err) {
            console.error("error", _err);
            errorAlert("Verification failed. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    const verify = () => {
        verifyCode();
    };

    const disable2fa = async () => {
        const resp = axios.post(`/switch-2fa`, {status:0})
        resp.then((resp) => {
         if (resp.data.status) {
            successAlert(resp.data.msg);
            setIsTFA(0);
            setBackupCodes([]);
            setStep(1);
            setOtp(new Array(6).fill(""));
            setSecretKey(null);
            setQr(null);
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
    }

    return (
        <Authenticated user={auth.user} auth={auth.user}>
            <Head title="Multi-Step Verification" />
            <div className="bg-white">
                <div className=" py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="mb-6">
                        <Link href={route('account')} className="flex items-center text-gray-600 hover:text-[#FF007F] transition-colors">
                            <IoArrowBack className="mr-2" /> Back to Account
                        </Link>
                    </div>

                    <div className="bg-white rounded-box  p-4 ">
                        <h1 className="text-3xl font-gulfs mb-6 text-center uppercase">Multi-Step Verification</h1>
                        
                        {isTFA == 1 && backupCodes.length === 0 ? (
                            <div className="text-center">
                                <div className="mb-6 p-4 bg-green-50 rounded-box-sm inline-block border border-green-200">
                                    <p className="text-green-700 font-medium text-lg">Multi-Step Verification is currently ENABLED</p>
                                </div>
                                <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                                    Your account is secure. You will be asked for a verification code each time you sign in.
                                </p>
                                <button 
                                    onClick={disable2fa} 
                                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-medium transition-all "
                                >
                                    Disable 2FA
                                </button>
                            </div>
                        ) : (
                            <div>
                                {backupCodes.length > 0 ? (
                                    <div className="max-w-xl mx-auto">
                                        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-box  mb-8">
                                            <h2 className="font-bold text-xl mb-3 text-yellow-800">Setup Complete! Save your Backup Codes</h2>
                                            <p className="text-gray-700 mb-4">
                                                Please save these backup codes in a secure place. If you lose access to your device, you can use these codes to log in. 
                                                <span className="font-bold block mt-2 text-red-600">These codes will only be shown once.</span>
                                            </p>
                                            
                                            <div className="bg-white p-6 rounded-box-sm border border-gray-200 relative mb-4">
                                                <div className="grid grid-cols-2 gap-4 text-center font-mono text-lg font-medium">
                                                    {backupCodes.map((code, index) => (
                                                        <div key={index} className="p-2 bg-gray-50 rounded-box-sm">{code}</div>
                                                    ))}
                                                </div>
                                                <button 
                                                    className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full text-sm font-medium transition-colors" 
                                                    onClick={() => copyCodes(backupCodes)}
                                                >
                                                    Copy All
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <Link href={route('account')} className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full font-medium transition-all inline-block">
                                                Return to Account
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto">
                                    <p className="text-gray-600 mb-8 text-center">
                                        Multi-step verification adds an extra layer of protection to your account. 
                                        Once enabled, you'll need to enter a unique security code from your authenticator app when signing in.
                                    </p>

                                        {step === 1 && (
                                            <div className="space-y-6">
                                                <div className="bg-gray-50 p-6 rounded-box  border border-gray-100">
                                                    <h3 className="font-bold text-lg mb-4">Setup Instructions:</h3>
                                                    <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                                                        <li>Download an Authenticator app (like Google Authenticator or Authy) on your mobile device.</li>
                                                        <li>Scan the QR code shown in the next step.</li>
                                                        <li>Enter the verification code generated by the app.</li>
                                                    </ol>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <button 
                                                        onClick={getQr} 
                                                        className="bg-pink-600 hover:bg-pink-700 text-white px-10 py-3 rounded-full font-medium text-lg transition-all transform hover:-translate-y-1"
                                                    >
                                                        Start Setup
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="text-center animate-fade-in">
                                                <div className="mb-6 flex flex-col items-center">
                                                    <IoPhonePortrait size={"4rem"} className="text-black/60 mb-4" />
                                                    <p className="text-gray-700 mb-4 font-medium">
                                                        Scan this QR code with your authenticator app
                                                    </p>
                                                    {qr ? (
                                                        <div
                                                            className="bg-white p-2 rounded-box border border-gray-200 inline-block"
                                                            dangerouslySetInnerHTML={{ __html: qr }}
                                                        ></div>
                                                    ) : (
                                                        <div className="h-48 w-48 bg-gray-100 animate-pulse rounded-box"></div>
                                                    )}

                                                    {secretKey && (
                                                        <div className="mt-5 w-full max-w-sm p-3.5 bg-gray-50 border border-gray-200 rounded-box text-left">
                                                            <p className="text-xs text-gray-500 font-medium mb-1">
                                                                Can't scan the QR code? Enter key manually:
                                                            </p>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <code className="font-mono text-sm tracking-wider font-bold text-gray-800 break-all select-all">
                                                                    {secretKey}
                                                                </code>
                                                                <button
                                                                    type="button"
                                                                    onClick={copySecretKey}
                                                                    className="shrink-0 px-3 py-1 text-xs font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-full transition-colors"
                                                                >
                                                                    Copy Key
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mb-8">
                                                    <p className="text-gray-600 mb-3 text-sm">Enter the 6-digit code from your app</p>
                                                    <div className="flex justify-center items-center gap-1.5" onPaste={handlePaste}>
                                                        {otp.map((data, index) => (
                                                            <input
                                                                key={index}
                                                                type="text"
                                                                inputMode="numeric"
                                                                autoComplete="one-time-code"
                                                                className="w-12 h-14 sm:w-14 sm:h-14 text-center text-2xl font-bold border-gray-200 bg-gray-100 rounded-box focus:ring-2 focus:ring-pink-500 focus:border-[#FF007F] transition-all"
                                                                maxLength="1"
                                                                value={data}
                                                                onChange={(e) => handleChange(e.target.value, index)}
                                                                onKeyDown={(e) => handleKeyDown(e, index)}
                                                                ref={(el) => (inputRefs.current[index] = el)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={verify}
                                                    disabled={verifying || otp.join('').length < 6}
                                                    className={`
 w-full max-w-xs mx-auto block px-6 py-3 rounded-full font-medium text-white transition-all 
                                                        ${verifying || otp.join('').length < 6
                                                            ? 'bg-gray-400 cursor-not-allowed'
 : 'bg-pink-600 hover:bg-pink-700 transform hover:-translate-y-1'
                                                        }
                                                    `}
                                                >
                                                    {verifying ? "Verifying..." : "Verify & Enable"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}