import React from 'react';
import { creatorIdOf } from "@/utils/pricing";

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
import PaymentMethodSelector from "@/Components/PaymentMethodSelector";
import { PayButton, OrderContextCard } from "@/Components/Checkout/SummaryReceipt";
import { fieldClass } from "@/Components/Checkout/FormKit";
import { riskMessageBody, riskMessageTitle, redirectToLoginWithMessage, GUEST_VALUE_THRESHOLD_GBP } from '@/constants/riskMessages';

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
    message: 'Access to my supporter-only posts 💖',
    anonymous: 0,
    amount: amount,
    digital_waiver: false,
    agree: false,
    currency: user?.default_currency || 'GBP', // Default to creator currency
    cf_turnstile_response: "",
    device_id: deviceid,
    payment_method: 'card',
  });

  const customAmountTag = (e) => {
    setAmount(e);
    setdefaultAmount(e);
    setselectegTag(e);
    setData("currency", user?.default_currency || 'GBP');
  }

  const customAmount = (e) => {
    setAmount(e.target.value);
    setdefaultAmount(e.target.value);
    // Same currency as the preset chips (the CREATOR's currency) — previously the
    // custom input charged in global_currency, so the charge currency depended on
    // which input path the buyer used. Range (£4.99–£500 equiv) is validated in send().
    setData("currency", user?.default_currency || 'GBP');
  }

  useEffect(()=>{
    setData("amount", amount);
  },[amount, setData]);

  const [loading, setLoading] = useState(false);
  const [previewPrices, setPreviewPrices] = useState(null);
  const [showStepUp, setShowStepUp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (tipRes.data && tipRes.data.card_verification_required) {
      errorAlert(tipRes.data.msg);
      router.visit('/gifter-card-verification');
      return;
    }
    if (tipRes.data && (tipRes.data.message === "Login required" || tipRes.data.code === "AUTH_REQUIRED")) {
      const msg = tipRes.data.msg || riskMessageBody("GUEST_ACCOUNT_REQUIRED");
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
    // Re-entrancy guard: a second tap before the disabled re-render must not
    // fire a second checkout session.
    if (loading) return false;
    if(data.email === "" || data.name === "" ){
        errorAlert("Please enter all the required details.");
        return false;
    }
    // Client-side mirror of the server's £4.99–£500 GBP-equivalent rule — the
    // old flow let any positive amount through and failed only after submit.
    const amountGbp = usdToGbp(parseFloat(data.amount || 0), data.currency);
    if (!data.amount || isNaN(amountGbp) || amountGbp < 4.99) {
        errorAlert("The minimum amount is £4.99 (or equivalent).");
        return false;
    }
    if (amountGbp > 500) {
        errorAlert("The maximum amount is £500 (or equivalent).");
        return false;
    }
    if (card_capabilities === false) {
        errorAlert(riskMessageBody("CREATOR_UNAVAILABLE"));
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
    // ⚠️ The threshold is never printed — see constants/riskMessages.js.
    if(auth && !auth.user && usdToGbp(data.amount) > GUEST_VALUE_THRESHOLD_GBP){
        errorAlert(riskMessageBody("GUEST_ACCOUNT_REQUIRED_VALUE"));
        redirectToLoginWithMessage("GUEST_ACCOUNT_REQUIRED_VALUE");
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
            <h2 className='p-3 text-[#FF007F] font-anton uppercase text-2xl mb-1 mt-4 pr-5'>Become a Supporter</h2>
            <div className='border-t border-gray-200 p-3 pt-3' >

              <OrderContextCard
                className="mb-4"
                image={user?.avatar_url}
                typeBadge="Piggy Bank"
                itemTitle="Support this creator"
                itemSub="A one-time content unlock — choose any amount"
                payingLabel="You're supporting"
                creatorName={user?.name}
                creatorUsername={user?.username}
                creatorAvatar={user?.avatar_url}
                whatYouGet={[
                  "Access to this creator's supporter-only content",
                  "A supporter confirmation for your records",
                  "A one-time payment — nothing recurring",
                ]}
              />

              {/* <div className='tip-counter flex items-center justify-between mb-3' >
                  <p className='tipheading flex items-center' >
                    <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} />
                  {defaultAmount} &nbsp;Each</p>
                  <div className='incresecounter flex items-center' >
                        <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px]  border  rounded-box-sm   ' onClick={decresevalue} >-</button>
                        <div className='border px-3 py-2 rounded-box-sm    mx-1' >{tipQuantity}</div>
                        <button className='pinkbg text-white min-w-[40px] px-2 font-large min-h-[40px] border  rounded-box-sm   ' onClick={incresevalue} >+</button>
                  </div>
              </div> */}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2 mt-2">
                  <button className={`border-black ${ selectegTag == 25 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(25)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(25, user?.default_currency || "GBP")}</button>
                  <button className={`border-black ${ selectegTag == 30 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(30)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(30, user?.default_currency || "GBP")}</button>
                  <button className={`border-black ${ selectegTag == 35 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(35)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(35, user?.default_currency || "GBP")}</button>
                  <button className={`border-black ${ selectegTag == 40 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center hidden md:flex items-center !text-[16px] !font-bold `} onClick={()=>customAmountTag(40)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(40, user?.default_currency || "GBP")}</button>
                  <button className={`border-black ${ selectegTag == 45 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(45)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(45, user?.default_currency || "GBP")}</button>
                  <button className={`border-black ${ selectegTag == 50 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(50)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(50, user?.default_currency || "GBP")}</button>
                  <button className={`border-black ${ selectegTag == 75 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(75)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(75, user?.default_currency || "GBP")}</button>
                  <button className={`border-black ${ selectegTag == 85 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(85)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(85, user?.default_currency || "GBP")}</button>
                  <button className={`border-black ${ selectegTag == 99 ? 'pinkbg text-black' : 'bg-gray-200'} rounded-box-sm min-h-[44px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`} onClick={()=>customAmountTag(99)}  > <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} /> {formatMultiPrice(99, user?.default_currency || "GBP")}</button>
              </div>

              <p className="!my-4 text-[14px]  text-black/60 font-normal mt-1 leading-tight">
                *Includes platform and payment processing fees. <br /> You will be charged in {user?.default_currency || 'GBP'}. Amounts shown in {global_currency || user?.default_currency || 'GBP'} are estimates.
              </p>


                {selectegTag === 'custom' ? <div className="mb-4 ">
                    <div className="relative currency-wrapper " >
                        <span className="currency-tag">{global_currency || 'GBP'}</span>
                        <input className={fieldClass} value={amount}
                        onChange={customAmount}
                        type="number" placeholder="Enter amount.. " />
                    </div>
                </div> : ''}

              {amount > 0 ? <>
                <div className="mb-3"> 
                  <textarea className={fieldClass} defaultValue={'Access to my supporter-only posts 💖'}
                  onChange={(e) => setData('message', e.target.value)}
                  placeholder="Write a short note." />
                </div>

                {auth && auth.user ? '' :
                  <>
                    <div className="mb-4">
                      <input required
                        className={fieldClass}
                        defaultValue={auth && auth.user?.name}
                        onChange={(e) => setData('name', e.target.value)}
                        type="text" placeholder="Enter nickname.. "
                      />
                    </div>

                    <div className="mb-4">
                      <input required  disabled={auth && auth.user?.email ? true : false}
                        className={fieldClass}
                        defaultValue={auth && auth.user?.email}
                        onChange={(e) => setData('email', e.target.value)}
                        type="email" placeholder="Enter email.. " />
                      <p className='text-sm text-black/60 mt-1 ' >Your email address is kept private and will not be shown to anyone.</p>
                    </div>
                  </>
                }
              <div className='termselect mt-3 mb-3'>
                  <label htmlFor="keepanonymous">
                    <p className='text-[15px] text-black font-normal'>
                      <input className='w-5 h-5 accent-[#FF007F] border-2 border-black/15 rounded-[6px] cursor-pointer' type="checkbox"
                      id="keepanonymous" name="keepanonymous"
                      value="keepanonymous"
                      onChange={(e) => setData("anonymous", e.target.checked ? 1 : 0 )}
                      ></input> Keep anonymous
                    </p>
                  </label>
                  <p className="text-black/80 text-sm mt-1 mb-3" >Your personal email and name will be private.</p>
              </div>

              <PaymentMethodSelector
                  amount={parseFloat(data.amount) || 0}
                  currency={user?.default_currency || 'GBP'}
                  email={data.email || auth?.user?.email}
                  creatorId={creatorIdOf(user) ?? user?.id}
                  value={data.payment_method}
                  onChange={(m) => setData('payment_method', m)}
                  onPrices={setPreviewPrices}
                  className="mb-4"
              />

              {/* The grossed-up figure the buyer is actually charged — before this
                  the first time they saw the real amount was on Stripe. */}
              {parseFloat(data.amount) > 0 && (
                <div className="flex items-center justify-between border-gray-300 border rounded-box-sm px-4 py-3 mb-4">
                  <span className="text-sm font-bold text-black/80">You pay</span>
                  <span className="font-black text-lg">
                    {previewPrices
                      ? formatMultiPrice(
                          data.payment_method === 'bank' && previewPrices.bank != null
                            ? previewPrices.bank
                            : previewPrices.card,
                          user?.default_currency || 'GBP',
                        )
                      : 'Calculating…'}
                  </span>
                </div>
              )}

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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-box-sm relative mb-4"  >
                    <h2 className="font-bold w-full text-normal">{riskMessageTitle("CREATOR_UNAVAILABLE")}</h2>
                    <span className="block sm:inline">{riskMessageBody("CREATOR_UNAVAILABLE")}</span>
                </div>
              )}

              <PayButton
                label="Become a Supporter"
                processing={loading}
                disabled={!data.agree || !data.digital_waiver || (turnstileSiteKey && !verified) || (user?.role === 1 && card_capabilities === false)}
                onClick={() => setShowConfirm(true)}
              />

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
          <p className="text-black/60 mb-6 text-center">
            {stepUpUi?.body || 'For your security, please confirm this payment.'}
          </p>
          <form onSubmit={handleVerifyStepUp}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black/80 mb-1">Enter OTP Code (Check your email)</label>
              <input
                type="text"
                className={fieldClass}
                placeholder="e.g. 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-black/80 mb-1">Type 'CONFIRM' to proceed</label>
              <input
                type="text"
                className={fieldClass}
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
                className="border-2 border-black w-full main-button !bg-white !text-black !border-black"
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
                                className="relative flex flex-row justify-center items-center text-base px-4 py-[10px] focus:outline-none text-black/60 border border-gray-300 bg-white hover:bg-gray-50 rounded-full transition-all w-full max-w-[260px] mx-auto disabled:opacity-50"
                            >
                                {passkeyLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#FF007F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking device...
                                    </>
                                ) : "Use Face ID / Fingerprint"}
                            </button>
                            <p className="text-xs text-black/60 text-center mt-2">
                                Bypass OTP by verifying your identity with a saved passkey.
                            </p>
                        </div>
                    )}

        </div>
      </Popup>

      <Popup
        size="md"
        action={showConfirm}
        space="p-0"
        modalclass="pinkmodal"
        classes="hidden"
      >
        <div className="!rounded-none p-6">
          <h2 className="text-xl font-bold mb-3 text-center">You're becoming a Supporter</h2>
          <p className="text-black/80 mb-3">
            {user?.name || 'This creator'} is offering Supporter access in return for this payment. As a Supporter you'll get access to their supporter-only posts.
          </p>
          <p className="text-black font-semibold mb-3">
            One-time payment — 30 days of Supporter access. Does not auto-renew.
          </p>
          <p className="text-black/60 text-sm mb-6">
            You're purchasing access to this creator's content, not making a gift. Platform terms apply to fulfilment and refunds.
          </p>
          {/* ⚠️ Cancel is restored and must stay. It had been commented out, leaving a
              payment CONFIRMATION whose only control was "pay" — the dialog's own X is a
              dismissal, not a decision, and on the last screen before a charge those are
              not the same affordance. `flex-col-reverse` puts the primary action nearest
              the thumb on a phone while keeping the conventional Cancel-then-confirm
              reading order on a wider screen. */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="w-full min-h-[44px] rounded-box-sm border-[3px] border-black bg-white px-5 py-3 font-bold text-black transition-colors duration-200 hover:bg-black/[0.04] active:bg-black/[0.08]"
            >
              Cancel
            </button>
            {/* The shared PayButton is the ONE definition of a pay control — this
                confirm-modal button is the one that actually calls send(), so it
                must look and behave like every other pay button on the platform.
                `processing` reproduces the old `disabled={loading}` + "Processing…"
                label in one prop; PayButton forwards the event, which send() needs. */}
            <PayButton
              label="Become a Supporter"
              processing={loading}
              onClick={(e) => { setShowConfirm(false); send(e); }}
            />
          </div>
        </div>
      </Popup>
  </>
}
