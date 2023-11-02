import toast from 'react-hot-toast';
export default function ShareProfile({children,username,classes}){

  function shareTo() {
    const width = window && window.innerWidth;
    if(width > 991){ 
        navigator.clipboard.writeText("dfsdf")
        toast.success("Copied to Clipboard.");
    } else { 
      navigator.share({
        url:  "APP_URL" + username, title: "/",
      }); 
    }
  }

  return <>
    <button className={classes} onClick={shareTo} >
      {children}
    </button>
  </>
}