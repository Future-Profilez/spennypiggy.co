import { useEffect, useState } from "react"
export default function VersionUpdate(){
   const [isUpdateAvailable, setisUpdateAvailable] = useState(false);
   const newVersion = '1.0.2';
   const updateApp = () => {
      if('caches' in window){
         caches.keys().then((names) => {
            names.forEach(name => {
               caches.delete(name);
            });
            localStorage.setItem('version', newVersion);
         });
         window.location.reload(true);
      }
   }
   useEffect(()=> {
      const v = typeof window !== 'undefined' ? localStorage.getItem('version') : null;
      if(v === undefined || v == '' || v != newVersion){
         setisUpdateAvailable(true);
      } else {
         setisUpdateAvailable(false);
      }
      if('caches' in window){
         caches.keys().then((names) => {
            names.forEach(name => {
               caches.delete(name);
            });
         });
      }
   }, []);

   return <>
   <style jsx={"true"}>{`.newVer{padding:15px;border-radius:10px;margin-bottom:20px;}
   .newVer p{color:var(--white);margin:0;}
   button.updatever{background:transparent;border:0;color:#ff6aff;font-weight:600;}
   .newVer p{color:transparent;background:linear-gradient(to left,#e3e780,#ff007b);-webkit-background-clip:text;font-size:17px;-webkit-animation:gradient-1 2s linear infinite;-moz-animation:gradient-1 2s linear infinite;-o-animation:gradient-1 2s linear infinite;animation:gradient-1 2s linear infinite;}
   .newVer{position:relative;z-index:1;}
  `}</style>
   {isUpdateAvailable
   ?
      <div className="newVer box !rounded-[20px] !p-4 flex justify-between mb-3 bg-white bg-[#ff6b6b] !border-black  " >
          <p className="pe-3" >New version 1.1.0 of app is available.</p>
          <button className="updatever uppercase me-3 hover:text-black" onClick={updateApp}>Update</button>
      </div>
   : ''
   }
   </>
}
