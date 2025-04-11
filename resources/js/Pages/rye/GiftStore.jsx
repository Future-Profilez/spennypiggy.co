import Guest from "@/Layouts/GuestLayout";
import React from "react";

export default function GiftStore() {
    return (
        <Guest>
            <div className="min-h-[90vh] flex items-center justify-center bg-gray-900 text-white p-4">
                <div className="text-center">
                {/* <h1 className="text-[300px] md:text-[220px] font-bold mb-4">
                        🚧
                    </h1> */}
                    <h1 className="headingSm mb-4">
                         Page Under Development
                    </h1>
                    <p className="font-poppins text-lg md:text-xl mb-6">
                        This page is currently being developed. We appreciate your patience and invite you to check back soon.
                    </p>
                </div>
            </div>
        </Guest>
    );
}
