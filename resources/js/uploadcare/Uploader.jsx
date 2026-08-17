import * as LR from "@uploadcare/blocks"; 
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"; 
import { PACKAGE_VERSION } from "@uploadcare/blocks/env"; 
import CustomProgressBar from "@/Components/CustomProgressBar"; 
import { useAlerts } from "@/Components/Alerts"; 
import axios from "axios"; 
LR.registerBlocks(LR); 

const GlobalUploader = forwardRef(({ imgclasses, options, sendFile, accept, view, isUploading, type, ctxName = 'default', imgonly = true, multiple = false }, ref) => {
  const { successAlert, errorAlert } = useAlerts();
  const [files, setFiles] = useState([]);
  const [checkIsUploading, setCheckIsUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const dataOutputRef = useRef();
  const controller = useRef(new AbortController());
  /**
   * ⚠️ `LR_UPLOAD_FINISH` carries the WHOLE upload collection and can fire more
   * than once for the same file (the preview step settles the collection a
   * second time once CDN modifiers are applied), and the collection is not
   * cleared on a successful hand-over. Consumers that APPEND what they are given
   * — the post composer's `getfile` — therefore received the same uuid twice and
   * rendered one uploaded image as two thumbnails.
   *
   * Files are handed over ONCE per uuid per uploader instance. The set is
   * cleared on reset/remove, so re-adding a file the creator deliberately
   * removed still works.
   */
  const sentUuidsRef = useRef(new Set());

  const handleResetUploader = () => {
    sentUuidsRef.current.clear();
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
    
    // ⚠️ Same context guard as the others. Without it, removing a file in ANY
    // uploader on the page cleared THIS one's collection and its sent-uuid set.
    const removeHandler = e => {
      const eventCtx = e?.detail?.ctx || e?.target?.getAttribute?.('ctx-name');
      if (eventCtx && eventCtx !== ctxName) return;

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
    if (!d || d.length === 0) return;

    const allFiles = d.map(f => ({
      uuid: f?.uuid,
      mimeType: f?.contentInfo?.mime?.type || '',
      mimeSubtype: f?.contentInfo?.mime?.subtype || '',
      name: f?.originalFilename || f?.name || 'File',
      size: f?.size || 0,
      isImage: f?.isImage || false,
      isVideo: (f?.contentInfo?.mime?.type === 'video') || false,
      isAudio: (f?.contentInfo?.mime?.type === 'audio') || false,
      url: f?.cdnUrl || `https://ucarecdn.com/${f?.uuid}/`
    }));

    // A re-fired finish event for files already handed over is a no-op, never a
    // second copy of the same upload.
    const filesToScan = allFiles.filter(f => f.uuid && !sentUuidsRef.current.has(f.uuid));
    if (filesToScan.length === 0) return;

    /**
     * 🚨 The claim is taken HERE, synchronously, before the first `await`.
     *
     * `LR_UPLOAD_FINISH` fires more than once for the same file (the preview step
     * settles the collection again once CDN modifiers are applied), and the adult
     * scan below is an awaited HTTP round trip — so with the mark taken after it,
     * both events read the same unclaimed uuids, both passed this filter, and one
     * uploaded image was handed to the composer TWICE. The consumer's own dedupe
     * hid it only when both copies arrived in the same `setState` batch.
     *
     * A refusal un-claims via `handleResetUploader`, so a file the creator removes
     * and re-adds still works.
     */
    filesToScan.forEach(f => sentUuidsRef.current.add(f.uuid));

    const imagesToScan = filesToScan.filter(f => f.uuid && f.mimeType === 'image');

    if (imagesToScan.length > 0) {
      setScanning(true);
      try {
        const scanPromises = imagesToScan.map(img => axios.get(`/scanning/check-adult-content/${img.uuid}`));
        const responses = await Promise.all(scanPromises);
        setTimeout(() => setScanning(false), 100);

        const flagged = responses.find(resp => !resp.data.status);
        if (flagged) {
          errorAlert(flagged.data.msg || "One of the files failed adult content policy.");
          handleResetUploader();
        } else {
          successAlert("Files uploaded and scanned successfully!");
          sendFile(multiple ? filesToScan : filesToScan[0]);
          setFiles(d);
          controller.current.abort();
        }
      } catch (err) {
        setTimeout(() => setScanning(false), 2000);
        sendFile(multiple ? filesToScan : filesToScan[0]);
        setFiles(d);
      }
    } else {
      sendFile(multiple ? filesToScan : filesToScan[0]);
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
      {/* img-only is spread conditionally below: on a web component React renders
          `img-only={false}` as the attribute img-only="false", which Uploadcare
          reads as PRESENT → image-only, silently blocking docs/zips/videos. */}
      <lr-config
        ctx-name={ctxName}
        pubkey="af0e7b54d1432d098e25"
        multiple={multiple}
        darkmode={false}
        thumb-size={500} inputAcceptTypes={accept || "image/*,video/*"}
        confirm-upload={false}
        store
        accept={accept || "image/*,video/*"}
        preview-step
        camera-mirror={false}
        source-list="local,url,camera,dropbox"
        done-activity={false}
        show-empty-list={false}
        {...(imgonly ? { "img-only": true } : {})}
        remove-copyright
        max-concurrent-requests={4}
        multipart-max-attempts={3}
      />
       
      {view && (
        <div className={'uploadcare-view mb-0'}>
          {files.map((file) => (
            <div className="uploadcare-view-wrap" key={file.uuid}>
              {file.isImage ? (
                <img className={`rounded border ${imgclasses}`}
                  width="25%" alt="Preview"
                  src={`https://ucarecdn.com/${file.uuid}/${file.cdnUrlModifiers || ""}`}
                />
              ) : (
                <video playsInline controls preload="none" className="rounded" src={`https://ucarecdn.com/${file.uuid}/`} alt="Preview" />
              )}
            </div>
          ))}
        </div>
      )}

      {renderUploader()}

      {scanning && (
        <div className={`scanning rounded bg-light  border p-3 my-2 mb-4`}>
          <CustomProgressBar animated now={100} />
          <p className='text-center mt-2'>Adult content scanning...</p>
        </div>
      )}

      {checkIsUploading && uploadProgress > 0 && (
        <div className={`upload-progress rounded bg-light  border p-3 my-2 mb-4`}>
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
