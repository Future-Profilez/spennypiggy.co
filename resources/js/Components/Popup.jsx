import {  useEffect,  useState, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';

export default function Popup(props) {
  const { children, text, classes, action, hidecontrols, size, space, modalclass, bodyclass, fullscreen } = props;
  const [open, setOpen] = useState(false)
  useEffect(()=>{
    if(action === false || undefined){
      setOpen(false)
    }
    if(action === true){
      setOpen(true);
    }
  }, [action]);


  const closeModal = () => { 
    props.onHide && props.onHide();
    setOpen(false)
  }

  const maxWidthClass = {
      'sm': 'max-w-sm',
      'md': 'max-w-md',
      'lg': 'max-w-lg',
      'xl': 'max-w-xl',
  }[size] || 'max-w-md';

  return <>
      <button onClick={()=>setOpen(true)} className={classes}>{text}</button>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className={`w-full ${fullscreen ? 'w-full h-full max-w-none' : maxWidthClass} transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all ${modalclass} mymodal`}>
                  <div className={`p-0 ${bodyclass} `} >
                    {!hidecontrols ?
                    <div className='p-4 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                        <span className=' border-black border-2 bg-red-700 mr-2 w-5 h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-yellow-400 mr-2 w-5 h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-mint mr-2 w-5 h-5 rounded-full block'></span>
                    </div> : ''
                    }
                    <button onClick={closeModal} className='absolute right-5 top-5 z-10'> 
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clipPath="url(#clip0_386_414)"> <path d="M20.5581 23.7753L21 24.2172L21.4419 23.7753L23.7753 21.4419L24.2172 21L23.7753 20.5581L18.2172 15L23.7753 9.44194L24.2172 9L23.7753 8.55806L21.4419 6.22472L21 5.78278L20.5581 6.22472L15 11.7828L9.44194 6.22472L9 5.78278L8.55806 6.22472L6.22472 8.55806L5.78278 9L6.22472 9.44194L11.7828 15L6.22472 20.5581L5.78278 21L6.22472 21.4419L8.55806 23.7753L9 24.2172L9.44194 23.7753L15 18.2172L20.5581 23.7753ZM3.33333 0.625H26.6667C27.385 0.625 28.0738 0.910341 28.5817 1.41825C29.0897 1.92616 29.375 2.61504 29.375 3.33333V26.6667C29.375 27.385 29.0897 28.0738 28.5817 28.5817C28.0738 29.0897 27.385 29.375 26.6667 29.375H3.33333C2.61504 29.375 1.92616 29.0897 1.41825 28.5817C0.910341 28.0738 0.625 27.385 0.625 26.6667V3.33333C0.625 2.61504 0.910341 1.92616 1.41825 1.41825C1.92616 0.910341 2.61504 0.625 3.33333 0.625Z" fill="#8C52FF" stroke="black" strokeWidth="1.25"/> </g> <defs> <clipPath id="clip0_386_414"> <rect width="30" height="30" fill="white"/> </clipPath> </defs> </svg> 
                    </button>
                    <div className={`p-${space || 0} ${fullscreen ? '' : 'max-h-[65vh] overflow-y-auto customScrollbar'}`}>
                        {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

    </>
}
