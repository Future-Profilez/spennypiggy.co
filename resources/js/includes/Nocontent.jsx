import noresultimg from '../../assets/img/noresultimg.png' ;
import { Link } from '@inertiajs/react';

export default function Nocontent({error, text, classes,subheading}) {
  return (
    <div className={`${classes} noResults  flex justify-center items-center content-center flex-wrap p-4 sblackbg`}>
        <div className='noresultimg mb-5'><img  className='animate-bounce    ' alt="img" src={noresultimg} /></div>    
        <h2 className='animate-pulse headingLgs text-pink font-gulfs uppercase !text-xl  lg:!text-3xl w-full text-center sshadow-yellow'>{text}</h2>
       { subheading && <p className='max-w-[600px] animate text-lg text-gray-400  w-full text-center sshadow-yellow mt-3'>{subheading}</p>}
        {error ? <div className='rotate-btn'>
            <Link href="/" className="btn-pink md w-52 border-mint shadow-mint mt-5">Back to Home</Link>
        </div> : ''}
    </div>
  )
}
