import React from 'react'
import { useAlerts } from "@/Components/Alerts";
import ProgressBar from 'react-bootstrap/ProgressBar';
import axios from "axios";
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AdultScan({fileuid, content, onScan, classes, type, scan_classes}) {

  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [scanning, setScanning] = useState(false);
  const checkAdult = async () => {
      try{
         if(fileuid && type !== 'video'){
            setScanning(true);
            axios.get(`check-adult-content/${fileuid}`,).then(resp => {
               setTimeout(()=>{
                  setScanning(false);
               },2000);
               if(resp.data.status){
                  onScan();
               } else { 
                  errorAlert(resp.data.msg);
               }
            }).catch(_err => {
               console.error("error", _err);
               setTimeout(()=>{
                  setScanning(false);
               },2000);
            });
         } else { 
          onScan();
         }
      } catch(err) {
         toast.error("Failed to scan please try again.")
      }
  } 

  return (
    <>
      {scanning ? 
      <div className={`scanning rounded bg-light shadow-sm border p-3 my-2 mb-4 ${scan_classes}`} >
        <ProgressBar animated now={100} />
        <p className='text-center mt-2' >Adult content scanning...</p>
      </div> : 
      <div className={`${classes}`} onClick={checkAdult} >
        {content}
      </div> 
      } 

    </>
  )
}
