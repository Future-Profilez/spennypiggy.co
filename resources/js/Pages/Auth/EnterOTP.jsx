import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";
import { useRef } from "react";
import Popup from "@/Components/Popup";
import { useEffect } from "react";
import { useAlerts } from "@/Components/Alerts";
 
export default function EnterOTP({user, action}) {

   const [open, setOpen] = useState(false);
   useEffect(() => {
      if(action === 'open'){
         setOpen(true);
      } else { 
         setOpen();
      }
   }, [action]);
   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const { data, setData, post, processing, errors, reset } = useForm({
      email: "",
   });

   const inputRefs = useRef([]);
   const [backup, setBackup] = useState(false);
   const [bCode, setBcode] = useState("");
   const [otp, setOtp] = useState(new Array(6).fill(""));

    const enterBCode = (e) => {
        setBcode(e.target.value);
        setOtp(new Array(6).fill(""));
    };
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

    const [loading, setLoading] = useState(false);
   const verify = (e) => {
      e.preventDefault();
      setLoading(true);
         post(route('verify2FA', {
            "otp":otp.join(""),  
            "backup_code": bCode || '',
            'email': user.email,
            'password': user.password,
         }),{
         preserveScroll: true,
         onSuccess: (resp) => {
            console.log("resp",resp)
            setLoading(false);
            if(resp?.props?.flash?.error){
               errorAlert(resp?.props?.flash?.error || "Something went wrong.");
            }
            // reset();
         },
         onError: (err) => {
            setLoading(false);
            console.log(err)
            Object.keys(err).map((key) => {
               errorAlert(err[key]);
            });
         }
      });
   };

   

    return (
        <>
         <Popup space="2 md:p-4" action={open}
         modalclass=""
         text={<></>} >
            <div class=" text-center py-10">
               <header class="mb-8">
                  <h1 class="text-2xl font-bold mb-1">OTP Verification</h1>
                  <p class="text-[15px] text-slate-500 max-w-[300px] m-auto ">Enter the 6-digit verification code from your authenticator app.</p>
               </header>
               <form  >
                  {backup ? <>
                     <div class="flex items-center justify-center gap-3">
                           <input type="text" class="w-full  text-center text-md text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded-xl p-3 max-w-[85%] outline-none focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                              pattern="\d*" onChange={enterBCode} placeholder="Enter backup code..." />
                     </div>
                     <div class="max-w-[260px] mx-auto mt-4">
                           <button  onClick={verify} className="pinkbg-i text-white px-3 py-2 rounded-xl">{ processing ? "processing..." : "Verify"}</button>
                     </div>
                     <div class="text-sm text-slate-500 mt-4"> Don't have backup code ? <button class="font-medium text-indigo-500 hover:text-indigo-600" onClick={()=>setBackup(false)}  >Use Authenticator app</button></div>
                  </>
                     : 
                     <> <div class="flex items-center justify-center ">
                           {otp.map((data, index) => (
                                 <input
                                    key={index}
                                    type="text"
                                    className="border-gray-300  text-center bg-gray-200 text-black rounded-xl w-full  mx-1 max-w-[40px] min-h-[40px] otp-input  px-1 py-1 "
                                    maxLength="1"
                                    value={data}
                                    onChange={(e) => handleChange(e.target,index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    ref={(el) =>(inputRefs.current[index] = el)}
                                 />
                              ))}
                        </div>
                        <div class="max-w-[260px] mx-auto mt-4">
                              <button disabled={loading} onClick={verify} className="pinkbg-i text-white px-3 py-2 rounded-xl">{ loading ? "processing..." : "Verify"}</button>
                        </div>
                        <div class="text-sm text-slate-500 mt-4"> Don't have phone ? <button class="font-medium text-indigo-500 hover:text-indigo-600" onClick={()=>setBackup(true)} >Use Backup code</button></div>
                     </>
                  }
               </form>
            </div>
         </Popup>
        </>
    );
}
