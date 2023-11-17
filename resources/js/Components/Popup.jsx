import React, { Children, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Modal from 'react-bootstrap/Modal';
export default function Popup(props) {

  const { children, text, classes, action, custom, size, space, modalclass } = props;
  const [open, setOpen] = useState(false)
  const cancelButtonRef = useRef(null);
  useEffect(()=>{
    if(action === false){
      setOpen(false)
    }
    if(action === true){
      setOpen(true);
    }
  }, [action]);


  const closeModal = () => { 
    props.onHide;
    setOpen(false)
  }
  return <>

      <button onClick={()=>setOpen(true)} className={classes}>{text}</button>
      {/* <Transition.Root show={open}  >
        <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0" >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className="  fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className=" flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100 w-100"
                leave="ease-in duration-200 w-100"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100 w-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95 w-100" >
                <Dialog.Panel className="relative transform overflow-hidden transition-all ">
                  <button onClick={()=>setOpen(false)} className='absolute right-7 top-2 z-2'> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_386_414)"> <path d="M20.5581 23.7753L21 24.2172L21.4419 23.7753L23.7753 21.4419L24.2172 21L23.7753 20.5581L18.2172 15L23.7753 9.44194L24.2172 9L23.7753 8.55806L21.4419 6.22472L21 5.78278L20.5581 6.22472L15 11.7828L9.44194 6.22472L9 5.78278L8.55806 6.22472L6.22472 8.55806L5.78278 9L6.22472 9.44194L11.7828 15L6.22472 20.5581L5.78278 21L6.22472 21.4419L8.55806 23.7753L9 24.2172L9.44194 23.7753L15 18.2172L20.5581 23.7753ZM3.33333 0.625H26.6667C27.385 0.625 28.0738 0.910341 28.5817 1.41825C29.0897 1.92616 29.375 2.61504 29.375 3.33333V26.6667C29.375 27.385 29.0897 28.0738 28.5817 28.5817C28.0738 29.0897 27.385 29.375 26.6667 29.375H3.33333C2.61504 29.375 1.92616 29.0897 1.41825 28.5817C0.910341 28.0738 0.625 27.385 0.625 26.6667V3.33333C0.625 2.61504 0.910341 1.92616 1.41825 1.41825C1.92616 0.910341 2.61504 0.625 3.33333 0.625Z" fill="#8C52FF" stroke="black" strokeWidth="1.25"/> </g> <defs> <clipPath id="clip0_386_414"> <rect width="30" height="30" fill="white"/> </clipPath> </defs> </svg> </button>
                    {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root> */}

      <Modal
      onHide={()=>setOpen(false)}
      size={size || "md"} show={open}
      aria-labelledby="contained-modal-title-vcenter"
      centered className={modalclass} >
      <Modal.Body className={`p-${space || 0} `} >
        <button onClick={closeModal} className='absolute right-5 top-5 z-2'> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_386_414)"> <path d="M20.5581 23.7753L21 24.2172L21.4419 23.7753L23.7753 21.4419L24.2172 21L23.7753 20.5581L18.2172 15L23.7753 9.44194L24.2172 9L23.7753 8.55806L21.4419 6.22472L21 5.78278L20.5581 6.22472L15 11.7828L9.44194 6.22472L9 5.78278L8.55806 6.22472L6.22472 8.55806L5.78278 9L6.22472 9.44194L11.7828 15L6.22472 20.5581L5.78278 21L6.22472 21.4419L8.55806 23.7753L9 24.2172L9.44194 23.7753L15 18.2172L20.5581 23.7753ZM3.33333 0.625H26.6667C27.385 0.625 28.0738 0.910341 28.5817 1.41825C29.0897 1.92616 29.375 2.61504 29.375 3.33333V26.6667C29.375 27.385 29.0897 28.0738 28.5817 28.5817C28.0738 29.0897 27.385 29.375 26.6667 29.375H3.33333C2.61504 29.375 1.92616 29.0897 1.41825 28.5817C0.910341 28.0738 0.625 27.385 0.625 26.6667V3.33333C0.625 2.61504 0.910341 1.92616 1.41825 1.41825C1.92616 0.910341 2.61504 0.625 3.33333 0.625Z" fill="#8C52FF" stroke="black" strokeWidth="1.25"/> </g> <defs> <clipPath id="clip0_386_414"> <rect width="30" height="30" fill="white"/> </clipPath> </defs> </svg> </button>
        {children}
      </Modal.Body>
    </Modal>

    </>
}
