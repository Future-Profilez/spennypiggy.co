import { useEffect } from "react";

export default function UploadcareEditor({uuid, updateFile, setIsEditable, height, ctxName = "my-editor"}){

  useEffect(() => {
    async function loadEditor() {
      if (typeof window === 'undefined') return;
      const LR = await import('https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-cloud-image-editor.min.js');
      LR.registerBlocks(LR);
      const callback = (text) => (event) => {
        updateFile && updateFile(event.detail, uuid);
        setIsEditable && setIsEditable(false);
      };
      const instance = document.querySelector(`#${ctxName}`);
      instance && instance.addEventListener('apply', callback('Apply'));
      instance && instance.addEventListener('cancel', callback('Cancel'));
      return () => {
        instance && instance.removeEventListener('apply', callback('Apply'));
        instance && instance.removeEventListener('cancel', callback('Cancel'));
      };
    }
    const cleanupPromise = loadEditor();
    return () => {
      cleanupPromise.then((cleanup) => typeof cleanup === 'function' && cleanup()).catch(() => {});
    };
  }, [uuid, ctxName]);

  return (
    <>
      <style>
        {`
          body {
            height: ${height || '100vh'};
            width: 100vw;
            margin: 0;
          }
        `}
      </style>

      {uuid ? <div className='image-editor border rounded-4 overflow-hidden' >
        <lr-config  
        ctx-name={ctxName}
        ></lr-config>
        <lr-cloud-image-editor
          id={ctxName}
          ctx-name={ctxName}
          css-src="https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-cloud-image-editor.min.css"
          uuid={uuid}  
          crop-preset="1:1"
          crop="true"
        ></lr-cloud-image-editor>
      </div> : ''}
    </>
  );
};
