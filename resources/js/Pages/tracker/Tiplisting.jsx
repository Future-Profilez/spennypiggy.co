import { useEffect, useState } from "react";
import axios from 'axios';
import { Transition } from '@headlessui/react';
import PriceFormat from '@/includes/PriceFormat';
import { Link } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';
import TweetNow from './TweetNow';
import { TimeFormat } from '@/includes/TimeFormat';
import Avatar from '@/includes/Avatar';
const defaultsec = 'https://ucarecdn.com/55965522-e075-4ef3-8afc-195dacbf267b/';

export default function Tiplisting({ auth }) {
  const { formatMultiPrice } = PriceFormat();
  const [tips, setTips] = useState();

  const fetchTips = () => {
    axios
      .get(`user-tips`)
      .then((resp) => {
        setTips(resp.data.tips);
      })
      .catch((_err) => {
        console.error('error', _err);
      });
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const TipItem = ({ g }) => {
    const [open, setOpen] = useState(false);
    const openState = () => {
      setOpen(!open);
    };
    return (
      <>
        <div className="box shadow-pink rounded-lg p-3 mb-4 ">
          <div
            onClick={openState}
            className="cursor-pointer trackbar"
          >
            <div className="flex tip items-center justify-between">
              <div className="text-gray-900">
                {g.anonymous == 0 && g.sender == false ? (
                  <Avatar
                    name={`From : ${
                      g.anonymous == 1 && g.sender == false
                        ? 'Anonymous'
                        : g?.guest_name
                    }`}
                    subhead={
                      g.anonymous == 1 && g.sender == false
                        ? 'Email Address in private'
                        : `${g && g.guest_email}`
                    }
                    src={(g && g.creator.avatar_url) || defaultsec}
                  />
                ) : (
                  <Avatar
                    role={g && g.user && g.user.role}
                    profile_status_lock={g && g.user && g.user.profile_status_lock == 2 ? true : false}
                    name={`To : ${
                      (g && g.owner && g.owner.name) || g.guest_name
                    }`}
                    link={(g.owner && g.owner.username) || null}
                    src={(g && g.owner && g.owner.avatar_url) || defaultsec}
                    subhead={g && g?.owner?.email}
                  />
                )}
              </div>
              <div>
                <div className="angle-icon w-auto flex justify-end items-center">
                  <div>
                    {g && g.sender ? (
                      <div className="identity text-red-500 text-nowrap">
                        -
                        {formatMultiPrice(g.amount * (+g.quantity || 1),g?.tip_goal?.currency || g?.currency || 'gbp')}
                      </div>
                    ) : (
                      <div className="identity text-green-500 text-nowrap">
                        +
                        {formatMultiPrice(g.amount * (+g.quantity || 1),g?.tip_goal?.currency || g?.currency || 'gbp')}
                      </div>
                    )}
                    <p className="text-[13px] text-right">
                      <TimeFormat dateString={g && g && g.created_at} />
                    </p>
                  </div>
                  <div className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {' '}
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>{' '}
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        strokeLinejoin="round"
                      ></g>{' '}
                      <g id="SVGRepo_iconCarrier">
                        {' '}
                        <path
                          d="M12 14.5C11.9015 14.5005 11.8038 14.4813 11.7128 14.4435C11.6218 14.4057 11.5392 14.3501 11.47 14.28L8 10.78C7.90861 10.6391 7.86719 10.4715 7.88238 10.3042C7.89756 10.1369 7.96848 9.97954 8.08376 9.85735C8.19904 9.73515 8.352 9.65519 8.51814 9.63029C8.68428 9.6054 8.85396 9.63699 9 9.72003L12 12.72L15 9.72003C15.146 9.63699 15.3157 9.6054 15.4819 9.63029C15.648 9.65519 15.801 9.73515 15.9162 9.85735C16.0315 9.97954 16.1024 10.1369 16.1176 10.3042C16.1328 10.4715 16.0914 10.6391 16 10.78L12.5 14.28C12.3675 14.4144 12.1886 14.4931 12 14.5Z"
                          fill="#000000"
                        ></path>{' '}
                      </g>{' '}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Transition
            show={open}
            enter="transition-all duration-300 ease-out"
            enterFrom="transform scale-95 opacity-0 max-h-0"
            enterTo="transform scale-100 opacity-100 max-h-[1000px]"
            leave="transition-all duration-200 ease-in"
            leaveFrom="transform scale-100 opacity-100 max-h-[1000px]"
            leaveTo="transform scale-95 opacity-0 max-h-0"
          >
            <div id="example-collapse-text" className="">
              <div className="mt-3">
                <div className="border-t pt-3 mt-3  flex justify-between items-center">
                  <p className="mb-0 pr-2">Guest Email </p>
                  <p className="text-gray-500 text-sm">{g && g.guest_email}</p>
                </div>
                <div className="border-t pt-3 mt-3  flex justify-between items-center">
                  <p className="mb-0 pr-2">Guest Name </p>
                  <p className="text-gray-500 text-sm capitalize">
                    {g && g.guest_name}
                  </p>
                </div>
                <p className="text-gray-500 mb-1 mt-3 border-t pt-3 text-sm">
                  Tip Note
                </p>
                <p className="mb-2">{g && g.message}</p>
              </div>

              {g && !g.sender ? (
                <TweetNow type="tip-jar" id={g && g.uuid} />
              ) : (
                ''
              )}
            </div>
          </Transition>
        </div>
      </>
    );
  };

  return (
    <div className="tips ">
      {tips && tips.length ? (
        tips.map((g, i) => {
          return <TipItem g={g} />;
        })
      ) : (
        <Nocontent text="Nothing to see" />
      )}
    </div>
  );
}
