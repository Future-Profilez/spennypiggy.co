import loading from '../../assets/img/loading.gif';

export default function LoadingScreen({hideimage}) {
  return (
    <div className='loadingwrap  flex justify-center items-center content-center flex-wrap p-4  '>
        {hideimage ? '' : <div className='noresultimg mb-3'><img  alt="img" src={loading} /></div>    }
        <h6 className='headingLg !text-xl loadingtext w-full text-center shadow-yellow mb-5'>Loading...</h6>
    </div>
  )
}
