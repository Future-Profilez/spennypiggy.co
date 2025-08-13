import Guest from "@/Layouts/GuestLayout";
export default function GiftStore() {
    return (
        <Guest>
            <div className="min-h-[70vh] flex items-center justify-center bg-black text-white p-4">
                <div className="text-center">
                    <h1 className="headingSm mb-4 ">
                         Page Under <br></br> Development
                    </h1>
                    <p className="font-poppins text-lg md:text-xl mb-6">
                        This page is currently being developed. <br></br> We appreciate your patience and invite you to check back soon.
                    </p>
                </div>
            </div>
        </Guest>
    );
}
