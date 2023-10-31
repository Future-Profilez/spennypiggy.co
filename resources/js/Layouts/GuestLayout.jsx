import Footer from '@/includes/Footer';
import Header from '@/includes/Header';
import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return <>

        <Header />
        {children}
        <Footer />

        {/* <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100">
            <div>
                <Link href="/">
                    <ApplicationLogo className="w-20 h-20 fill-current text-gray-500" />
                </Link>
            </div> */}
        {/* </div> */}

    </>
}
