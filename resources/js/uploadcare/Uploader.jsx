import * as LR from "@uploadcare/blocks";
import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { PACKAGE_VERSION } from "@uploadcare/blocks/env";
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useAlerts } from "@/Components/Alerts";
import axios from "axios"; 
LR.registerBlocks(LR);

const GlobalUploader = forwardRef(({ options, sendFile, accept, view, isUploading, type, ctxName = 'default', imgonly = true }, ref) => {
  const { successAlert, errorAlert } = useAlerts();
  const [files, setFiles] = useState([]);
  const [checkIsUploading, setCheckIsUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const dataOutputRef = useRef();
  const controller = useRef(new AbortController());

  const handleResetUploader = () => {
    const ctxProvider = dataOutputRef.current;
    if (!ctxProvider) return;
    ctxProvider.uploadCollection.clearAll();
  };

  useImperativeHandle(ref, () => ({
    reset: () => handleResetUploader(),
  }));

   

  useEffect(() => {
    const finishHandler = e => {
      const data = e.detail.data; // final files array
      console.log('Upload finished', data);
      checkAdult(data);
      // sendFile(data[0]);
      // setFiles(data);
      handleResetUploader();
    };
    window.addEventListener('LR_UPLOAD_FINISH', finishHandler);
    return () => window.removeEventListener('LR_UPLOAD_FINISH', finishHandler);
  }, []);


  useEffect(() => {
    window.addEventListener('LR_UPLOAD_START', () => {
      setCheckIsUploading(true);
      isUploading && isUploading(true);
    });

    window.addEventListener('LR_UPLOAD_FINISH', () => {
      setCheckIsUploading(false);
      isUploading && isUploading(false);
    });

    window.addEventListener('LR_REMOVE', () => {
      setCheckIsUploading(false);
      isUploading && isUploading(false);
    });
  }, []);

  const checkAdult = async (d) => {
    const f = d[0];
    const type = f?.contentInfo?.mime?.type;
    const fileuid = f?.uuid;

    if (fileuid && type !== 'video') {
      setScanning(true);
      try {
        const resp = await axios.get(`/scanning/check-adult-content/${fileuid}`);
        setTimeout(() => setScanning(false), 100);

        if (resp.data.status) {
          successAlert("File has been scanned !!");
          sendFile(f);
          setFiles(d);
          controller.current.abort();
        } else {
          errorAlert(resp.data.msg);
          handleResetUploader();
        }
      } catch (err) {
        console.error("error", err);
        setTimeout(() => setScanning(false), 2000);
      }
    } else {
      sendFile(f);
      setFiles(d);
    }
  };

  const renderUploader = () => {
    const commonProps = {
      "ctx-name": ctxName,
      "css-src": `https://cdn.jsdelivr.net/npm/@uploadcare/blocks@${PACKAGE_VERSION}/web/lr-file-uploader-${type}.min.css`
    };

    const DataOutput = (
      <lr-data-output
        use-event
        ref={dataOutputRef}
        hidden
        use-template
        class={options}
      />
    );

    if (type === 'minimal') return <lr-file-uploader-minimal {...commonProps}>{DataOutput}</lr-file-uploader-minimal>;
    if (type === 'inline') return <lr-file-uploader-inline {...commonProps}>{DataOutput}</lr-file-uploader-inline>;
    if (type === 'regular') return <lr-file-uploader-regular {...commonProps}>{DataOutput}</lr-file-uploader-regular>;
    return null;
  };

  return (
    <>
      <lr-config
        ctx-name={ctxName}
        pubkey="af0e7b54d1432d098e25"
        multiple={false}
        darkmode={false}
        thumb-size={500} inputAcceptTypes="image/*,video/mp4,video/webm"
        confirm-upload={false}
        store
        accept={"image/*,video/*"}
        preview-step
        camera-mirror={false}
        source-list="local,url,camera,dropbox"
        done-activity={false}
        show-empty-list={false}
        img-only={imgonly}
        remove-copyright
        max-concurrent-requests={4}
        multipart-max-attempts={3}
      />
       
      {view && (
        <div className={'uploadcare-view mb-0'}>
          {files.map((file) => (
            <div className="uploadcare-view-wrap" key={file.uuid}>
              {file.isImage ? (
                <img
                  className="rounded border"
                  width="25%"
                  alt="Preview"
                  src={`https://ucarecdn.com/${file.uuid}/${file.cdnUrlModifiers || ""}`}
                />
              ) : (
                <video playsInline controls className="rounded" src={`https://ucarecdn.com/${file.uuid}/`} alt="Preview" />
              )}
            </div>
          ))}
        </div>
      )}

      {renderUploader()}

      {scanning && (
        <div className={`scanning rounded bg-light shadow-sm border p-3 my-2 mb-4`}>
          <ProgressBar animated now={100} />
          <p className='text-center mt-2'>Adult content scanning...</p>
        </div>
      )}
    </>
  );
});

export default GlobalUploader;
