import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Link } from "react-router-dom";
import Avatar from "@/includes/Avatar";
import PriceFormat from "@/includes/PriceFormat";
import SayThanks from "./SayThanks";

export default function Wishtracker(props) {

      const { format } = PriceFormat();


   const {auth, user, tracks} = props;
   console.log("tracks",tracks);

      // const Wish = () => {
      //       return <div  >
                  
      //       </div>
      // }

      return (
            <Authenticated auth={auth.user} user={user}>
                  <Head title={"Wish Tracker"} />
                  <div className="wishtracker blackbg min-h-screen pb-5">
                  <div className="containerbox blackbg">
                        <Tabs defaultActiveKey="1" id="tracker-tab" className="mb-3">
                              <Tab eventKey="1" title="Wish Tracker">
                                    <div className="table-responsive mytable" >
                                          <table >
                                                <thead>
                                                      <tr>
                                                            <td>Gifter</td>
                                                            <td>Wish Name</td>
                                                            <td>Amount</td>
                                                            <td>Date</td>
                                                            <td>Message</td>
                                                            <td align="center" >Action</td>
                                                      </tr>
                                                </thead>
                                                <tbody>
                                                      {tracks && tracks.map((n, i)=>{
                                                            return <tr>
                                                                  <td>
                                                                        <Avatar 
                                                                        name={n && n.wish.user && n.wish.user.name}
                                                                        username={n && n.wish.user && n.wish.user.username}
                                                                        src={n && n.wish.user && n.wish.user.avatar || "https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/"}
                                                                        />
                                                                  </td>
                                                                  <td>{n.wish.wishname}</td>
                                                                  <td>{format(n.amount)}</td>
                                                                  <td>{n.created_at}</td>
                                                                  <td>{`N/A`}</td>
                                                                  <td><SayThanks payment_id={n.id} /></td>
                                                            </tr>
                                                      })}
                                                </tbody>
                                          </table>
                                    </div>
                              </Tab>
                              <Tab eventKey="2" title="Subscriptions">
                                    22
                              </Tab>
                        </Tabs> 
                  </div>
                  </div>
            </Authenticated>
      );
}
