import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import userphoto from "../../../assets/img/userphoto.png";
import Avatar from "@/includes/Avatar";
import { useState } from "react";

export default function Board(props) {

    const { auth } = props;
    console.log("props", props);

    const [ranks, setranks]  = useState([]);
    const [period, setPeriod] = useState("weekly")
    const switchTime = (e) => { 
      setPeriod(e)
    }

    const Rank = () => {
      return <div className="rank py-3 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center justify-content-between" >
                <div className="sno me-4 ps-2">
                  <p>#1</p>
                </div>
              <div className="wisher" >
                <Avatar name={`From`}
                    link={"n.user && n.user.username || null"}
                    subhead={"username"}
                    username={"username"}
                    src={userphoto}
                />
              </div> 
            </div>
            <div className="rank-stats" >
              <p className="toppercentage" >0.01%</p>
            </div> 
      </div>
    }

    const Income = () => {
      return <div className="rank py-3 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center justify-content-between" >
              <div className="wisher" >
                <Avatar name={`From`}
                link={"n.user && n.user.username || null"}
                subhead={"username"}
                username={"username"}
                src={userphoto} />
              </div> 
            </div>
            <div className="rank-stats" >
              <p className="toppercentage income " >0.01%</p>
            </div> 
      </div>
    }

    const Position = () => {
      return <div className={`position-${1} position text-center rounded-lg shadow-pink bg-white`}>
         <div className="profile p-3 pb-0" >
          <div className="profile-image" >
            <img src={userphoto} className="img-fluid" alt="image" />
          </div>
          <div className="profile-content" >
            <h2 className="font-bold text-large pt-2" >Just Jack</h2>
            <p className="toppercentage text-center" >0.01%</p>
          </div>
          <div className={`rank-position `} >
            <h2 className="font-GillSans">1</h2>
          </div>
         </div>
      </div>
    }

    return (
        <Authenticated auth={auth && auth.user} >
            <Head title={"Cart"} />
            <div className="  blackbg">
                <div className="containerbox pb-5 ">
                    <div className="row" >
                      <div className="col-lg-8" >

                        <div className="d-flex align-items-center justify-content-between mb-4 pb-4" >
                          <h2 className="text-bl font-GillSans  text-start text-2xl uppercase text-white ">Leaderboard</h2>
                          <div className="changePeriod" >
                            <button className={period == 'monthly' ? 'active' : ''} onClick={()=>switchTime("monthly")} >Montly</button>
                            <button className={period == 'weekly' ? 'active' : ''} onClick={()=>switchTime("weekly")} >Weekly</button>
                            <button className={period == 'daily' ? 'active' : ''} onClick={()=>switchTime("daily")} >Daily</button>
                          </div>
                        </div>
                        
                        <div className="postions pb-5 pt-5 mt-3" >
                          <Position />
                          <Position />
                          <Position />
                        </div>
                        <div className="rank_lists bg-white py-3 px-3 rounded-lg" >
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                            <Rank />
                        </div>
                      </div>
                      <div className="col-lg-4" >
                      <div className="rank_lists  bg-white p-4 rounded-lg" >
                        <h2 className="text-bl font-GillSans  text-start text-2xl 
                        uppercase text-dark mb-4">Largest Gifts</h2>
                        <Income />  
                        <Income />  
                      </div>
                      </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
