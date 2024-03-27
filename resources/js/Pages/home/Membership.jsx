import React from 'react'
import PREMIUMMEMBERSHIP from '../../../assets/img/PREMIUMMEMBERSHIP.png'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import LiveBar from '@/includes/LiveBar'

export default function Membership() {
  return (
    <>
    <style>{`
    .commingsooon { 
      position:absolute;
      top:47%;
      left:0
    }
    `}</style>
      <div className='forcreators overflow-hidden py-3 py-md-5 px-3 px-md-0 bg-white' >
       <div className='container py-4' >
        <h2 className='headingSm shadow-none text-dark stroke-none mb-3 text-center mb-6' >Premium Membership</h2>
        <p className='max-width-900 text-muted m-auto text-center text-[20px]' >Discover a hassle-free way to enhance your earnings potential. Enjoy zero fees for fans, with creators keeping 100% of their earnings. Unlock premium features, including enhanced chargeback protection. Cancel anytime. Join us today!</p>
      </div>
        
        <div className='position-relative p-0 p-md-4' >
              <div className='membership-image py-2 m-auto d-table d-flex justify-content-center max-width-900 mt-3 ' >
                <LazyLoadImage
                  alt={"image"} 
                  useIntersectionObserver={true}
                  effect="blur"
                  className=""
                  src={PREMIUMMEMBERSHIP}
                  width={982}
                  height={600}
                />
              </div>
              <strong className='font-[23px] text-center my-2 m-auto d-table' >*Supporters just pay payment processing. No service fees.</strong>
              <LiveBar reps={20} color={`yellowbg`} classes={'commingsooon'} text={"  Coming Soon      "} />
        </div>

    </div>
    </>
  )
}
