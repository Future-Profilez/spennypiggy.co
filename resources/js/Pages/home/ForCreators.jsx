import React from 'react'
import publish from '../../../assets/img/publish.png'
import { LazyLoadImage } from 'react-lazy-load-image-component'

export default function ForCreators() {
  return (
    <div className='forcreators pt-3 pt-md-5 bg-white' >
       <div className='container' >

       <div className='mt-2 mt-sm-5  pt-5' >
            <h2 className='headingSm shadow-none text-dark stroke-none mb-3 text-center mb-6 '  data-aos="zoom-in" >Publish your best Work</h2>
            <p className='max-width-900 text-muted m-auto text-center text-[20px]'  data-aos="zoom-in" >Spenny Piggy makes it super easy to receive financial support, offer bespoke memberships & publish free and exclusive content!</p>

          <div className='publish-image max-width-700 m-auto d-table py-5' data-aos="zoom-in-up" >
            <LazyLoadImage
                alt={"image"} className="img-fluid"

                effect="blur"

                src={publish}
                width={799}
                height={522}
              />
          </div>

       </div>


       </div>

    </div>
  )
}
