import React from 'react'
import seek from "../../../assets/img/seeksearch.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function FunPart({imgbg, textbg, heading, eclasses, text, img, classes, reverse}) {
    return (
        <>
            <style jsx >{`
                .box-s {  border-${reverse ? "right" : "left"}:2px solid #000;}
            `}</style>

            <div className={`${classes} d-flex ${reverse ? "col-reverse" : ''} bg-white d-flex borderbox justify-content-between align-items-center`}>
                <div className={`box-s ${eclasses} ${reverse ? "justify-content-start" : "justify-content-end"} p-5 pb-0 w-50 ${imgbg} `}>
                    <LazyLoadImage
                    alt={"image"} useIntersectionObserver={true} effect="blur"
                    height={326}
                    src={img || seek }
                    width={468} />
                </div>
                <div className={`box-e ${reverse ? "justify-content-end" : "justify-content-start"} w-50 p-4 ${textbg} `}>
                    <div className='max-width-500'  >
                    <h3 className="headingSm shadow-none text-dark stroke-none mb-3"> {heading} </h3>
                    <p className="text-CeraGR">
                    {text}
                    </p>
                    </div>
                </div>
            </div>
        </>
    )
}
