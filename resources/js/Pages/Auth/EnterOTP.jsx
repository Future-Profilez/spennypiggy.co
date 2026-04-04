import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";
import { useRef } from "react";
import Popup from "@/Components/Popup";
import { useEffect } from "react";
import { useAlerts } from "@/Components/Alerts";

export default function EnterOTP({user, action, onSuccess}) {

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
      axios.post(route('verify2FA'), {
         "otp":otp.join(""),
         "backup_code": bCode || '',
         'email': user.email,
         'password': user.password,
      })
      .then(resp => {
           setLoading(false);
           if (resp.data.status) {
               if (onSuccess) {
                   onSuccess(resp.data.redirect_url);
               } else if (resp.data.redirect_url) {
                   window.location.href = resp.data.redirect_url;
               }
           } else {
               errorAlert(resp.data.msg || "Something went wrong.");
           }
      })
      .catch(err => {
           setLoading(false);
           console.log(err);
           if (err.response && err.response.data && err.response.data.message) {
               errorAlert(err.response.data.message);
           } else {
               errorAlert("Something went wrong.");
           }
      });
   };



    return (
        <>
         <Popup space="2 md:p-4" action={open}
         modalclass=""
         text={<></>} >
            <div className=" text-center py-10">
               <header className="mb-8">
                  <h1 className="text-2xl font-bold mb-1">OTP Verification</h1>
                  <p className="text-[15px] text-slate-500 max-w-[300px] m-auto ">Enter the 6-digit verification code from your authenticator app.</p>
               </header>
               <form  >
                  {backup ? <>
                     <div className="flex items-center justify-center gap-3">
                           <input type="text" className="w-full  text-center text-md text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded-[30px] md:rounded-[40px]  p-3 max-w-[85%] outline-none focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                              pattern="\d*" onChange={enterBCode} placeholder="Enter backup code..." />
                     </div>
                     <div className="max-w-[260px] mx-auto mt-4">
                           <button  onClick={verify} className="pinkbg-i text-white px-3 py-2 rounded-[30px] md:rounded-[40px] ">{ processing ? "processing..." : "Verify"}</button>
                     </div>
                     <div className="text-sm text-slate-500 mt-4"> Don't have backup code ? <button className="font-medium text-indigo-500 hover:text-indigo-600" onClick={()=>setBackup(false)}  >Use Authenticator app</button></div>
                  </>
                     :
                     <> <div className="flex items-center justify-center  gap-1">
                           {otp.map((data, index) => (
                                 <input
                                    key={index}
                                    type="text"
                                    className="border-gray-300  text-center bg-gray-200 
                                    text-black rounded-[12px] 
                                    md:rounded-[15px]  w-full   text-xl font-bold
                                     max-w-[50px] min-h-[50px] otp-input  px-1 py-1 "
                                    maxLength="1"
                                    value={data}
                                    onChange={(e) => handleChange(e.target,index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    ref={(el) =>(inputRefs.current[index] = el)}
                                 />
                              ))}
                        </div>
                        <div className="max-w-[260px] mx-auto mt-4">
                              <button disabled={loading} onClick={verify} className="pinkbg-i text-white px-6 w-full py-3 my-3 rounded-[30px] md:rounded-[40px] ">{ loading ? "processing..." : "Verify & Login"}</button>
                        </div>
                        <div className="text-sm text-slate-500 mt-4"> Don't have phone ? <button className="font-medium text-indigo-500 hover:text-indigo-600" onClick={()=>setBackup(true)} >Use Backup code</button></div>
                     </>
                  }
               </form>
            </div>
         </Popup>
        </>
    );
}
