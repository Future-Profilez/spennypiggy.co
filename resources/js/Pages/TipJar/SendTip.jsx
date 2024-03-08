import React, { useState } from 'react';
import TipInner from './TipInner';
const Popup = React.lazy(() => import("@/Components/Popup"));

export default function SendTip(props) {
  const [close, setClose ] = useState();
  return <>
      <Popup 
          modalclassName="pinkmodal sendSurprize-modal shadow-pink"
          space="0" size="md" action={close} classes={`btn-pink mt-3 sm px-3 my-2`}
          text={`Fill my Piggy Bank 🪙`} >
           <TipInner />
      </Popup>
  </>
}
