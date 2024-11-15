import React from 'react';
import not1 from '../../../assets/img/not1.png'
import not2 from '../../../assets/img/not2.png'
import not3 from '../../../assets/img/not3.png'
import { LazyLoadImage } from 'react-lazy-load-image-component';
export default function NotForBusiness() {
  return <>
  <style>{`
  .conversion { 
    background: #D9EFEA;
  }
  `}</style>
        <div className='lightpink-50 pt-0 pt-sm-3 pt-md-5'>
            <div className='container py-5' >
                <h2 className='headingSm shadow-none text-dark stroke-none mb-3 text-center mb-6 max-width-1000 m-auto d-table' >Designed for creators, not for businesses</h2>
                <div className='max-width-1100 m-auto d-table mb-0 mb-sm-2 mb-md-4 mb-md-0 px-2' >
                    <div className='row ' >
                        <div data-aos="flip-left" className='col-lg-4 col-sm-6' >
                            <div className="box rounded-md infobox shadow-black-sm mt-4">
                                    <div className='new-icon mt-2' >
                                    <LazyLoadImage
                                    alt={"image"} 
                                    height={70} useIntersectionObserver={true} 
                                    effect="blur" 
                                    src={not1}
                                    width={70} />
                                    </div>
                                    <p className="text-dark">We don’t calll them “Customers” or transactions. They are your Supporters.</p>
                            </div>
                        </div>
                        <div data-aos="flip-left" className='col-lg-4 col-sm-6' >
                            <div className="box rounded-md infobox shadow-black-sm mt-4">
                                    <div className='new-icon mt-2' >
                                    <LazyLoadImage
                                    alt={"image"} 
                                    height={70} useIntersectionObserver={true} 
                                    effect="blur" 
                                    src={not2}
                                    width={70} />
                                    </div>
                                    <p className="text-dark">You get to talk to a human for help, or if you’d just like some advice to hit the ground running.</p>
                            </div>
                        </div>
                        <div data-aos="flip-left" className='col-lg-4 col-sm-6' >
                            <div className="box rounded-md infobox shadow-black-sm mt-4">
                                    <div className='new-icon mt-2' >
                                    <LazyLoadImage
                                    alt={"image"} 
                                    height={70} useIntersectionObserver={true} 
                                    effect="blur" 
                                    src={not3}
                                    width={70} />
                                    </div>
                                    <p className="text-dark">You get paid instantly to your stripe balance. No more 30-days delays.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='e8_tag d-flex mt-0 mt-md-5' >
                <div data-aos="fade-left" className='8tag w-50 position-relative border-black border-start-0 p-5 text-center d-flex justify-content-center' >
                    <div  className='percent-eight' >
                        <svg width="255" height="121" viewBox="0 0 255 121" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.2" d="M56.5038 120.137C39.8471 120.137 26.2588 116.959 15.7388 110.603C5.32833 104.247 0.123125 95.8642 0.123125 85.4537C0.123125 78.6596 2.69833 72.6325 7.84875 67.3725C12.9992 62.1125 19.355 58.7154 26.9163 57.1812V55.8662C20.4508 54.4417 15.0265 51.4281 10.6431 46.8256C6.36938 42.1135 4.2325 36.9631 4.2325 31.3744C4.2325 22.1694 9.16375 14.6629 19.0263 8.85499C28.9983 3.04708 41.4908 0.143124 56.5038 0.143124C71.6263 0.143124 84.1735 3.04708 94.1456 8.85499C104.118 14.6629 109.104 22.1694 109.104 31.3744C109.104 36.9631 106.857 42.1135 102.364 46.8256C97.981 51.4281 92.5567 54.4417 86.0913 55.8662V57.1812C93.4333 58.6058 99.7344 62.0029 104.994 67.3725C110.254 72.6325 112.884 78.6596 112.884 85.4537C112.884 95.8642 107.679 104.247 97.2688 110.603C86.8583 116.959 73.27 120.137 56.5038 120.137ZM56.5038 55.2087C60.8871 55.2087 64.3938 54.606 67.0238 53.4006C69.6538 52.1952 70.9688 50.4967 70.9688 48.305C70.9688 46.1133 69.599 44.4696 66.8594 43.3737C64.2294 42.1683 60.7775 41.5656 56.5038 41.5656C47.1892 41.5656 42.5319 43.8121 42.5319 48.305C42.5319 50.4967 43.7921 52.1952 46.3125 53.4006C48.9425 54.606 52.3396 55.2087 56.5038 55.2087ZM40.7238 70.4956C40.7238 75.646 45.9838 78.2212 56.5038 78.2212C67.0238 78.2212 72.2838 75.646 72.2838 70.4956C72.2838 68.0848 70.8592 66.2767 68.01 65.0712C65.1608 63.7562 61.3254 63.0987 56.5038 63.0987C51.6821 63.0987 47.8467 63.7562 44.9975 65.0712C42.1483 66.2767 40.7238 68.0848 40.7238 70.4956ZM167.89 56.195C162.52 62.3317 155.726 65.4 147.507 65.4C139.288 65.4 132.494 62.3317 127.125 56.195C121.865 50.0583 119.235 42.3327 119.235 33.0181C119.235 23.594 121.865 15.8683 127.125 9.84124C132.385 3.81416 139.179 0.800615 147.507 0.800615C155.835 0.800615 162.63 3.81416 167.89 9.84124C173.259 15.8683 175.944 23.594 175.944 33.0181C175.944 42.3327 173.259 50.0583 167.89 56.195ZM165.588 118H142.083L207.997 2.93749H231.503L165.588 118ZM141.261 43.2094C142.905 45.6202 144.987 46.8256 147.507 46.8256C150.028 46.8256 152.11 45.6202 153.753 43.2094C155.397 40.689 156.219 37.2919 156.219 33.0181C156.219 28.7444 155.397 25.4021 153.753 22.9912C152.11 20.4708 150.028 19.2106 147.507 19.2106C144.987 19.2106 142.905 20.4708 141.261 22.9912C139.617 25.4021 138.795 28.7444 138.795 33.0181C138.795 37.2919 139.617 40.689 141.261 43.2094ZM226.078 120.137C217.75 120.137 210.901 117.123 205.532 111.096C200.272 104.96 197.642 97.1792 197.642 87.755C197.642 78.55 200.326 70.8792 205.696 64.7425C211.065 58.6058 217.86 55.5375 226.078 55.5375C234.297 55.5375 241.037 58.6058 246.297 64.7425C251.666 70.7696 254.351 78.4404 254.351 87.755C254.351 97.1792 251.666 104.96 246.297 111.096C241.037 117.123 234.297 120.137 226.078 120.137ZM219.832 98.1106C221.476 100.521 223.558 101.727 226.078 101.727C228.599 101.727 230.681 100.521 232.325 98.1106C233.968 95.5902 234.79 92.1383 234.79 87.755C234.79 83.4812 233.968 80.139 232.325 77.7281C230.681 75.3173 228.599 74.1119 226.078 74.1119C223.448 74.1119 221.312 75.3173 219.668 77.7281C218.134 80.0294 217.367 83.3717 217.367 87.755C217.367 92.1383 218.188 95.5902 219.832 98.1106Z" fill="#8C52FF"/>
                        </svg>
                    </div>

                    <div className='percent-eight-text'>
                        <h2 className='headingSm shadow-none text-dark stroke-none mb-3 text-center mb-6 max-width-1000 m-auto d-table' >Fees</h2>
                        <p className='max-width-500 m-auto d-table' >From only 8% fees and built in VAT % customisation!</p>
                    </div>
                </div>
                <div data-aos="fade-right"  className='conversion w-50 border-black border-end-0 border-start-0 px-4 px-md-5 py-5 text-center d-flex justify-content-center align-items-center' >
                    <div >
                        <h2 className='headingSm shadow-none text-dark stroke-none mb-3 text-center mb-6 max-width-1000 m-auto d-table' >Conversion</h2>
                        <p className='max-width-500 m-auto d-table' >Currency conversions will affect some payments, however not applicable to USD - USD payments or GBP - GBP payments. 🥳</p>
                    </div>
                </div>
            </div>
        </div>
  </> 
}
