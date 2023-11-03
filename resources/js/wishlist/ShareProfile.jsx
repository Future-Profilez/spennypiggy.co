import toast from 'react-hot-toast';
export default function ShareProfile({children,username,classes}){

  function shareTo() {
    const width = window && window.innerWidth;
    const currentURL = window.location.href;

    if(width > 991){ 
        navigator.clipboard.writeText(currentURL)
        toast.success("Copied to Clipboard.");
    } else { 
      navigator.share({
        url:  currentURL, title: "/",
      }); 
    }
  }

  return <>
    <button className={classes} onClick={shareTo} >
      {children}
    </button>
  </>
}