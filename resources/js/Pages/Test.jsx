import axios from "axios";
import { useRef } from "react";
import { useEffect } from "react";
import AddBills from "./Bils/AddBills";
import Billslist from "./Bils/Billslist";
export default function Test() {
  
    const post = () => {
        axios
            .post(`/membership/save`, {
                level: "bronze_level",
                month_price: 50.0,
                rewards: [
                    "green_circle_insta",
                    "insta_broadcast",
                    "telegram_group",
                    "monthly_content_bundle",
                    "weekly_DM_chat",
                ],
                thumbnail: file,
            })
            .then((resp) => {
                console.log("resp", resp);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const get = () => {
        axios
            .get(`/gifter-thanks-message/test`)
            .then((resp) => {
                console.log("resp", resp);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const qrcode = useRef();
    useEffect(() => {
        if (qrcode.current) {
          qrcode.current.focus();
        }
    }, []); 
    

    return (
        <div className="text-white">

            <button onClick={get}>Test Get Request</button>
            <button onClick={post}>Test Post Request</button>

            <button > <AddBills/></button>


            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque rem velit ipsam dolorem aspernatur assumenda fuga magnam est ducimus neque a officia, alias dicta deserunt asperiores explicabo distinctio, aut doloribus.</p>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque rem velit ipsam dolorem aspernatur assumenda fuga magnam est ducimus neque a officia, alias dicta deserunt asperiores explicabo distinctio, aut doloribus.</p>
            <button ref={qrcode} className="box p-5 text-dark rounded w-25 mx-5 my-5" >QR CODE</button>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque rem velit ipsam dolorem aspernatur assumenda fuga magnam est ducimus neque a officia, alias dicta deserunt asperiores explicabo distinctio, aut doloribus.</p>
     
        </div>
    );
}
