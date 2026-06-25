import React from "react";
import { usePage } from "@inertiajs/react";
import Authenticated from "../../Layouts/AuthenticatedLayout";
import PurchasesHub from "./PurchasesHub";

export default function Hub(props) {
    const { auth } = usePage().props;
    return (
        <Authenticated auth={auth.user} user={auth.user}>
            <PurchasesHub {...(props || {})} />
        </Authenticated>
    );
}
