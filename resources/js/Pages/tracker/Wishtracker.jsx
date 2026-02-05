import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Tab, Transition } from '@headlessui/react';
import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { useState, Fragment } from 'react';
import axios from 'axios';
import Confetti from '@/includes/Confetti';
import Nocontent from '@/includes/Nocontent';
import userphoto from '../../../assets/siteicon.png';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useAlerts } from '@/Components/Alerts';
import BillsTracker from './BillsTracker';
import Tiplisting from './Tiplisting';
import TweetNow from './TweetNow';
import MembershipTracker from './MembershipTracker';
import { TimeFormat } from '@/includes/TimeFormat';
import GlobalCheckout from '../checkout/GlobalCheckout';
import ShopTracker from './Shoptracker';
const defaultsec = 'https://ucarecdn.com/55965522-e075-4ef3-8afc-195dacbf267b/';

export default function Wishtracker(props) {
    const { auth, user, tracks, user_subs, creator_subs, all_subscriptions, shop_payment } = props;
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const TruncatedString = ({ inputString, maxLength }) => {
    if (inputString?.length <= maxLength) {
      return <span>{inputString}</span>;
    }
    const truncatedString = `${inputString?.slice(0, 7)}..`;
    return <span>{truncatedString}</span>;
  };

  const { formatMultiPrice } = PriceFormat();

  const Wish = ({ n }) => {
    const [open, setOpen] = useState(false);
    const [isUserRead, setIsUserRead] = useState(n && n.is_read_user);
    const [isOwnerRead, setIsOwnerRead] = useState(n && n.is_read_owner);

    async function handleStatus(e) {
      setIsUserRead(1);
      e.preventDefault();
      axios
        .get(`/read-status/${n.id}/${n.sender ? 'user' : 'owner'}`)
        .then((resp) => {
          return true;
        })
        .catch((_err) => {
          console.error('error', _err);
          return true;
        });
    }

    const openState = () => {
      setOpen(!open);
    };

    async function controlStatus(e) {
      openState();
      setIsOwnerRead(1);
    }

    return (
      <Confetti
        sender={n && n.sender}
        is_read_owner={isOwnerRead}
        onclick={controlStatus}
        classes="w-full"
      >
        <div
          onClick={handleStatus}
          className="trackItem cursor-pointer shadow-pink box mb-4"
        >
          <div
            onClick={openState}
            aria-controls="example-collapse-text"
            aria-expanded={open}
            className=" cursor-pointer trackbar "
          >
            {n && !n.sender && isOwnerRead !== 1 ? (
              <div className="newwish justify-between py-2 flex items-center">
                <h2 className="granted-wish  font-GillSans ">
                  New Wish Granted. Tap to see
                </h2>
              </div>
            ) : (
              ''
            )}

            <div className="flex items-center justify-between">
              <div className="text-gray-900">
                {n.payment.anonymous == 1 && n && n.sender === false ? (
                  <Avatar
                    name={`Anonymous 11 `}
                    subhead={(n.wish && n.wish.wishname) || 'Surprise Gift'}
                    src={userphoto}
                  />
                ) : (
                  <Avatar
                    role={n && n.user && n.user.role}
                    profile_status_lock={n && n.user && n.user.profile_status_lock == 2 ? true : false}
                    name={`${
                      (n && n.user && n.user.name) || 'Anonymous 222'
                    }`}
                    link={(n.user && n.user.username) || null}
                    subhead={(n.wish && n.wish.wishname) || 'Surprise Gift'}
                    username={(n.user && n.user.username) || ''}
                    src={n?.user?.avatar_url || userphoto}
                  />
                )}
              </div>
              <div className="text-gray-500 rightbar flex items-center ">
                <div>
                  {n && n.sender ? (
                    <div className="identity text-red-600 whitespace-nowrap">
                      -
                      {formatMultiPrice(
                        n.amount * (+n.quantity || 1),
                        n.payment.currency
                      )}
                      {/* {formatMultiPrice(n.final_amount * (+n.quantity || 1), n.payment.currency)} */}
                    </div>
                  ) : (
                    <div className="identity text-green-600 whitespace-nowrap">
                      +
                      {formatMultiPrice(
                        n.amount * (+n.quantity || 1),
                        n.payment.currency
                      )}
                    </div>
                  )}
                  <p className="text-[13px] text-right">
                    <TimeFormat dateString={n && n.created_at} />
                  </p>
                </div>

                <div className="angle-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {' '}
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>{' '}
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
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
                {n && n.sender && !isUserRead ? (
                  <div className="counter_name">1</div>
                ) : (
                  ''
                )}
              </div>
            </div>
          </div>
          <div className="track-summary mt-4">
            <Transition
              show={open}
              enter="transition-all duration-300 ease-out overflow-hidden"
              enterFrom="transform opacity-0 max-h-0"
              enterTo="transform opacity-100 max-h-[1000px]"
              leave="transition-all duration-200 ease-in overflow-hidden"
              leaveFrom="transform opacity-100 max-h-[1000px]"
              leaveTo="transform opacity-0 max-h-0"
            >
            <div id="example-collapse-text">
              <div className="wishitem-des box border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="wish-item">
                      <img
                        src={(n.wish && n.wish.perma_link) || defaultsec}
                        alt="image"
                        className="max-w-full h-auto"
                      />
                    </div>
                    <div className="item-dd pl-3">
                      <p className="mb-0 pr-2">
                        {(n.wish && n.wish.wishname) || 'Surprise Gift'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        QTY : {n.quantity || 1} x{' '}
                        {formatMultiPrice(
                          n.amount,
                          n?.payment?.currency || 'gbp'
                        )}
                        {n && n.sender == false ? ' + VAT' : ''}
                      </p>
                    </div>
                  </div>
                  {n && n.cart_message ? (
                    <div className="border-t pt-3 mt-3 flex justify-between items-center">
                      <p className="mb-0 pr-2">Sender Note :</p>
                      <p className="text-gray-500 text-sm">
                        {n && n.cart_message}
                      </p>
                    </div>
                  ) : (
                    ''
                  )}
                  {n && n.surprise_message ? (
                    <div className="border-t pt-3 mt-3  flex justify-between items-center">
                      <p className="mb-0 pr-2">Message</p>
                      <p className="text-gray-500 text-sm">
                        {n && n.surprise_message}
                      </p>
                    </div>
                  ) : (
                    ''
                  )}
                  <div className="border-t pt-3 mt-3  flex justify-between items-center">
                    <p className="mb-0 pr-2">Paid in </p>
                    <p className="text-gray-500 text-sm">
                      {n && n.payment && n.payment.currency}
                    </p>
                  </div>
                  <div className="border-t pt-3 mt-3  flex justify-between items-center">
                    <p className="mb-0 pr-2">Guest Email </p>
                    <p className="text-gray-500 text-sm">
                      {(n && n?.payment?.user?.email) ||
                        (n && n?.payment?.guest_email) ||
                        'N/A'}
                    </p>
                  </div>
                  <div className="border-t pt-3 mt-3  flex justify-between items-center">
                    <p className="mb-0 pr-2">Guest Name </p>
                    <p className="text-gray-500 text-sm capitalize">
                      {n && n.payment.name}
                    </p>
                  </div>
                </div>

                {n && n.sender == false ? (
                  <TweetNow type="purchase" id={n && n.uuid} />
                ) : (
                  ''
                )}
              </div>
            </Transition>
            </div>
        </div>
      </Confetti>
    );
  };
  const [close, setClose] = useState();
  const [selectedCurrency, setSelectedCurrency] = useState();
  const [paymentData, setPaymentData] = useState({});
  const [checked, setChecked] = useState('plaid');
  const getVariables = (variables) => {
    setPaymentData(variables);
    setSelectedCurrency(variables.currency);
    setChecked(variables.checked);
  };
  const [paymentStarting, setPaymentStarting] = useState(false);

  const updateMetaData = (data) => {
    setPaymentStarting(true);
    router.get(route('wish.subscribe.handle.renew'), {
      preserveScroll: true,
      onSuccess: (resp) => {
        setClose(false);
        setTimeout(() => {
          setClose();
        }, 1000);
      },
      onError: (err) => {
        console.log(err);
      },
    });
  };

  function linkPlaidAccount(linkToken, id) {
    const linkHandler = window.Plaid.create({
      token: linkToken,
      onSuccess: function (public_token, metadata) {
        updateMetaData({
          id: id,
        });
      },
      onExit: function (err, metadata) {
        updateMetaData({
          id: id,
        });
        linkHandler.destroy();
      },
      onError: function (err, metadata) {
        updateMetaData({
          id: id,
        });
        linkHandler.destroy();
        setStarting(true);
      },
    });
    linkHandler.open();
  }

  const [starting, setStarting] = useState(true);
  const handleSubmit = (subscriptionUuid) => {
    setStarting(true);
    axios
      .post(
        `wish/checkout-renew/${subscriptionUuid}/${checked}/${selectedCurrency}`,
        {
          ...paymentData,
        }
      )
      .then((res) => {
        if (res.data.status) {
          if (res.data.link_token) {
            setTimeout(() => {
              setClose(false);
              setTimeout(() => {
                setClose();
              }, 1000);
            }, 2000);
            linkPlaidAccount(res.data.link_token, res.data.id);
          }
        } else {
          errorAlert(res.data.message || 'Something went wrong');
        }
      })
      .catch((err) => {
        errorsHandling(err);
        setStarting(true);
      });
  };

  return (
    <Authenticated auth={auth.user} user={user}>
      <Head title={'Wish Tracker'} />

      <div className=" wishtracker blackbg min-h-screen pb-5 pt-6">
        <div className="containerbox blackbg wishtracker-box px-4">

          <h2 className='font-gulfs uppercase text-white text-xl lg:text-3xl mb-6 lg:mt-6'>Wish Tracker</h2>

          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-white/10 p-1 mb-4 overflow-x-auto">
              {['Wish Payments', 'Subscriptions', 'Piggy Bank', 'Bills', 'Memberships', 'Shop'].map((tab) => (
                <Tab as={Fragment} key={tab}>
                  {({ selected }) => (
                    <button
                      className={`
                        min-w-fit px-4 rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors duration-200
                        ${selected ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'}
                      `}
                    >
                      {tab}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel className="pt-6">
              <div className="tracks ">
                {tracks &&
                  tracks.map((n, i) => {
                    return <Wish n={n} key={`track-${i}`} />;
                  })}
                {tracks && tracks.length < 1 ? (
                  <Nocontent text="nothing to see" />
                ) : (
                  ''
                )}
              </div>
            </Tab.Panel>
            <Tab.Panel className="pt-6">
              {paymentStarting ? (
                <div
                  className="h-screen flex items-center justify-center w-screen fixed top-0 left-0 bg-[#0005] z-[999999999999]"
                  role="status"
                >
                  <svg
                    aria-hidden="true"
                    className="w-16 h-16 text-gray-200 animate-spin  fill-[var(--main)]"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                </div>
              ) : (
                ''
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {all_subscriptions &&
                  all_subscriptions.map((s, i) => {
                    // Determine if this is a subscription purchased by the user or received by the user
                    const isPurchasedByUser = s.subscription_type === 'purchased';
                    
                    return (
                      <div
                        key={`subscription-${i}`}
                        className="mb-4"
                      >
                        <div className={`subsbox box p-4 border-2 ${isPurchasedByUser ? 'border-blue-600' : 'border-green-600'}`}>
                          {/* Subscription Type Badge */}
                          <div className="mb-3 flex justify-between items-center">
                            <h2 className="plantitle mb-0">
                              {s && s.wish_item && s.wish_item.wishname}
                            </h2>
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${isPurchasedByUser ? 'bg-blue-600' : 'bg-green-600'} ml-2`}>
                              {isPurchasedByUser ? '🛒 Purchased by me' : '💰 Purchased by others'}
                            </span>
                          </div>

                          {/* Show user info for subscriptions purchased by others */}
                          {!isPurchasedByUser && (
                            <div className="mb-3">
                              {s.anonymous == 1 ? (
                                <Avatar
                                  name={<TruncatedString inputString={'Anonymous'} maxLength={30} />}
                                  src={`${userphoto}`}
                                />
                              ) : (
                                <Avatar
                                  name={
                                    <TruncatedString
                                      inputString={(s && s.user && s.user.name) || 'Anonymous'}
                                      maxLength={30}
                                    />
                                  }
                                  username={`${(s && s.user && s.user.username) || 'Anonymous'}`}
                                  src={`${(s && s.user && s.user.avatar_url) || userphoto}`}
                                />
                              )}
                            </div>
                          )}

                          <ul className="pl-0 mt-3">
                            {isPurchasedByUser ? (
                              /* For subscriptions purchased by user, show creator info */
                              <li className="mt-2 flex justify-between border-t py-2">
                                <p className="text-gray-500">Creator</p>
                                <p className="text-gray-900 capitalize">
                                  <Link
                                    href={`/${
                                      (s && s.wish_item && s.wish_item.user && s.wish_item.user.username) || ''
                                    }`}
                                    className="text-violet-600"
                                  >
                                    {(s && s.wish_item && s.wish_item.user && s.wish_item.user.name) || 'Anonymous'}
                                  </Link>
                                </p>
                              </li>
                            ) : (
                              /* For subscriptions purchased by others, show subscriber info */
                              <li className="mt-2 flex justify-between border-t py-2">
                                <p className="text-gray-500">Subscriber</p>
                                <p className="text-gray-900 capitalize">
                                  {s.anonymous ? 'Anonymous' : (s && s.user && s.user.name) || 'Anonymous'}
                                </p>
                              </li>
                            )}
                            
                            <li className="mt-2 flex justify-between border-t py-2">
                              <p className="text-gray-500">Subscription Type</p>
                              <p className="text-gray-900 capitalize">
                                {s?.recurring_for == 'onetime' ? (
                                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-500 text-white">One-time</span>
                                ) : (
                                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-600 text-white">
                                    {s?.recurring_type === 'weekly' ? 'Weekly' :
                                     s?.recurring_type === 'monthly' ? 'Monthly' :
                                     s?.recurring_type === 'yearly' ? 'Yearly' :
                                     s?.recurring_type || 'N/A'}
                                  </span>
                                )}
                              </p>
                            </li>
                            
                            <li className="mt-2 flex justify-between border-t py-2">
                              <p className="text-gray-500">Price</p>
                              <p className="text-gray-900 capitalize">
                                {formatMultiPrice(s && s.amount, s.currency)}
                              </p>
                            </li>
                            
                            <li className="mt-2 flex justify-between border-t py-2">
                              <p className="text-gray-500">Start Date</p>
                              <p className="text-gray-900 capitalize">
                                {s && s.start_date}
                              </p>
                            </li>
                            
                            {s?.recurring_for !== 'onetime' && (
                              <li className="mt-2 flex justify-between border-t py-2">
                                <p className="text-gray-500">Next Payment</p>
                                <p className="text-gray-900 capitalize">
                                  {s && s.payment_upcoming}
                                </p>
                              </li>
                            )}
                            
                            <li className="mt-2 flex justify-between border-t py-2">
                              <p className="text-gray-500">Status</p>
                              <p className="text-gray-900 capitalize">
                                {s && s.status == 'paid' ? (
                                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-600 text-white">Active</span>
                                ) : (
                                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-yellow-500 text-white">{s && s.status}</span>
                                )}
                              </p>
                            </li>
                            
                            {/* Subscription Access Benefits - show for active paid subscriptions */}
                            {isPurchasedByUser && s.status === 'paid' && (
                              <li className="mt-2 flex justify-between border-t py-2">
                                <p className="text-gray-500">Access Status</p>
                                <p className="text-gray-900">
                                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-600 text-white">
                                    ✅ {s.recurring_for === 'onetime' ? '30-Day' : 'Ongoing'} Post Access
                                  </span>
                                </p>
                              </li>
                            )}
                          </ul>
                          
                          {/* View Exclusive Content Button - for users who purchased subscriptions */}
                          {isPurchasedByUser && s.status === 'paid' && (
                            <div className="mt-3">
                              <Link
                                href={`/${s.wish_item.user.username}?tab=feed`}
                                className="w-full flex justify-center items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none gap-2"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L3 7L12 12L21 7L12 2Z" />
                                  <path d="M3 17L12 22L21 17" />
                                  <path d="M3 12L12 17L21 12" />
                                </svg>
                                🎥 View Exclusive Content
                              </Link>
                            </div>
                          )}

                          {/* Action buttons - only for user's own subscriptions */}
                          {isPurchasedByUser && (
                            <>
                              {s.recurring_for !== 'onetime' ? (
                                <>
                                  {s.is_subscription_active === 0 || s.stripe_status !== 'active' ? (
                                    <GlobalCheckout
                                      action={close}
                                      classes={`btn-pink !bg-red-600 !text-white !border-red-900 sm w-full px-2 mt-3`}
                                      text={`RENEW`}
                                      finalsubmit={() => handleSubmit(s.uuid)}
                                      getVariables={getVariables}
                                    />
                                  ) : (
                                    <button className={`btn-pink disabled sm w-full px-2 mt-3`}>
                                      Active
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button className={`opacity-0 btn-pink disabled sm w-full px-2 mt-3`}>
                                  One Time Payment
                                </button>
                              )}
                            </>
                          )}
                          
                          {/* Tweet button for received subscriptions */}
                          {!isPurchasedByUser && (
                            <TweetNow type="subscription" id={s && s.uuid} />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {(!all_subscriptions || all_subscriptions.length < 1) ? (
                <Nocontent classes="mt-5" text={'No active subscriptions found'} />
              ) : (
                ''
              )}
            </Tab.Panel>
            <Tab.Panel className="pt-6">
              <Tiplisting />
            </Tab.Panel>
            <Tab.Panel className="pt-6">
              <BillsTracker auth={auth} />
            </Tab.Panel>
            <Tab.Panel className="pt-6">
              <MembershipTracker auth={auth} />
            </Tab.Panel>
            <Tab.Panel className="pt-6">
              <ShopTracker shop_payment={shop_payment} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        </div>
      </div>
    </Authenticated>
  );
}
