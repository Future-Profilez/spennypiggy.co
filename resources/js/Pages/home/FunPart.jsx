import seek from "../../../assets/img/seeksearch.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function FunPart({imgbg, mainbg, textbg, heading, eclasses, text, img, classes, reverse}) {
    return (
        <>
  <style jsx>{`
    .box-s {
      border-${reverse ? "right" : "left"}: 2px solid #000;
      overflow: hidden; /* Prevent image from spilling out */
    }
    .image-container {
      width: 100%;
      height: 100%;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: transparent !important; /* Remove image background if any */
    }
  `}</style>

  <div className={`${classes}  flex ${reverse ? "col-reverse" : ''} ${mainbg ? mainbg : 'bg-white'} flex borderbox justify-between items-center`}>
    <div  className={` box-s ${eclasses} ${reverse ? "justify-content-start" : "justify-content-end"} pb-0 w-50`}>
      <div className="image-container">
        <LazyLoadImage
          alt="image" className='max-h-[600px]'
          effect="blur"
          src={img || seek}
        />
      </div>
    </div>
    <div className={`fading box-e ${reverse ? "justify-content-end" : "justify-content-start"} w-50 p-4 ${textbg}`}>
      <div className='max-width-500'>
        <h3 className="headingSm shadow-none text-dark stroke-none font-gulfs !text-2xl lg:!text-3xl  xl:!text-4xl mb-3" >
          {heading}
        </h3>
      </div>
    </div>
  </div>
</>

    )
}
