import * as LR from "@uploadcare/blocks";
import { useState } from "react";
import { useCallback, useEffect, useRef } from "react";
LR.registerBlocks(LR);
import { PACKAGE_VERSION } from "@uploadcare/blocks/env";

export default function GlobalUploader({ options, sendFile, clear, view, isUploading, type }) {
    
    // LR.FileUploaderRegular.shadowStyles = /* CSS */ `
    //   :host lr-simple-btn button {
    //     background-color: #f00;
    //   }
    // `;
    // LR.registerBlocks(LR);

    const [files, setFiles] = useState([]);
    const [checkIsUploading, setCheckIsUploading] = useState(false);
    const dataOutputRef = useRef();
    const handleUploaderEvent = useCallback((e) => {
        const { data } = e.detail;
        console.log('data', data);
        sendFile(data[0]);
        setFiles(data);
    },[]);
    
    const handleResetUploader = () => {
      if (dataOutputRef.current) {
          dataOutputRef.current.uploadCollection.clearAll();
          dataOutputRef.current.$['*modalActive'] = false;
      }
    }; 

    useEffect(() => {
        handleResetUploader();
    }, [clear]);

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
        
    </>
}
