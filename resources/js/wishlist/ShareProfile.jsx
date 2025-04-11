import toast from 'react-hot-toast';
export default function ShareProfile({children,username,classes, custom}){

  function shareTo() {
    const width = window && window.innerWidth;
    const currentURL = custom ? custom : window.location.href;
    // if(width > 991){
    //     navigator.clipboard.writeText(currentURL)
    //     toast.success("Copied to Clipboard.");
    // } else {
      navigator.share({
        url:  currentURL, title: username ? username : "Spenny Piggy",
      });
    // }
  }

  return <>
    <button className={classes} onClick={shareTo} >
      {children}
    </button>
  </>
}
