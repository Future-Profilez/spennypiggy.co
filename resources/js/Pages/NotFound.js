import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Nocontent from "@/includes/Nocontent";

export default function NotFound({auth, user}) {
    return (
        <Authenticated auth={auth.user} user={user} >
            <div className=" blackbg py-18">
                <div className="container py-5 ">
                    <Nocontent text={"404 Not Found"}  />
                </div>
            </div>
        </Authenticated>
    );
}
