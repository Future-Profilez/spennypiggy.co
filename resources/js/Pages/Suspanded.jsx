import Authenticated from "@/Layouts/AuthenticatedLayout";
import noresultimg from '../../assets/img/noresultimg.png' ;
import { useState } from "react";

export default function NotFound({ auth, user }) {
      const [IsloggedIn, setIsLoggedIn] = useState(
           (auth && auth.user && auth.user.username) == (user && user.username)
      );
      

    return (
        <Authenticated auth={auth.user} user={user} >
            <div className="blackbg py-18">
                <div className=" h-[80vh] flex justify-center items-center   ">
                  <div className="flex justify-center">
                     <div className="max-w-[400px] p-6">
                        <div className='noresultimg mb-5 m-auto'><img  alt="img" src={noresultimg} /></div>    
                        <h2 className='font-gulfs text-3xl uppercase text-white w-full text-center sshadow-yellow'> Account Suspended</h2>
                        <p className="text-gray-300 mt-2 text-center">Your account has been suspended. If you are owner of this account. Please contact to support. </p>
                        <div className='flex justify-center mt-4'>
                           <a className="livechat intercom-dud02y e11rlguj1 text-pink">Contact Support</a>
                        </div> 
                     </div>
                     
                  </div>
                </div>
            </div>
        </Authenticated >
    );
}
