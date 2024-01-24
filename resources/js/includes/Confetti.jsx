import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Confetti  ({sender, is_read_owner, children, onclick, classes}) {

   const startConfetti = () => {
    if(sender){
       return false;
    }
    if(is_read_owner == 1){
      return false;
    }
    onclick && onclick();
    // const button = document.getElementById('button-conf');
    // const rect = button.getBoundingClientRect();
    // const origin = {
    //   x: 0.5,  
    //   y: 0.1, 
    // };
    //  const myCanvas = document.createElement('canvas');
    //  document.body.appendChild(myCanvas);
    //  const defaults = {
    //    disableForReducedMotion: true,
    //  };
    //  const colors = ['#05EFB8', '#8C52FF', '#E6EA7B', '#F94F97', '#05EFB8', '#8C52FF', '#E6EA7B', '#F94F97'];
    //  function fire(particleRatio, opts) {
    //    confetti(
    //      Object.assign({}, defaults, opts, {
    //        particleCount: Math.floor(200 * particleRatio),
    //      })
    //    );
    //  }
    //  setTimeout(() => {
    //    fire(0.25, {
    //      spread: 26,
    //      startVelocity: 10,
    //      origin,
    //      colors,
    //    });
    //    fire(0.2, {
    //      spread:200,
    //      startVelocity: 40,
    //      origin,
    //      colors,
    //    });
    //    fire(0.35, {
    //      spread: 150,
    //      startVelocity: 55,
    //      decay: 0.91,
    //      origin,
    //      colors,
    //    });
    //    fire(0.1, {
    //      spread: 150,
    //      startVelocity: 60,
    //      decay: 0.92,
    //      origin,
    //      colors,
    //    });
    //    fire(0.1, {
    //      spread: 220,
    //      startVelocity: 20,
    //      origin,
    //      colors,
    //    });
    //  },1);

    var scalar = 3;
    var unicorn = confetti.shapeFromText({ text: ['🪙'], scalar});
    var unicorn2 = confetti.shapeFromText({ text: ['💰'], scalar});
    var unicorn3 = confetti.shapeFromText({ text: ['💸'], scalar});
    var unicorn4 = confetti.shapeFromText({ text: [' 🎁'], scalar});
    var unicorn5 = confetti.shapeFromText({ text: [' 🤑'], scalar});
   
    
    var defaults = {
      spread:200,
      ticks: 200,
      gravity: 0.7,
      decay: 0.9,
      startVelocity: 35,
      shapes: [unicorn, unicorn2, unicorn3, unicorn4, unicorn5],
      scalar
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 10
      });

      confetti({
        ...defaults,
        particleCount: 10,
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: scalar / 2,
        shapes: ['circle']
      });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);

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
 