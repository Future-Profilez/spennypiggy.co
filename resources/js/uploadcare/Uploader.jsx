import * as LR from "@uploadcare/blocks";
import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { PACKAGE_VERSION } from "@uploadcare/blocks/env";
import CustomProgressBar from "@/Components/CustomProgressBar";
import { useAlerts } from "@/Components/Alerts";
import axios from "axios"; 
LR.registerBlocks(LR);

const GlobalUploader = forwardRef(({ options, sendFile, accept, view, isUploading, type, ctxName = 'default', imgonly = true }, ref) => {
  const { successAlert, errorAlert } = useAlerts();
  const [files, setFiles] = useState([]);
  const [checkIsUploading, setCheckIsUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const dataOutputRef = useRef();
  const controller = useRef(new AbortController());

  const handleResetUploader = () => {
    const ctxProvider = dataOutputRef.current;
    if (!ctxProvider) return;
    ctxProvider.uploadCollection.clearAll();
    // Reset progress states
    setUploadProgress(0);
    setTimeRemaining('');
    setUploadStartTime(null);
  };

  useImperativeHandle(ref, () => ({
    reset: () => handleResetUploader(),
  }));

  // Calculate time remaining based on upload progress
  const calculateTimeRemaining = (progress, startTime) => {
    if (!startTime || progress <= 0) return '';
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const progressPercent = progress / 100;
    
    if (progressPercent >= 1) return 'Complete';
    
    const estimatedTotalTime = elapsedTime / progressPercent;
    const remainingTime = estimatedTotalTime - elapsedTime;
    
    if (remainingTime <= 0) return 'Almost done';
    
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m${seconds.toString().padStart(2, '0')}s Remaining`;
    } else {
      return `${seconds}s Remaining`;
    }
  };

   

  useEffect(() => {
    const finishHandler = e => {
      // Check if this event is for our specific context
      const eventCtx = e.detail?.ctx || e.target?.getAttribute?.('ctx-name');
      if (eventCtx && eventCtx !== ctxName) return;
      
      const data = e.detail.data; // final files array
      checkAdult(data);
      // sendFile(data[0]);
      // setFiles(data);
      // handleResetUploader();
    };
    
    const startHandler = e => {
      // Check if this event is for our specific context
      const eventCtx = e.detail?.ctx || e.target?.getAttribute?.('ctx-name');
      if (eventCtx && eventCtx !== ctxName) return;
      
      setCheckIsUploading(true);
      setUploadStartTime(Date.now());
      setUploadProgress(0);
      setTimeRemaining('Calculating...');
      isUploading && isUploading(true);
    };
    
    const progressHandler = e => {
      // Check if this event is for our specific context
      const eventCtx = e.detail?.ctx || e.target?.getAttribute?.('ctx-name');
      if (eventCtx && eventCtx !== ctxName) return;
      
      const progress = e.detail?.uploadProgress || 0;
      setUploadProgress(progress);
      
      if (uploadStartTime) {
        const timeRemainingText = calculateTimeRemaining(progress, uploadStartTime);
        setTimeRemaining(timeRemainingText);
      }
    };
    
    const finishGlobalHandler = () => {
      setCheckIsUploading(false);
      setUploadProgress(100);
      setTimeRemaining('Complete');
      isUploading && isUploading(false);
    };
    
    const removeHandler = () => {
      setCheckIsUploading(false);
      isUploading && isUploading(false);
      handleResetUploader();
    };
    
    window.addEventListener('LR_UPLOAD_FINISH', finishHandler);
    window.addEventListener('LR_UPLOAD_START', startHandler);
    window.addEventListener('LR_UPLOAD_PROGRESS', progressHandler);
    window.addEventListener('LR_UPLOAD_FINISH', finishGlobalHandler);
    window.addEventListener('LR_REMOVE', removeHandler);
    
    return () => {
      window.removeEventListener('LR_UPLOAD_FINISH', finishHandler);
      window.removeEventListener('LR_UPLOAD_START', startHandler);
      window.removeEventListener('LR_UPLOAD_PROGRESS', progressHandler);
      window.removeEventListener('LR_UPLOAD_FINISH', finishGlobalHandler);
      window.removeEventListener('LR_REMOVE', removeHandler);
    };
  }, [ctxName, uploadStartTime]);

  const checkAdult = async (d) => {
    const f = d[0];
    const type = f?.contentInfo?.mime?.type;
    const fileuid = f?.uuid;
    
    // Extract complete file metadata
    const fileMetadata = {
      uuid: fileuid,
      mimeType: f?.contentInfo?.mime?.type || '',
      mimeSubtype: f?.contentInfo?.mime?.subtype || '',
      name: f?.originalFilename || f?.name || 'File',
      size: f?.size || 0,
      isImage: f?.isImage || false,
      isVideo: (f?.contentInfo?.mime?.type === 'video') || false,
      isAudio: (f?.contentInfo?.mime?.type === 'audio') || false,
      url: f?.cdnUrl || `https://ucarecdn.com/${fileuid}/`
    };

    if (fileuid && type !== 'video') {
      setScanning(true);
      try {
        const resp = await axios.get(`/scanning/check-adult-content/${fileuid}`);
        setTimeout(() => setScanning(false), 100);

        if (resp.data.status) {
          successAlert("File has been scanned !!");
          sendFile(fileMetadata); // Pass the full metadata
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
      sendFile(fileMetadata); // Pass the full metadata
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
        className={options}
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
        thumb-size={500} inputAcceptTypes={accept || "image/*,video/mp4,video/webm"}
        confirm-upload={false}
        store
        accept={accept || "image/*,video/*"}
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
          <CustomProgressBar animated now={100} />
          <p className='text-center mt-2'>Adult content scanning...</p>
        </div>
      )}

      {checkIsUploading && uploadProgress > 0 && (
        <div className={`upload-progress rounded bg-light shadow-sm border p-3 my-2 mb-4`}>
          <CustomProgressBar animated now={uploadProgress} />
          <p className='text-center mt-2'>
            Uploading... {Math.round(uploadProgress)}%
            {timeRemaining && <span className="ml-2">{timeRemaining}</span>}
          </p>
        </div>
      )}
    </>
  );
});

export default GlobalUploader;
