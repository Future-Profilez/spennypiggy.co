import React from 'react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import Collapse from 'react-bootstrap/Collapse';
import { useState } from 'react';
import axios from 'axios';
import Confetti from '@/includes/Confetti';
import Nocontent from '@/includes/Nocontent';
import userphoto from '../../../assets/img/userphoto.png';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useAlerts } from '@/Components/Alerts';
import BillsTracker from './BillsTracker';
import Tiplisting from './Tiplisting';
import TweetNow from './TweetNow';
import MembershipTracker from './MembershipTracker';
import { TimeFormat } from '@/includes/TimeFormat';
import GlobalCheckout from '../checkout/GlobalCheckout';
import ShopTracker from './Shoptracker';
const defaultsec = 'https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/';

export default function Wishtracker(props) {
    const { auth, user, tracks, user_subs, creator_subs, shop_payment } = props;
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const TruncatedString = ({ inputString, maxLength }) => {
    if (inputString?.length <= maxLength) {
      return <span>{inputString}</span>;
    }
    const truncatedString = `${inputString?.slice(0, 7)}..`;
    return <span>{truncatedString}</span>;
  };

  const { formatMultiPrice } = PriceFormat();
  const [stab, setStab] = useState(1);

  const handleTabs = (e) => {
    setStab(e);
  };

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
        classes="w-100"
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
              <div className="newwish justify-content-between py-2 d-flex align-items-center">
                <h2 className="granted-wish  font-GillSans ">
                  New Wish Granted. Tap to see
                </h2>
              </div>
            ) : (
              ''
            )}

            <div className="d-flex align-items-center justify-content-between">
              <div className="text-dark">
                {n.payment.anonymous == 1 && n && n.sender === false ? (
                  <Avatar
                    name={`From : Anonymous 11 `}
                    subhead={(n.wish && n.wish.wishname) || 'Surprise Gift'}
                    src={userphoto}
                  />
                ) : (
                  <Avatar
                    name={`From:${
                      (n && n.user && n.user.name) || 'Anonymous 222'
                    }`}
                    link={(n.user && n.user.username) || null}
                    subhead={(n.wish && n.wish.wishname) || 'Surprise Gift'}
                    username={(n.user && n.user.username) || ''}
                    src={n?.user?.avatar_url || userphoto}
                  />
                )}
              </div>
              <div className="text-muted rightbar d-flex align-items-center ">
                <div>
                  {n && n.sender ? (
                    <div className="identity text-danger text-nowrap">
                      -
                      {formatMultiPrice(
                        n.amount * (+n.quantity || 1),
                        n.payment.currency
                      )}
                      {/* {formatMultiPrice(n.final_amount * (+n.quantity || 1), n.payment.currency)} */}
                    </div>
                  ) : (
                    <div className="identity text-success text-nowrap">
                      +
                      {console.log(n)}
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
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>{' '}
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
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
          <Collapse in={open}>
            <div id="example-collapse-text">
              <div className="track-summary mt-4">
                <div className="wishitem-des box border rounded-lg">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="wish-item">
                      <img
                        src={(n.wish && n.wish.perma_link) || defaultsec}
                        alt="image"
                        className="img-fluid"
                      />
                    </div>
                    <div className="item-dd ps-3">
                      <p className="mb-0 pe-2">
                        {(n.wish && n.wish.wishname) || 'Surprise Gift'}
                      </p>
                      <p className="text-muted text-small">
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
                    <div className="border-top pt-3 mt-3 d-flex justify-content-between align-items-center">
                      <p className="mb-0 pe-2">Sender Note :</p>
                      <p className="text-muted text-small">
                        {n && n.cart_message}
                      </p>
                    </div>
                  ) : (
                    ''
                  )}
                  {n && n.surprise_message ? (
                    <div className="border-top pt-3 mt-3  d-flex justify-content-between align-items-center">
                      <p className="mb-0 pe-2">Message</p>
                      <p className="text-muted text-small">
                        {n && n.surprise_message}
                      </p>
                    </div>
                  ) : (
                    ''
                  )}
                  <div className="border-top pt-3 mt-3  d-flex justify-content-between align-items-center">
                    <p className="mb-0 pe-2">Paid in </p>
                    <p className="text-muted text-small">
                      {n && n.payment && n.payment.currency}
                    </p>
                  </div>
                  <div className="border-top pt-3 mt-3  d-flex justify-content-between align-items-center">
                    <p className="mb-0 pe-2">Guest Email </p>
                    <p className="text-muted text-small">
                      {(n && n?.payment?.user?.email) ||
                        (n && n?.payment?.guest_email) ||
                        'N/A'}
                    </p>
                  </div>
                  <div className="border-top pt-3 mt-3  d-flex justify-content-between align-items-center">
                    <p className="mb-0 pe-2">Guest Name </p>
                    <p className="text-muted text-small capitalize">
                      {n && n.payment.name}
                    </p>
                  </div>
                </div>

                {n && n.sender == false ? (
                  <TweetNow type="purchase" id={n && n.uuid} />
                ) : (
                  ''
                )}
                {/* <p className="mt-3 mb-2">Exclusive Rewards </p>
                {n && n.message_url ? (
                  <div className="message-media my-2">
                    <LazyLoadImage
                      src={n.message_url}
                      alt="image"
                      height={'100%'}
                      useIntersectionObserver={true}
                      effect="blur"
                      width={'100%'}
                    />
                  </div>
                ) : (
                  ''
                )} */}

                {/* {msgSent ? <div className="msgSent my-2 p-1" >
                                    <p className="mt-2" >Thank you note : </p>
                                    {approved == 0 ? <div className='mt-3 alert alert-warning  rounded p-2' >
                                        Thankyou message is waiting for approval. Currently only you can see this message.
                                    </div> : ''}

                                    <p className="text-muted">{msgSent}</p>
                                    {message_media ? <div className="message-media my-2" >
                                        {media_type == 'image' ?
                                            <LazyLoadImage
                                                src={message_url} alt="image"
                                                height={"100%"}
                                                useIntersectionObserver={true} effect="blur"
                                                width={"100%"}
                                            />
                                            :
                                            <video playsInline={false} controlsList="nodownload" controls src={message_url} />
                                        }
                                    </div> : ''}
                                </div> : ''}

                                {n && n.sender == false && !msgSent ?
                                    <SayThanks approvemsg={approvemsg} clearAction={open}
                                        getMessageStatus={getMessageStatus}
                                        name={n && n.user && n.user.name}
                                        payment_id={n.id} />
                                    : ''} */}
              </div>
            </div>
          </Collapse>
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
    const linkHandler = Plaid.create({
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
      <div className=" wishtracker blackbg min-h-screen pb-5">
        <div className="containerbox blackbg wishtracker-box px-4">
          <Tabs defaultActiveKey="1" id="tracker-tab" className="mb-4 ">
            <Tab eventKey="1" title="Wish Tracker">
              <div className="tracks mt-4 pt-4">
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
            </Tab>
            <Tab eventKey="2" title="Subscriptions">
              <div className="subsctabs d-block d-sm-flex mb-4">
                <button
                  onClick={() => handleTabs(1)}
                  className={`${stab == 1 ? 'active' : ''} me-3 btn mt-2`}
                >
                  Active{' '}
                </button>
                <button
                  onClick={() => handleTabs(0)}
                  className={`${stab == 0 ? 'active' : ''} me-3 btn mt-2`}
                >
                  My Purchased
                </button>
              </div>
              {paymentStarting ? (
                <div
                  className="h-screen flex items-center justify-center w-screen fixed top-0 left-0 bg-[#0005] z-[999999999999]"
                  role="status"
                >
                  <svg
                    aria-hidden="true"
                    class="w-16 h-16 text-gray-200 animate-spin  fill-[var(--main)]"
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

              {stab == 0 ? (
                <>
                  <div className="row">
                    {user_subs &&
                      user_subs.map((s, i) => {
                        return (
                          <div
                            key={`subscription-${i}`}
                            className="col-sm-6 mb-4"
                          >
                            <div className="subsbox box p-4">
                              <h2 className="plantitle">
                                {s && s.wish_item && s.wish_item.wishname}
                              </h2>
                              <ul className="ps-0 mt-3">
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Item Owner</p>
                                  <p className="text-dark text-capitalize">
                                    <Link
                                      href={`/${
                                        (s &&
                                          s.wish_item &&
                                          s.wish_item.user.username) ||
                                        ''
                                      }`}
                                      className="text-voilet"
                                    >
                                      {(s &&
                                        s.wish_item &&
                                        s.wish_item.user.name) ||
                                        'Anonymous'}
                                    </Link>
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">
                                    Subscription Period
                                  </p>
                                  <p className="text-dark text-capitalize">
                                    {s?.recurring_for == 'onetime'
                                      ? s?.recurring_for
                                      : s?.recurring_type}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Price</p>
                                  <p className="text-dark text-capitalize">
                                    {formatMultiPrice(
                                      s && s.amount,
                                      s.currency
                                    )}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Start Date</p>
                                  <p className="text-dark text-capitalize">
                                    {s && s.start_date}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Upcoming Payment</p>
                                  <p className="text-dark text-capitalize">
                                    {s && s.payment_upcoming}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Status</p>
                                  <p className="text-dark text-capitalize">
                                    {s && s.status == 'paid' ? (
                                      <span className="badge bg-success">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="badge bg-warning">
                                        {s && s.status}
                                      </span>
                                    )}
                                  </p>
                                </li>
                              </ul>

                              <>
                                {s.recurring_for !== 'onetime' ? (
                                  <>
                                    {s.is_subscription_active !== 0 ? (
                                      <GlobalCheckout
                                        action={close}
                                        classes={`btn-pink !bg-red-600 !text-white !border-red-900 sm w-100 px-2 mt-3`}
                                        text={`RENEW`}
                                        finalsubmit={() => handleSubmit(s.uuid)}
                                        getVariables={getVariables}
                                      />
                                    ) : (
                                      <button
                                        className={`btn-pink disabled sm w-100 px-2 mt-3`}
                                      >
                                        Active
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    className={` opacity-0 btn-pink disabled sm w-100 px-2 mt-3`}
                                  >
                                    One Time Payment
                                  </button>
                                )}
                              </>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {user_subs && user_subs.length < 1 ? (
                    <Nocontent classes="mt-5" text={'nothing to see'} />
                  ) : (
                    ''
                  )}
                </>
              ) : (
                <>
                  <div className="row">
                    {creator_subs &&
                      creator_subs.map((s, i) => {
                        return (
                          <div
                            key={`subscription-${i}`}
                            className="col-sm-6 mb-4"
                          >
                            <div className="subsbox box p-3">
                              {s.anonymous == 1 ? (
                                <Avatar
                                  name={
                                    <TruncatedString
                                      inputString={'Anonymous'}
                                      maxLength={30}
                                    />
                                  }
                                  src={`${userphoto}`}
                                />
                              ) : (
                                <Avatar
                                  name={
                                    <TruncatedString
                                      inputString={
                                        (s && s.user && s.user.name) ||
                                        'Anonymous'
                                      }
                                      maxLength={30}
                                    />
                                  }
                                  username={`${
                                    (s && s.user && s.user.username) ||
                                    'Anonymous'
                                  }`}
                                  src={`${
                                    (s && s.user && s.user.avatar_url) ||
                                    userphoto
                                  }`}
                                />
                              )}

                              <ul className="ps-0 mt-3">
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">
                                    Subscription Item
                                  </p>
                                  <p className="text-dark text-capitalize wishname-text">
                                    {s && s.wish_item && s.wish_item.wishname}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">
                                    Subscription Period
                                  </p>
                                  <p className="text-dark text-capitalize">
                                    {s &&
                                      s.wish_item &&
                                      s.wish_item.subscription_period}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Price</p>
                                  <p className="text-dark text-capitalize">
                                    {formatMultiPrice(
                                      s && s.wish_item && s.wish_item.price,
                                      s.currency
                                    )}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Upcoming Payment</p>
                                  <p className="text-dark text-capitalize">
                                    {s && s.payment_upcoming}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Start Date</p>
                                  <p className="text-dark text-capitalize">
                                    {s && s.start_date}
                                  </p>
                                </li>
                                <li className="mt-2 d-flex justify-content-between border-top py-2">
                                  <p className="text-muted">Status</p>
                                  <p className="text-dark text-capitalize">
                                    {s && s.status == 'paid' ? (
                                      <span className="badge bg-success">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="badge bg-warning">
                                        {s && s.status}
                                      </span>
                                    )}
                                  </p>
                                </li>
                              </ul>

                              <TweetNow type="subscription" id={s && s.uuid} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {creator_subs && creator_subs.length < 1 ? (
                    <Nocontent classes="mt-5" text={'nothing to see'} />
                  ) : (
                    ''
                  )}
                </>
              )}
            </Tab>
            <Tab eventKey="3" title="Piggy Bank">
              <Tiplisting />
            </Tab>
            <Tab eventKey="4" title="Bills">
              <BillsTracker auth={auth} />
            </Tab>
            <Tab eventKey="5" title="Memberships">
              <MembershipTracker auth={auth} />
            </Tab>
            <Tab eventKey="6" title="Shop">
              <ShopTracker shop_payment={shop_payment} />
            </Tab>
          </Tabs>
        </div>
      </div>
    </Authenticated>
  );
}
