import noresultimg from '../../assets/img/noresultimg.png' ;
import { Link } from '@inertiajs/react';

export default function Nocontent({error, text, classes}) {
  return (
    <div className={`${classes} noResult flex justify-center items-center content-center flex-wrap p-4 blackbg`}>
        <div className='noresultimg mb-5'><img  alt="img" src={noresultimg} /></div>    
        <h2 className='headingLg w-full text-center shadow-yellow mb-5'>{text}</h2>
        {error ? <div className='rotate-btn'>
            <Link href="/" className="btn-pink md w-52 border-mint shadow-mint">Back to Home</Link>
        </div> : ''}
    </div>
  )
}
