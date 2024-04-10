import * as LR from "@uploadcare/blocks";
import { useState } from "react";
import { useCallback, useEffect, useRef } from "react";
LR.registerBlocks(LR);
import { PACKAGE_VERSION } from "@uploadcare/blocks/env";
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useAlerts } from "@/Components/Alerts";
import axios from "axios";
import { forwardRef , useImperativeHandle } from "react";

const GlobalUploader = forwardRef(({ options, sendFile, clear, view, isUploading, type }, ref) => {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [files, setFiles] = useState([]);
    const [checkIsUploading, setCheckIsUploading] = useState(false);
    const dataOutputRef = useRef();

    const handleResetUploader = () => {
      const ctxProvider = dataOutputRef.current;
      if (!ctxProvider) return;
      const resetUploaderState = () => dataOutputRef.current?.uploadCollection.clearAll();
      resetUploaderState();
    }; 

    useImperativeHandle(ref, () => ({
        reset: () => {
          handleResetUploader();
        }
    }));

    const handleUploaderEvent = useCallback((e) => {
        const { data } = e.detail;
        checkAdult(data);
    },[]);
  
    useEffect(() => {
        const el = dataOutputRef && dataOutputRef.current;
        el && el.addEventListener("lr-data-output", handleUploaderEvent);
        return () => { el && el.removeEventListener("lr-data-output", handleUploaderEvent); };
    }, [handleUploaderEvent]);

    useEffect(()=>{ 
        window.addEventListener('LR_UPLOAD_START', (e) => {
          if (e.detail.ctx) {
            setCheckIsUploading(true);
            isUploading && isUploading(checkIsUploading);
          }  
        });

        window.addEventListener('LR_UPLOAD_FINISH', (e) => {
          setCheckIsUploading(false);
          isUploading && isUploading(checkIsUploading);
        });

        window.addEventListener('LR_REMOVE', (e) => {
          setCheckIsUploading(false);
          isUploading && isUploading(checkIsUploading);
        });
    }, []); 

    const [scanning, setScanning] = useState(false);
    const controller = new AbortController();
    const { signal } = controller;

    const checkAdult = async (d) => {
      const f = d[0];
      const type= f && f.contentInfo && f.contentInfo.mime && f.contentInfo.mime.type; 
      const fileuid= f && f.uuid;
      if(fileuid && type !== 'video'){
          setScanning(true);
          axios.get(`check-adult-content/${fileuid}`, {signal}).then(resp => {
            setTimeout(()=>{
                setScanning(false);
            },100);
            if(resp.data.status){
              successAlert("File has been scanned !!");
              sendFile(d[0] );
              setFiles(d); 
              controller.abort()
            } else { 
                errorAlert(resp.data.msg);
                handleResetUploader();
            }
          }).catch(_err => {
            console.error("error", _err);
            setTimeout(()=>{
                setScanning(false);
            },2000);
          });
      } else { 
        sendFile(d[0]);
        setFiles(d); 
      }
    } 


    return <>
          {view && 
            <div className={'uploadcare-view mb-0'}>
              {files.map((file) => (
                <div className="uploadcare-view-wrap"  >
                {file.isImage ? <>
                    <img
                      className="rounded border"
                      key={file.uuid} width="25%" alt="Preview"
                      src={`https://ucarecdn.com/${file.uuid}/${file.cdnUrlModifiers || ""}`}
                    />
                  </> 
                  : 
                  <video playsInline controls
                    className="rounded"
                    key={file.uuid}
                    src={`https://ucarecdn.com/${file.uuid}/`}
                    alt="Preview"
                  />
                }
                </div>
              ))}
            </div>
          }

          {type =='minimal' ?  
              <lr-file-uploader-minimal  
              class={options}  
              css-src={`https://cdn.jsdelivr.net/npm/@uploadcare/blocks@${PACKAGE_VERSION}/web/lr-file-uploader-minimal.min.css`}>
                <lr-data-output
                    use-event ref={dataOutputRef}
                    hidden use-template
                    class={options}  
                    onEvent={handleUploaderEvent}>
                </lr-data-output>
              </lr-file-uploader-minimal>  
          : ''}

          {type =='inline' ? 
            <lr-file-uploader-inline  
            class={options}  
            css-src={`https://cdn.jsdelivr.net/npm/@uploadcare/blocks@${PACKAGE_VERSION}/web/lr-file-uploader-inline.min.css`}>
              <lr-data-output
                use-event ref={dataOutputRef}
                hidden use-template
                class={options}  
                onEvent={handleUploaderEvent}>
              </lr-data-output>
            </lr-file-uploader-inline>  
          : ''}

          {type =='regular' ? 
            <lr-file-uploader-regular  cropPreset="1:1"
            class={options}  
            css-src={`https://cdn.jsdelivr.net/npm/@uploadcare/blocks@${PACKAGE_VERSION}/web/lr-file-uploader-regular.min.css`}>
              <lr-data-output
                use-event ref={dataOutputRef}
                hidden use-template
                class={options}  
                onEvent={handleUploaderEvent}>
              </lr-data-output>
            </lr-file-uploader-regular> 
          : ''}

          {scanning ? 
            <div className={`scanning rounded bg-light shadow-sm border p-3 my-2 mb-4`} >
              <ProgressBar animated now={100} />
              <p className='text-center mt-2' >Adult content scanning...</p>
            </div> : '' 
          } 

    </>
});

export default GlobalUploader;