import Popup from "@/Components/Popup";

export default function ContentPrefrences(props){
  return <>
  <Popup
   space='0' modalclass="pinkmodal" size="md"
   text={'Consent Preferences'} classes={`${props.classes} content-pre `}  >
    <div className="content-pr-modal" >
      <iframe src="https://app.termly.io/notify/696baafc-17cd-4a28-b758-a8f597cf2ad6" > </iframe>  
    </div>
  </Popup>
  </>
}