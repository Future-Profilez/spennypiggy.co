import React from 'react'
import { useAlerts } from "@/Components/Alerts";
import ProgressBar from 'react-bootstrap/ProgressBar';
import axios from "axios";
import { useState } from 'react';

export default function AdultScan({fileuid, content, onScan, classes, type}) {

  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [scanning, setScanning] = useState(false);

  const checkAdult = async (uuid) => {
     if(uuid && type !== 'video'){
        setScanning(true);
        axios.get(`check-adult-content/${uuid}`,).then(resp => {
           setScanning(false);
           if(resp.data.status){
              onScan();
           } else { 
              errorAlert(resp.data.msg);
           }
        }).catch(_err => {
           console.error("error", _err);
           setScanning(false);
        });
     } else { 
      onScan();
     }
  } 

  return (
    <>
      {scanning ? <div className='scanning rounded bg-light shadow-sm border p-3 my-2 mb-4' >
        <ProgressBar animated now={100} />
        <p className='text-center mt-2' >Adult content scanning...</p>
      </div> : '' } 
      <div className={`${classes}`} onClick={()=>checkAdult(fileuid)} >
        {content}
      </div>
    </>
  )
}
