import Authenticated from '@/Layouts/AuthenticatedLayout';
import LazyVideo from '@/Components/LazyVideo';
import { Link, Head, usePage } from '@inertiajs/react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import userphoto from "../../../assets/siteicon.png";
import { FaCheckCircle, FaGift, FaStar, FaBolt, FaShoppingBag, FaHeart } from 'react-icons/fa';
import { useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';

export default function Thankyou(props) {

  const {owner, type, item_name, amount, currency, benefits, item_id, item_slug, is_instant, wish_content, success_page_type, ask_question, payment_id, source, source_id} = props;
  const { global_currency, auth, user } = usePage().props;
  const { errorAlert, successAlert } = useAlerts();

  const [marketingEmailsEnabled, setMarketingEmailsEnabled] = useState(
    Boolean(auth?.user?.marketing_emails_enabled),
  );
  const [marketingSaving, setMarketingSaving] = useState(false);

  useEffect(() => {
    setMarketingEmailsEnabled(Boolean(auth?.user?.marketing_emails_enabled));
  }, [auth?.user?.marketing_emails_enabled]);

  const updateMarketingEmailsEnabled = (nextValue) => {
    if (!auth?.user) {
      return;
    }

    const previous = marketingEmailsEnabled;
    setMarketingEmailsEnabled(nextValue);
    setMarketingSaving(true);

    axios
      .post(route("email.preferences.thankyou"), {
        marketing_emails_enabled: nextValue ? 1 : 0,
      })
      .then((res) => {
        if (res?.data?.status) {
          setMarketingEmailsEnabled(Boolean(res.data.marketing_emails_enabled));
          successAlert(res.data.message || "Saved.");
          return;
        }
        setMarketingEmailsEnabled(previous);
        errorAlert(res?.data?.message || "Something went wrong!");
      })
      .catch((err) => {
        setMarketingEmailsEnabled(previous);
        errorAlert(err.response?.data?.message || "Something went wrong!");
      })
      .finally(() => {
        setMarketingSaving(false);
      });
  };

  const normalizedWishContent = useMemo(() => {
    if (!wish_content) return null;
    if (typeof wish_content === 'string') {
      try {
        const parsed = JSON.parse(wish_content);
        return parsed;
      } catch {
        return { url: wish_content, name: 'Exclusive Reward', type: null };
      }
    }
    if (Array.isArray(wish_content)) return null;
    return wish_content;
  }, [wish_content]);

  const getTitle = () => {
    if (type === 'monthly_subscription') return <><span>Subscription</span> <span className="text-[#FF007F]">Successful!</span></>;
    if (type === 'wish' || type === 'support' || type === 'bill' || type === 'membership' || type === 'task' || type === 'shop' || type === 'piggy_pot') return <><span>Payment</span> <span className="text-[#FF007F]">Successful!</span></>;
    return <><span>Your gift</span> <span className="text-[#FF007F]">has been sent.</span></>;
  };

  const getSubTitle = () => {
    if (type === 'monthly_subscription') return 'Welcome to the Spenny Piggy platform.';
    if (type === 'wish' || type === 'support' || type === 'bill' || type === 'membership' || type === 'task' || type === 'shop' || type === 'piggy_pot') return 'Thank you for your purchase.';
    return 'Check your email for a receipt.';
  };

  const getIcon = () => {
    switch(type) {
      case 'wish': return <FaGift className="text-[40px] text-[#FF007F] mb-3 mx-auto" />;
      case 'bill': return <FaStar className="text-[40px] text-[#FF007F] mb-3 mx-auto" />;
      case 'membership': return <FaStar className="text-[40px] text-[#FF007F] mb-3 mx-auto" />;
      case 'task': return <FaBolt className="text-[40px] text-[#FF007F] mb-3 mx-auto" />;
      case 'shop': return <FaShoppingBag className="text-[40px] text-[#FF007F] mb-3 mx-auto" />;
      case 'support': return <FaHeart className="text-[40px] text-[#FF007F] mb-3 mx-auto" />;
      case 'piggy_pot': return <FaGift className="text-[40px] text-[#FF007F] mb-3 mx-auto" />;
      default: return <FaGift className="text-[40px] text-[#FF007F] mb-3 mx-auto" />;
    }
  }

  const getBenefits = () => {
    if (benefits) return benefits; // fallback to backend string
    switch(type) {
      case 'wish':
        return 'You have unlocked access to exclusive content.';
      case 'bill':
        return 'You have unlocked access to subscribers-only posts.';
      case 'membership':
        return 'You have unlocked access to member-only posts and creator perks.';
      case 'task':
        if (String(is_instant) === '1' || String(is_instant) === 'true') {
          return 'Your task item has been delivered instantly. You can check the details from the task page.';
        }
        return 'We will inform you when the creator fulfills the task.';
      case 'shop':
        if (String(is_instant) === '1' || String(is_instant) === 'true') {
          return 'Your digital item has been delivered instantly.';
        }
        return 'We will inform you when the creator updates the shop order.';
      case 'support':
        return 'You have unlocked access to supporters-only posts.';
      case 'piggy_pot':
        if (normalizedWishContent) return 'You have unlocked access to an exclusive reward.';
        return 'Thank you for supporting this creator.';
      default:
        return null;
    }
  };

  const benefitsText = getBenefits();

  const getExploreLink = () => {
    if (!owner) return null;
    switch(type) {
      case 'wish': return { url: `/${owner.username}/wishes`, text: 'Explore more wishes' };
      case 'membership': return { url: `/${owner.username}/memberships`, text: 'Explore more memberships' };
      case 'task': return { url: `/${owner.username}/tasks`, text: 'Explore more tasks' };
      case 'shop': return { url: `/${owner.username}/shop`, text: 'Explore more checkout' };
      case 'bill': return { url: `/${owner.username}/bills`, text: 'Explore more bills' };
      case 'piggy_pot': return { url: `/${owner.username}/piggy-pots`, text: 'Explore more piggy pots' };
      default: return { url: `/${owner.username}`, text: 'Explore more items' };
    }
  };

  const exploreLink = getExploreLink();

  const getMessageLink = () => {
    if (!owner) return null;
    if (type === 'wish' && item_id) return `/${owner.username}/wish/${item_id}`;
    if (type === 'wish') return `/${owner.username}/wishes`;
    if (type === 'membership') return `/${owner.username}/bills`; // membership confirmation message routes to bills page
    if (type === 'shop' && item_slug && item_id) return `/shop/item/${item_slug}/${item_id}`;
    if (type === 'task' && item_id) return `/task/${item_id}`;
    return `/${owner.username}`;
  };

  const messageLink = getMessageLink();

  const BenefitsContent = () => {
    let rewardLink = null;
    let rewardText = null;

    if (type === 'wish') {
      if (item_id) {
        rewardLink = `/${owner?.username}/wish/${item_id}`;
        rewardText = "Access Content";
      } else {
        rewardLink = `/${owner?.username}/wishes`;
        rewardText = "Access Content";
      }
    } else if (type === 'bill') {
      rewardLink = `/${owner?.username}`;
      rewardText = "See Creator's Subscriber-Only Posts";
    } else if (type === 'membership') {
      rewardLink = `/${owner?.username}`;
      rewardText = "See Creator's Members-Only Posts";
    } else if (type === 'support') {
      rewardLink = `/${owner?.username}`;
      rewardText = "See Creator's Supporters-Only Posts";
    } else if (type === 'shop') {
      rewardLink = `/shop?type=purchases`;
      rewardText = "Go to Order Details";
    } else if (type === 'task') {
      if (String(is_instant) === '1' || String(is_instant) === 'true') {
        if (item_id) {
          rewardLink = `/task/${item_id}`;
          rewardText = "Go to Task Detail Page";
        } else {
          rewardLink = `/task/dashboard?tab=purchases`;
          rewardText = "Go to Order Details";
        }
      } else {
        rewardLink = `/task/dashboard?tab=purchases`;
        rewardText = "Go to Order Details";
      }
    } else if (type === 'piggy_pot') {
      rewardLink = `/${owner?.username}/piggy-pots`;
      rewardText = "Explore Piggy Pots";
    }

    const [reply, setReply] = useState('');
    const [posting, setPosting] = useState(false);
    const [replySent, setReplySent] = useState(false);
    const inputRef = useRef();

    const sendReply = async () => {
        if (!reply.trim()) return;
        setPosting(true);
        axios
            .post(`/shop/answer-to-payment/${payment_id}`, {
                answer: reply,
            })
            .then((res) => {
                if (res.data.status) {
                    if (inputRef.current) inputRef.current.value = "";
                    setReply('');
                    successAlert(res.data.msg || res.data.message);
                    setReplySent(true);
                } else {
                    errorAlert(res.data.msg || res.data.message);
                }
                setPosting(false);
            })
            .catch((err) => {
                setPosting(false);
                errorAlert(err.response?.data?.message || "Something went wrong!");
            });
    };

    return (
      <div className="benefits-box !p-0 !border-0 !bg-transparent">
        <div className="benefits-title">BENEFITS INCLUDED</div>
        <div className="benefits-text">
          {success_page_type === 'url' ? (
            <a href={benefitsText} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
              {benefitsText}
            </a>
          ) : (
            benefitsText
          )}
        </div>

        {normalizedWishContent && (type === 'wish' || type === 'task' || type === 'shop' || type === 'piggy_pot') && (
          <div className="mt-4  shadow-sm">
            <h4 className="text-[#FF007F] font-black text-[11px] uppercase tracking-wider mb-2 flex items-center gap-2">
               <FaCheckCircle /> Exclusive Reward Unlocked
            </h4>
            
            {String(normalizedWishContent.type || '').includes('video') ? (
               <LazyVideo controls controlsList="nodownload" posterSrc={normalizedWishContent.url} fallback={owner?.avatar_url || userphoto} className="w-full max-h-[250px] object-contain rounded-lg border border-gray-200 bg-black">
                   <source src={normalizedWishContent.url} type={normalizedWishContent.type} />
                   Your browser does not support the video tag.
               </LazyVideo>
            ) : String(normalizedWishContent.type || '').includes('audio') ? (
               <audio controls controlsList="nodownload" className="w-full mt-2">
                   <source src={normalizedWishContent.url} type={normalizedWishContent.type} />
                   Your browser does not support the audio element.
               </audio>
            ) : (
               <a href={normalizedWishContent.url} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 hover:opacity-90 transition-opacity">
                   <img src={normalizedWishContent.url} alt={normalizedWishContent.name || "Exclusive Content"} className="w-full max-h-[250px] object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="p-4 block text-center text-sm font-bold text-gray-500">View Content</span>'; }} />
               </a>
            )}
            
            {normalizedWishContent.name && (
                <div className="mt-2 text-center text-xs text-gray-500 font-bold truncate px-2">
                    {normalizedWishContent.name}
                </div>
            )}
          </div>
        )}

        {ask_question && type === 'shop' && (
          <div className="mt-4 p-4 bg-white border-2 border-pink-200 rounded-xl shadow-sm">
            <h4 className="text-[#FF007F] font-black text-[11px] uppercase tracking-wider mb-2">
               Question from Creator
            </h4>
            <p className="text-sm font-semibold mb-3">{ask_question}</p>
            {!replySent ? (
              <div className="flex flex-col gap-2">
                <textarea
                  ref={inputRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-pink-500 focus:border-[#FF007F]"
                  rows="3"
                ></textarea>
                <button
                  onClick={sendReply}
                  disabled={posting || !reply.trim()}
                  className="bg-[#FF007F] text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-600 disabled:opacity-50 text-sm w-fit"
                >
                  {posting ? "Submitting..." : "Submit Answer"}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                <FaCheckCircle /> Your answer has been submitted.
              </div>
            )}
          </div>
        )}

        {rewardLink && !normalizedWishContent && (
          <div className="mt-3">
            <Link href={rewardLink} className="text-[#FF007F] font-bold hover:underline text-[13px] uppercase flex items-center gap-1">
              {rewardText} <FaCheckCircle className="text-[#FF007F]" />
            </Link>
          </div>
        )}
      </div>
    );
  };

    return (
        <Authenticated auth={auth?.user} user={user} >
            <Head title={"Thank You"} />
            <style>{`
            .thankyou-wrap{min-height:calc(100vh - 80px);background:#A2E4B8;padding:20px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;}
            .giftthank{background:#ffffff;border:3px solid #000;border-radius:30px;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);position:relative;overflow:hidden;width:100%;max-width:550px;margin:0 auto;}
            .details-box{background:#f9f9f9;border-radius:12px;padding:16px;margin-top:16px;text-align:left;border:2px solid #000;box-shadow:2px 2px 0px 0px rgba(0,0,0,1);}
            .details-box h3{margin-bottom:12px;font-weight:900;color:#000;text-transform:uppercase;font-size:0.9rem;letter-spacing:0.5px;display:flex;align-items:center;gap:8px;}
            .details-row{display:flex;justify-content:space-between;padding:6px 0;font-size:0.95rem;border-bottom:1px dashed #ccc;}
            .details-row:last-child{border-bottom:none;}
            .details-label{color:#555;font-weight:700;}
            .details-value{color:#000;font-weight:900;text-align:right;}
            .benefits-box{background:#fff0f6;border:2px solid #ff4fa0;border-radius:8px;padding:12px;margin-top:16px;}
            .benefits-title{color:#ff4fa0;font-weight:900;margin-bottom:4px;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.5px;}
            .benefits-text{color:#333;font-size:0.9rem;font-weight:600;line-height:1.4;}
            .avatar-container{position:relative;width:80px;height:80px;margin:0 auto;margin-top:16px;margin-bottom:20px;}
            .avatar-container::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px dashed #ff4fa0;animation:spin 10s linear infinite;}
            @keyframes spin{100%{transform:rotate(360deg);}}
            .action-btn{background:#ff4fa0;color:white;font-weight:900;border:3px solid #000;border-radius:999px;padding:12px 24px;display:inline-block;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);transition:all 0.2s;font-size:0.95rem;text-transform:uppercase;}
            .action-btn:hover{transform:translateY(2px);box-shadow:2px 2px 0px 0px rgba(0,0,0,1);}
            .explore-btn{background:#FEF08A;color:#000;border:3px solid #000;font-weight:900;border-radius:999px;padding:12px 24px;display:inline-block;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);transition:all 0.2s;font-size:0.95rem;text-transform:uppercase;}
            .explore-btn:hover{background:#fde047;transform:translateY(2px);box-shadow:2px 2px 0px 0px rgba(0,0,0,1);}
            `}</style>
             <div className='!py-12 thankyou-wrap'>
                <div className="mb-6 text-center ">
                  {getIcon()}
                  <h2 className='text-2xl md:text-4xl font-gulfs whitespace-nowrap text-black uppercase tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'>
                    {getTitle()}
                  </h2>
                  <p className='text-gray-800 font-bold text-sm md:text-base'>{getSubTitle()}</p>
                </div> 
                
                {type !== 'monthly_subscription' && (
                  <div className='giftthank'>
                    <div className="!border-r-0 !border-l-0 !border-t-0 border-b border-black flex items-center p-4 space-x-2 bg-gray-50">
                        <div className="w-3 h-3 rounded-full border-[2px] border-black bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full border-[2px] border-black bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full border-[2px] border-black bg-green-500"></div>
                    </div>
                    
                    <div className="p-6 sm:p-8 text-center">
                        <div className="!p-0 !mt-0 avatar-container" >
                                <LazyLoadImage
                                src={owner?.avatar_url || userphoto}
                                alt="image-avatar" className="img-fluid rounded-full w-full h-full object-cover border-[3px] border-black relative z-10"  effect="blur"
                                height={80}
                                width={80} />
                        </div>
                        <p className="text-green-600 text-gray-700 font-bold text-xl">
                            Thank you from Spenny Piggy on behalf of <span className="text-green-700 font-black">{owner?.name}</span>.
                        </p>


                        {(item_name || amount || benefitsText) && (
                        <div className="details-box !rounded-[30px] ">
                            <h3><FaCheckCircle className="text-green-500" /> Purchase Details</h3>
                            
                            {item_name && (
                            <div className="details-row">
                                <span className="details-label">Item</span>
                                <span className="details-value truncate max-w-[200px]" title={item_name}>{item_name}</span>
                            </div>
                            )}
                            
                            {amount && (
                            <div className="details-row">
                                <span className="details-label">Amount Paid</span>
                                <span className="details-value">{currency ? currency.toUpperCase() : ''} {amount}</span>
                            </div>
                            )}
                            
                            {benefitsText && (
                                <BenefitsContent />
                            )}
                        </div>
                        )}

                        <div className='w-full mt-6' >
                        <Link href={`/${owner?.username}`} className='text-[#FF007F] hover:text-[#FF007F] transition-colors font-black uppercase tracking-wide text-sm flex items-center justify-center gap-2 hover:underline decoration-2 underline-offset-4' >
                            <span>VISIT @{owner?.username?.toUpperCase()}'S PROFILE</span>
                        </Link>
                        </div>
                    </div>
                  </div>
                )}

                {type !== 'monthly_subscription' && (!auth || !auth.user) && (
                  <p className='mt-6 mb-2 text-center px-6 text-black text-sm font-black'>Please create an account to see the content you have purchased.</p>
                )}

                <div className="w-full max-w-[550px] mt-6">
                  {auth?.user ? (
                    <div className="bg-white border-[3px] border-black rounded-[22px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[12px] uppercase tracking-wider font-black text-black">
                            Marketing emails (optional)
                          </div>
                          <div className="text-xs text-gray-700 font-semibold mt-1">
                            Get occasional updates and offers. You can change this anytime in your email preferences.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateMarketingEmailsEnabled(!marketingEmailsEnabled)}
                          disabled={marketingSaving}
                          className={`relative inline-flex h-[30px] w-[54px] items-center rounded-full border-[3px] border-black transition-colors ${marketingEmailsEnabled ? "bg-[#FF007F]" : "bg-gray-300"} ${marketingSaving ? "opacity-60 cursor-not-allowed" : ""}`}
                          aria-pressed={marketingEmailsEnabled}
                          aria-label="Toggle marketing emails"
                        >
                          <span
                            className={`inline-block h-[20px] w-[20px] transform rounded-full bg-white border-[3px] border-black transition-transform ${marketingEmailsEnabled ? "translate-x-[24px]" : "translate-x-[4px]"}`}
                          />
                        </button>
                      </div>

                      <div className="mt-2 text-[11px] font-bold text-gray-600">
                        {marketingSaving ? "Saving..." : marketingEmailsEnabled ? "Enabled" : "Disabled"}
                        <span className="mx-2">•</span>
                        <a href="/email-preferences" className="text-[#FF007F] hover:underline">
                          Manage
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border-[3px] border-black rounded-[22px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 text-center">
                      <div className="text-[12px] uppercase tracking-wider font-black text-black">
                        Marketing emails (optional)
                      </div>
                      <div className="text-xs text-gray-700 font-semibold mt-1">
                        Create an account (or log in) to choose whether you want marketing emails.
                      </div>
                      <div className="mt-3 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                          href={route("login")}
                          className="px-6 py-2 border-[3px] border-black rounded-xl font-black bg-white text-black hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm uppercase"
                        >
                          Log in
                        </Link>
                        <Link
                          href={route("register")}
                          className="px-6 py-2 border-[3px] border-black rounded-xl font-black bg-[#FF007F] text-white hover:bg-pink-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm uppercase"
                        >
                          Create account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className='w-full max-w-[450px] mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center' >
                  {type === 'monthly_subscription' ? (
                    <Link className='action-btn w-full text-center' href={route('dashboard')}>
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      {exploreLink && (
                        <Link className='explore-btn w-full text-center' href={exploreLink.url}>
                          {exploreLink.text}
                        </Link>
                      )}
                      {(!auth || !auth.user) && (
                        <Link className='action-btn w-full text-center' href={route("register")}>
                          Create Account
                        </Link>
                      )}
                    </>
                  )}
                </div>

                {type !== 'monthly_subscription' && (
                    <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300 text-center w-full max-w-[550px]">
                        <h3 className="text-gray-800 font-bold mb-3 uppercase tracking-wider text-sm">Need help with your order?</h3>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {auth?.user ? (
                                <>
                                    <Link href={`/history?support_open=1&creator_username=${owner?.username}&support_type=contact&event_type=${type}${source && source_id ? `&source=${encodeURIComponent(source)}&source_id=${encodeURIComponent(source_id)}` : ''}`} className="px-6 py-2 border-2 border-black rounded-xl font-bold bg-white text-black hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm">
                                        Contact Creator
                                    </Link>
                                    <Link href={`/history?support_open=1&creator_username=${owner?.username}&support_type=refund&event_type=${type}${source && source_id ? `&source=${encodeURIComponent(source)}&source_id=${encodeURIComponent(source_id)}` : ''}`} className="px-6 py-2 border-2 border-black rounded-xl font-bold bg-white text-[#FF007F] hover:bg-pink-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm">
                                        Request Refund
                                    </Link>
                                </>
                            ) : (
                                <p className="text-sm text-gray-600 bg-white p-3 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    Please check your email receipt for options to contact the creator or request a refund.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Authenticated>
    )
}
