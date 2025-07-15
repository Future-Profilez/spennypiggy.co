import Nocontent from "@/includes/Nocontent"
import Guest from "@/Layouts/GuestLayout"
import { Head, Link } from "@inertiajs/react"
import noresultimg from '../../assets/img/noresultimg.png' ;

export default function ErrorPage({status, message = ''}) {
    const title = {
        503: '503: Service Unavailable',
        500: '500: Server Error',
        404: '404: Page Not Found',
        403: '403: Forbidden',
      }[status]

      const description = {
        503: 'Sorry, we are doing some maintenance. Please check back soon.',
        500: 'Whoops, something went wrong on our servers.',
        404: 'Sorry, the page you are looking for could not be found.',
        403: 'Sorry, you are forbidden from accessing this page.',
      }[status]

      const goBack = (e) => {
        history.back();
      }

      return (
        <>
        <Guest>
            <Head title={message}/>
            {status == 404 ? <Nocontent error={true} text={message} /> : <>

                <div className="h-screens my-[100px] items-center justify-center">
                    <div className="shadow-layout  inputs max-w-[600px] pink-shadow-layout mx-auto  !border-3 border-black  bg-white shadow-pink overflow-hidden">
                        <div className='p-3 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                            <span className=' border-black border-2 bg-red-700 me-2 w-4 h-4 rounded-full block'></span>
                            <span className=' border-black border-2 bg-yellow-400 me-2 w-4 h-4 rounded-full block'></span>
                            <span className=' border-black border-2 bg-mint me-2 w-4 h-4 rounded-full block'></span>
                        </div>
                        <div className="p-4 text-center">

                        <div className='noresultimg mb-5 m-auto d-table'>
                            <img  alt="img" src={noresultimg} />
                        </div>
                        <h1 className="text-white text-5xl mb-2 uppercase">{message}</h1>
                        <p class="p-a pb-4 mb-0">{message.length > 0 ? message : description}</p>
                        <Link onClick={goBack} className="back block max-w-[300px] m-auto">... Back to previous page</Link>
                        </div>
                    </div>
                </div>

            </>}
        </Guest>
        </>
      )
}
