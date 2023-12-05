import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Confetti  ({children, onclick, classes}) {

   const startConfetti = () => {
     onclick && onclick();
     const button = document.getElementById('button-conf');
     const rect = button.getBoundingClientRect();
     const origin = {
      x: 0.5,  
      y: 0.1, 
    };
     const myCanvas = document.createElement('canvas');
     document.body.appendChild(myCanvas);
     const defaults = {
       disableForReducedMotion: true,
     };
     const colors = ['#05EFB8', '#8C52FF', '#E6EA7B', '#F94F97', '#05EFB8', '#8C52FF', '#E6EA7B', '#F94F97'];
     function fire(particleRatio, opts) {
       confetti(
         Object.assign({}, defaults, opts, {
           particleCount: Math.floor(200 * particleRatio),
         })
       );
     }
     setTimeout(() => {
       fire(0.25, {
         spread: 26,
         startVelocity: 10,
         origin,
         colors,
       });
       fire(0.2, {
         spread:200,
         startVelocity: 40,
         origin,
         colors,
       });
       fire(0.35, {
         spread: 150,
         startVelocity: 55,
         decay: 0.91,
         origin,
         colors,
       });
       fire(0.1, {
         spread: 150,
         startVelocity: 60,
         decay: 0.92,
         origin,
         colors,
       });
       fire(0.1, {
         spread: 220,
         startVelocity: 20,
         origin,
         colors,
       });
     },1);
   };

   useEffect(() => {
    return () => {
      const myCanvas = document.querySelector('canvas');
      myCanvas && myCanvas.remove();
    };
  }, []); 

  return (
    <>
        <div className={classes} id="button-conf" onClick={startConfetti} >
         {children}
        </div>
    </>
  );
};
 