import {  useEffect,  useState, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';

export default function Popup(props) {
  const { children, text, classes, action, hidecontrols, size, space, modalclass, bodyclass, fullscreen } = props;
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (action === true) {
      setOpen(true)
    } else if (action === false) {
      setOpen(false)
    }
  }, [action])

  const closeModal = () => {
    // An onHide that returns false vetoes the close — used by forms to confirm
    // before discarding unsaved input. Returning undefined keeps old behaviour.
    if (props.onHide && props.onHide() === false) return
    setOpen(false)
  }

  const maxWidthClass = {
      'sm': 'max-w-sm',
      'md': 'max-w-md',
      'lg': 'max-w-lg',
      'xl': 'max-w-xl',
  }[size] || 'max-w-md';

  return <>
      {typeof text !== 'undefined' && (
        <button onClick={() => setOpen(true)} className={`font-cera-medium ${classes}`}>
          {text}
        </button>
      )}
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[9995]" onClose={() => {}}>
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
                leaveTo="opacity-0 scale-95" >
                <Dialog.Panel
                  className={`w-full ${fullscreen ? 'w-full h-full max-w-none' : maxWidthClass} transform overflow-hidden rounded-[35px] md:rounded-[40px] bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left align-middle transition-all ${modalclass}  mymodal`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={`p-0 ${bodyclass} `} >
                    {!hidecontrols ?
                    <div className='px-[30px] py-[20px] bg-[#FF007F] flex  !border-l-0 !border-r-0 !border-t-0 border-b-[3px] border-black items-center '>
                        <span className=' border-black border-2 bg-red-500 mr-2 w-4 h-4 rounded-full block'></span>
                        <span className=' border-black border-2 bg-yellow-400 mr-2 w-4 h-4 rounded-full block'></span>
                        <span className=' border-black border-2 bg-green-400 mr-2 w-4 h-4 rounded-full block'></span>
                    </div> : ''
                    }
                    <button onClick={closeModal} className='absolute right-5 top-3 z-10 bg-white border-2 border-black rounded-full p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all'> 
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> 
                    </button>
                    <div className={`p-${space || 0} ${fullscreen ? '' : 'max-h-[80dvh] overflow-y-auto customScrollbar'}`}>
                       <div className="md:p-2 w-full"> {children}</div>
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
