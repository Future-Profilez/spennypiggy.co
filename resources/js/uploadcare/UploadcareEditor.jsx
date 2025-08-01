import React, { useEffect } from 'react';
import * as LR from 'https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-cloud-image-editor.min.js';

export default function UploadcareEditor({uuid, updateFile, setIsEditable, height}){

  useEffect(() => {
    LR.registerBlocks(LR);
    const callback = (text) => (event) => {
      updateFile && updateFile(event.detail, uuid);
      setIsEditable && setIsEditable(false);
    };
    const instance = document.querySelector('#my-editor');
    instance && instance.addEventListener('apply', callback('Apply'));
    instance && instance.addEventListener('cancel', callback('Cancel'));
    return () => {
      instance && instance.removeEventListener('apply', callback('Apply'));
      instance && instance.removeEventListener('cancel', callback('Cancel'));
    };
  }, [uuid]);

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
        ctx-name="my-editor"
        ></lr-config>
        <lr-cloud-image-editor
          id="my-editor"
          ctx-name="my-editor"
          css-src="https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-cloud-image-editor.min.css"
          uuid={uuid}  
          crop-preset="1:1"
          crop="true"
        ></lr-cloud-image-editor>
      </div> : ''}
    </>
  );
};
