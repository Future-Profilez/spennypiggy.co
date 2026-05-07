import React from 'react';

import { useCallback, useMemo, useRef, useState } from "react";
import { useForm, usePage, router } from "@inertiajs/react";
import PriceFormat from '@/includes/PriceFormat';
import DeviceID from "@/includes/DeviceID";
import {piggynose, piggyface, tipheading, leftleg, rightleg} from '@/includes/Icons';
import { useEffect } from 'react';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';
import toast from 'react-hot-toast';
import Turnstile from "@/Components/Turnstile";
import Popup from "@/Components/Popup";
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";

export default function TipInner({classes, idd}) {
  const { rates, global_currency, auth, user, turnstileSiteKey, card_capabilities } = usePage().props;
  const checkRef = useRef();
  const turnstileRef = useRef(null);
  const deviceid = useMemo(() => DeviceID(), []);
  const { formatMultiPrice } = PriceFormat();
  const [defaultAmount, setdefaultAmount] = useState(0);
  const [amount, setAmount] = useState(defaultAmount);
  const { errorAlert } = useAlerts();
  const [verified, setVerified] = useState(false);

  const [selectegTag, setselectegTag] = useState();
  const { data, setData } = useForm({
    email: auth && auth.user?.email || '',
    name: auth && auth.user?.name || '',
    message: 'Just a small token of appreciation 💖',
    anonymous: 0,
    amount: amount,
    digital_waiver: false,
    agree: false,
    currency: user?.default_currency || 'GBP', // Default to creator currency
    cf_turnstile_response: "",
    device_id: deviceid,
  });

  const customAmountTag = (e) => {
    setAmount(e);
    setdefaultAmount(e);
    setselectegTag(e);
    setData("currency", user?.default_currency || 'GBP');
  }

  const customAmount = (e) => {
    if(e.target.value > 99){
      toast.error("Maximum amount is 99");
      return false;
    }
    setAmount(e.target.value);
    setdefaultAmount(e.target.value);
    // When using custom input, amount is in display currency (global_currency)
    // We set currency here, but useEffect below also syncs amount. 
    // We need to ensure currency is set correctly when typing.
    setData("currency", global_currency || 'GBP');
  }

  useEffect(()=>{
    setData("amount", amount);
  },[amount, setData]);

  const [loading, setLoading] = useState(false);
  const [showStepUp, setShowStepUp] = useState(false);
  const [stepUpUi, setStepUpUi] = useState(null);
  const [stepUpContext, setStepUpContext] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [skipCaptcha, setSkipCaptcha] = useState(false);
  const usdToGbp = (amount, currency) => {
        const upCorrency = currency && currency.toUpperCase() || global_currency && global_currency.toUpperCase();
        const conversion_rate = rates[upCorrency];
        const gbpamount  = amount/conversion_rate;
        return gbpamount
  }

  const startTipPayment = useCallback(async (payload) => {
    const tipRes = await axios.post(`/tip-jar/pay/${user.uuid}`, payload);
    if (tipRes.data && (tipRes.data.message === "Login required" || tipRes.data.code === "AUTH_REQUIRED")) {
      const msg = tipRes.data.msg || "Guest checkout is disabled. Please log in.";
      errorAlert(msg);
      router.visit(`/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`);
      return;
    }
    if (tipRes.data.step_up_required) {
      setStepUpUi(tipRes.data.ui || null);
      setStepUpContext(tipRes.data.step_up_context || null);
      setShowStepUp(true);
      // Reset Turnstile so if they cancel the modal, they can verify again
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setVerified(false);
      setData("cf_turnstile_response", "");
      return;
    }
    if (tipRes.data.status) {
      window.location.href = tipRes.data.url;
      return;
    }
    errorAlert(tipRes.data.msg || "Something went wrong.");
  }, [errorAlert, user?.uuid]);

  const onVerify = useCallback((token) => {
    setData("cf_turnstile_response", token || "");
    setVerified(!!token);
  }, [setData]);
  
  const send = (e, bypassCaptcha = false) => {
    e?.preventDefault?.();
    if(data.email === "" || data.name === "" ){
        errorAlert("Please enter all the required details.");
        return false;
    }
    if (card_capabilities === false) {
        errorAlert("This creator cannot accept payments at the moment.");
        return false;
    }
   
    if (!data.agree) {
        errorAlert("Please accept the terms to continue.");
        return false;
    }
    if (!data.digital_waiver) {
        errorAlert("Please confirm the digital waiver to continue.");
        return false;
    }
    if (turnstileSiteKey && !verified && !data.cf_turnstile_response && !skipCaptcha && !bypassCaptcha) {
        toast.error("Please verify the captcha");
        return false;
    }
    if(auth && !auth.user && usdToGbp(data.amount) > 50){
        errorAlert("Larger payments more than £50 need to login.");
        router.visit(`/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent("Larger payments more than £50 need to login.")}`);
        return false;
    }
    if (deviceid) {
      data.device_id = deviceid;
    }
    setLoading(true);
    startTipPayment({ ...data }).then(() => {
      setLoading(false);
    }).catch((err) => {
      const responseErrors = err?.response?.data?.errors;
      const firstError =
          responseErrors &&
          Object.values(responseErrors).flat().filter(Boolean)[0];
      errorAlert(firstError || err?.response?.data?.message || "Something went wrong.");
      setVerified(false);
      setData("cf_turnstile_response", "");
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setLoading(false);
    });
  }

  
    const [passkeyLoading, setPasskeyLoading] = useState(false);

    // Helper function to encode ArrayBuffer to base64
    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const formatCredentialForServer = (credential) => {
        const formatted = {
            id: credential.id,
            rawId: arrayBufferToBase64(credential.rawId),
            type: credential.type,
            response: {
                clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
            },
        };

        if (credential.response.authenticatorData) {
            formatted.response.authenticatorData = arrayBufferToBase64(credential.response.authenticatorData);
        }
        if (credential.response.signature) {
            formatted.response.signature = arrayBufferToBase64(credential.response.signature);
        }
        if (credential.response.userHandle) {
            formatted.response.userHandle = arrayBufferToBase64(credential.response.userHandle);
        }
        if (credential.response.attestationObject) {
            formatted.response.attestationObject = arrayBufferToBase64(credential.response.attestationObject);
        }

        return formatted;
    };

    const base64urlToUint8Array = (base64url) => {
        const base64 = base64url
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), "=");

        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    };

    const isWebAuthnSupported = () => {
        return window.PublicKeyCredential !== undefined;
    };

    
    const isZeroDecimalCurrency = (currencyCode) => {
        const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
        return zeroDecimalCurrencies.includes(currencyCode?.toUpperCase());
    };

    
    const [hasPasskey, setHasPasskey] = React.useState(false);
    
    React.useEffect(() => {
        const checkPasskey = async () => {
            const userEmail = (typeof email !== 'undefined' ? email : null) || (typeof data !== 'undefined' && data?.email ? data.email : null) || auth?.user?.email;
            if (userEmail && isWebAuthnSupported()) {
                try {
                    const res = await axios.post('/webauthn/check', { email: userEmail });
                    setHasPasskey(res.data.has_passkey);
                } catch (e) {
                    setHasPasskey(false);
                }
            }
        };
        if (typeof showStepUp !== 'undefined' && showStepUp) {
            checkPasskey();
        }
    }, [typeof showStepUp !== 'undefined' ? showStepUp : false]);

    const handlePasskeyStepUp = async () => {
        try {
            setPasskeyLoading(true);
            const userEmail = (typeof email !== 'undefined' ? email : null) || (typeof data !== 'undefined' && data?.email ? data.email : null) || auth?.user?.email;

            if (!userEmail) {
                toast.error("Email required for passkey verification.");
                setPasskeyLoading(false);
                return;
            }

            const { data: options } = await axios.post(
                route("webauthn.login.options"),
                { email: userEmail },
            );

            const publicKey = options.publicKey ?? options;
            publicKey.challenge = base64urlToUint8Array(
                publicKey.challenge,
            );

            if (publicKey.allowCredentials) {
                publicKey.allowCredentials = publicKey.allowCredentials.map(
                    (item) => ({
                        ...item,
                        id: base64urlToUint8Array(item.id),
                    }),
                );
            }

            const credential = await navigator.credentials.get({
                publicKey,
            });

            const payload = {
                ...formatCredentialForServer(credential),
                amount: stepUpContext?.amount,
                currency: stepUpContext?.currency,
                creator_id: stepUpContext?.creator_id,
                email: stepUpContext?.email || data.email,
                device_id: stepUpContext?.device_id || deviceid,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id
            };

            const response = await axios.post('/api/risk/step-up/verify-passkey', payload);
            
            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                if (typeof setSkipCaptcha !== 'undefined') setSkipCaptcha(true);
                send(null, true);
            } else {
                toast.error("Passkey verification failed.");
            }
        } catch (error) {
            console.error("Passkey error:", error);
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else if (error.name === "NotAllowedError") {
                toast.error("Authentication cancelled.");
            } else {
                toast.error("Unable to authenticate. Please try again.");
            }
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleVerifyStepUp = async (e) => {
    e.preventDefault();
    setVerifyingOtp(true);
    try {
      const payload = {
        otp: otpCode,
        typed_confirmation: typedConfirmation,
        amount: stepUpContext?.amount,
        currency: stepUpContext?.currency,
        creator_id: stepUpContext?.creator_id,
        email: stepUpContext?.email || data.email,
        device_id: stepUpContext?.device_id || deviceid,
        is_checkout_session: true,
      };
      const riskIdentityId = stepUpContext?.risk_identity_id;
      if (riskIdentityId) {
        payload.risk_identity_id = riskIdentityId;
      }
      const res = await axios.post('/api/risk/step-up/verify', payload);

      if (res.data.success) {
        toast.success("Verified. Please continue.");
        setShowStepUp(false);
        setOtpCode("");
        setTypedConfirmation("");
        setStepUpContext(null);
        setLoading(true);
        startTipPayment({ ...data })
          .catch((err) => {
            const responseErrors = err?.response?.data?.errors;
            const firstError =
              responseErrors &&
              Object.values(responseErrors).flat().filter(Boolean)[0];
            errorAlert(firstError || err?.response?.data?.message || "Something went wrong.");
          })
          .finally(() => setLoading(false));
      } else {
        toast.error("Verification failed.");
      }
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.error || "OTP Verification failedss.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return <>
      <div className='tip-wrapper'>
        <div className='piggyface' dangerouslySetInnerHTML={{ __html: piggyface }} />
        <div className='piggynose' dangerouslySetInnerHTML={{ __html: piggynose }} />
        <div className={`${classes} p-2 md:p-4 box-inner`}>
            <div className='legleft'  dangerouslySetInnerHTML={{ __html: leftleg }} />
            <div className='legright'  dangerouslySetInnerHTML={{ __html: rightleg }} />
            <h2 className='p-3 text-pink-500 !font-normal font-GillSans uppercase text-2xl mb-1 mt-4 pr-5'>Support Me</h2>
            <div className='border-t border-gray-200 p-3 pt-3' >

              

              {/* <div className='tip-counter flex items-center justify-between mb-3' >
                  <p className='tipheading flex items-center' >
                    <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} />
                  {defaultAmount} &nbsp;Each</p>
                  <div className='incresecounter flex items-center' >
                        <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px]  border  rounded-[30px]  ' onClick={decresevalue} >-</button>
                        <div className='border px-3 py-2 rounded-[30px]   mx-1' >{tipQuantity}</div>
                        <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px] border  rounded-[30px]  ' onClick={incresevalue} >+</button>
                  </div>
              </div> */}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2 mt-2">
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 25 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(25)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(25, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 30 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(30)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(30, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 35 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(35)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(35, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 40 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center hidden md:flex items-center !text-[16px] !font-bold `} onClick={()=>customAmountTag(40)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(40, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 45 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(45)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(45, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 50 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(50)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(50, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 75 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(75)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(75, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 85 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(85)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(85, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == 99 ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px]  p-2 px-3 text-center justify-center  flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(99)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(99, (auth && auth?.user && auth?.user.default_currency) || "GBP")}</button>
                  {/* <button className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag === 'custom' ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[30px]  p-2 px-3  !text-md font-gulfs`} onClick={selectCustom} >Custom Support</button> */}
              </div>

              <p className="!my-4 text-[14px]  text-gray-500 font-normal mt-1 leading-tight">
                *Includes platform and payment processing fees. <br /> You will be charged in {user?.default_currency || 'GBP'}. Amounts shown in {global_currency || user?.default_currency || 'GBP'} are estimates.
              </p>


                {selectegTag === 'custom' ? <div className="mb-4 ">
                    <div className="relative currency-wrapper " >
                        <span className="currency-tag">{global_currency || 'GBP'}</span>
                        <input className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] " value={amount}
                        onChange={customAmount}
                        type="number" placeholder="Enter amount.. " />
                    </div>
                </div> : ''}

              {amount > 0 ? <>
                <div className="mb-3"> 
                  <textarea className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[20px] " defaultValue={'Just a small token of appreciation 💖'}
                  onChange={(e) => setData('message', e.target.value)}
                  placeholder="Write a short note." />
                </div>

                {auth && auth.user ? '' :
                  <>
                    <div className="mb-4">
                      <input required
                        className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                        defaultValue={auth && auth.user?.name}
                        onChange={(e) => setData('name', e.target.value)}
                        type="text" placeholder="Enter nickname.. "
                      />
                    </div>

                    <div className="mb-4">
                      <input required  disabled={auth && auth.user?.email ? true : false}
                        className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                        defaultValue={auth && auth.user?.email}
                        onChange={(e) => setData('email', e.target.value)}
                        type="email" placeholder="Enter email.. " />
                      <p className='text-sm text-gray-600 mt-1 ' >Your email address is kept private and will not be shown to anyone.</p>
                    </div>
                  </>
                }
              <div className='termselect mt-3 mb-3'>
                  <label htmlFor="keepanonymous">
                    <p className='text-[15px] text-gray-900 font-normal'>
                      <input className='w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 transition-all cursor-pointer' type="checkbox"
                      id="keepanonymous" name="keepanonymous"
                      value="keepanonymous"
                      onChange={(e) => setData("anonymous", e.target.checked ? 1 : 0 )}
                      ></input> Keep anonymous
                    </p>
                  </label>
                  <p className="text-gray-700 text-sm mt-1 mb-3" >Your personal email and name will be private.</p>
              </div>

              <CheckoutLegalTerms onAgreeChange={(checked) => {
                  setData('agree', checked);
                  setData('digital_waiver', checked);
              }} />

              {turnstileSiteKey ? (
                <div className="flex justify-center my-3">
                  <Turnstile
                    ref={turnstileRef}
                    size="normal"
                    theme="light"
                    onVerify={onVerify}
                  />
                </div>
              ) : null}
              </> : ''}

              {user?.role === 1 && card_capabilities === false && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[20px] relative mb-4"  >
                    <h2 className="font-bold w-full text-normal uppercase">Payments Disabled : </h2>
                    <span className="block sm:inline">This creator cannot accept payments at the moment.</span>
                </div>
              )}

              <button disabled={loading || (turnstileSiteKey && !verified) || (user?.role === 1 && card_capabilities === false)} onClick={send} className={`items-center px-4  shadow-black
                rounded-[30px]  btn-pink md justify-center btn-shadow !font-normal
                ease-in-out duration-150 flex button text-center w-full
                  mx-auto  ${(amount > 0 && data.agree && data.digital_waiver && !(turnstileSiteKey && !verified) && !loading && !(user?.role === 1 && card_capabilities === false)) ? '' :'disabled'} font-gulfs`}
                > {loading ? "Processing..." : 'Support Me'} </button>

              <div className='securestripe text-center mt-3' >
                🔒 Secured via <b>Stripe</b>
              </div>
            </div>
        </div>
      </div>
      <Popup
        size="md"
        action={showStepUp}
        space="p-0"
        modalclass="pinkmodal"
        classes="hidden"
      >
        <div className="!rounded-none p-6">
          <h2 className="text-xl font-bold mb-2 text-center">{stepUpUi?.title || 'Confirm Your Payment'}</h2>
          <p className="text-gray-600 mb-6 text-center">
            {stepUpUi?.body || 'For your security, please confirm this payment.'}
          </p>
          <form onSubmit={handleVerifyStepUp}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP Code (Check your email)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                placeholder="e.g. 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type 'CONFIRM' to proceed</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                placeholder="CONFIRM"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowStepUp(false)}
                className="w-full main-button b"
              > Cancel
              </button>
              <button
                type="submit"
                disabled={verifyingOtp || !otpCode || typedConfirmation.toUpperCase() !== 'CONFIRM'}
                className={`w-full main-button p ${(!otpCode || typedConfirmation.toUpperCase() !== 'CONFIRM' || verifyingOtp) ? 'disabled' : ''}`}>
                {verifyingOtp ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
                    
                    {isWebAuthnSupported() && hasPasskey && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <button
                                type="button"
                                onClick={handlePasskeyStepUp}
                                disabled={passkeyLoading || (typeof verifyingOtp !== 'undefined' ? verifyingOtp : false)}
                                className="relative flex flex-row justify-center items-center text-base px-4 py-[10px] focus:outline-none text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 rounded-full transition-all w-full max-w-[260px] mx-auto disabled:opacity-50"
                            >
                                {passkeyLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking device...
                                    </>
                                ) : "Use Face ID / Fingerprint"}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Bypass OTP by verifying your identity with a saved passkey.
                            </p>
                        </div>
                    )}

        </div>
      </Popup>
  </>
}
