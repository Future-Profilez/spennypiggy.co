import { useEffect, lazy, useState, useRef } from "react";
import { useAlerts } from "@/Components/Alerts";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import axios from "axios";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import { FaHouseChimneyUser } from "react-icons/fa6";
import PriceFormat from "@/includes/PriceFormat";
import { router, usePage } from "@inertiajs/react";

// Lazy-loaded components
const Popup = lazy(() => import('@/Components/Popup'));

const memberships = [
  {
    'title': "Bronze Level",
    'value': "bronze"
  },
  {
    'title': "Silver Level",
    'value': "silver"
  },
  {
    'title': "Gold Level",
    'value': "gold"
  },
  {
    'title': "Platinum Level",
    'value': "platinum"
  },
  {
    'title': "Lifetime",
    'value': "lifetime"
  }
];

const membershipBenifits = [
  {
    'title':'Green Circle Insta',
    'value':'green_circle_insta'
  },
  {
    'title':'Insta Broadcast ',
    'value':'insta_broadcast'
  },
  {
    'title':'⁠Telegram Group',
    'value':'telegram_group'
  },
  {
    'title':' ⁠X Community ',
    'value':'x_community '
  },
  {
    'title':'⁠Monthly Content Bundle',
    'value':'monthly_content_bundle'
  },
  {
    'title':'Weekly Content Bundle',
    'value':'weekly_content_bundle'
  },
  {
    'title':'⁠Weekly DM chat',
    'value':'weekly_DM_chat'
  },
  {
    'title':'Monthly DM chat',
    'value':'monthly_DM_chat'
  },
  {
    'title':'Monthly Video call',
    'value':'monthly_video_call'
  },
  {
    'title':'Weekly Video call',
    'value':'weekly_video_call'
  },
];

export default function AddMembership({updateState, item, text, classes}) {
  const { auth, global_currency } = usePage().props;
  const memberOnlyPostsCount = auth?.member_only_posts_count || 0;
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
  const defaultCurrency = (auth && auth.user && auth.user.default_currency) || "USD";
  const uploaderRef = useRef();
  const resetUploader = () => {
      if (uploaderRef.current) {
          uploaderRef.current.reset();
      }
  };

  const [close, setClose] = useState();
    const [step, setStep] = useState(1);
  function selectRewards(e){
    const checkboxes = document.getElementsByName("rewards");
    let result = [];
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        result.push(checkboxes[i].value);
      }
    };
    setData({ ...data, rewards: result });
  }

    const [thumb, setThumb] = useState(null);
    const [ data, setData] = useState({
      level: '',
      month_price: '',
      rewards: '',
    });


    let nameattr, valueattr;
    const handleInput = (e) => {
        nameattr = e.target.name;
        valueattr = e.target.value;
        setData({ ...data, [nameattr]: valueattr });
    }

    const [isEditable, setIsEditable ] = useState(false);
    async function getFileUID(thumbs){
      setThumb(thumbs.uuid || "");
      setIsEditable(true);
    };

    const imageEdited = async (d,uuid) => {
        const url = `${uuid}/${d.cdnUrlModifiers}-/preview/`
        setIsEditable(false);
        setThumb(url);
    };

    useEffect(()=>{
      if(item){
        setData({
          level: item.level || '',
          month_price: item.price || '',
          rewards: item.rewards || ''
        });
      }
    },[item]);


    const [loading, setLoading] = useState(false);
    const AddMembership = (e) => {
        e.preventDefault();
        setLoading(true);
        axios.post(`/membership/save`, {...data, thumbnail: thumb}).then((resp)=>{
          if(resp.data.status) {
            successAlert(resp.data.msg) 
            setClose(false);
            window.dispatchEvent(new Event("closeAddOptions"));
            setTimeout(() => {
              setClose();
            }, 100);
            resetUploader();
            router.visit(route('user.show', { username: auth?.user?.username, page: 'memberships' }), {
              preserveState: true,
              preserveScroll: true,
            });
          } else {
            if(resp.data.errors){
              Object.entries(resp.data.errors).forEach(([key, value]) => {
                  errorAlert(value);
                });
              } else {
                errorAlert(resp.data.msg);
            }
          }
          setLoading(false);
        }).catch(err => {
          console.error("err", err);
          setLoading(false);
        });
    };
    const AddItem = () => {
      return <div className="flex items-center !w-full">
          <div className="p-1 !rounded-[30px] bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]" >
              <FaHouseChimneyUser color="var(--pink)"  size="1.5rem" />
          </div>
          <div className="pl-3 text-left">
              <h2 className="text-lg font-normal font-GillSans uppercase">Add Membership Tier</h2>
              <p className="text-sm font-poppins">Let fans support you monthly</p>
          </div>
      </div>
    }

    return (
        <Popup
            modalclass="full sendSurprize-modal pl-0"
            space="4" size="md"
            bt
            action={close} classes={classes ? classes : `addop w-full font-bold  bg-white rounded-[30px]  p-3 mb-2 text-center`}
            text={text ? text : <AddItem  />} >
              <div className="addgoal bg-white rounded-[30px] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 overflow-hidden relative" >
                <h2 className="uppercase font-black text-2xl pb-4 font-large text-center border-b-2 border-gray-100 mb-4">Add Membership</h2>

                    <div className="flex flex-wrap" >
                      {/* Step Indicator */}
                      <div className="w-full mb-8 mt-4">
                        <div className="flex justify-between items-center relative px-6">
                          <div className="absolute left-6 right-6 top-1/2 h-2 bg-black -z-10 -translate-y-1/2 rounded-full"></div>
                          <div className="absolute left-6 top-1/2 h-2 bg-[#ff4fa0] -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : 'calc(100% - 3rem)' }}></div>
                          
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border-[3px] border-black transition-all duration-300 ${step >= 1 ? 'bg-[#ff4fa0] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'}`}>1</div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border-[3px] border-black transition-all duration-300 ${step >= 2 ? 'bg-[#ff4fa0] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'}`}>2</div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border-[3px] border-black transition-all duration-300 ${step >= 3 ? 'bg-[#ff4fa0] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'}`}>3</div>
                        </div>
                      </div>

                      {/* Step 1 */}
                      {step === 1 && (
                          <div className="w-full mb-4">
                              <label className="block text-left mb-2 text-lg font-semibold text-gray-800">Choose Membership Level</label>
                              <p className="text-left text-sm text-gray-500 mb-4">Select the tier that best fits your new membership offering.</p>
                              <div className="flex flex-col gap-4" >
                                  {memberships && memberships.map((m, i)=>{
                                    const isSelected = data?.level === m.value;
                                    const getTierIcon = (val) => {
                                      switch(val) {
                                        case 'bronze': return '🥉';
                                        case 'silver': return '🥈';
                                        case 'gold': return '🥇';
                                        case 'platinum': return '💎';
                                        case 'lifetime': return '👑';
                                        default: return '⭐';
                                      }
                                    };
                                    const getTierDescription = (val) => {
                                      switch(val) {
                                        case 'bronze': return 'A great starting point for your casual fans.';
                                        case 'silver': return 'Step it up with more exclusive perks.';
                                        case 'gold': return 'Premium access for your loyal supporters.';
                                        case 'platinum': return 'The ultimate VIP experience.';
                                        case 'lifetime': return 'One-time payment for endless access.';
                                        default: return 'Awesome membership tier.';
                                      }
                                    };
                                    const getTierBg = (val) => {
                                      switch(val) {
                                        case 'bronze': return 'bg-[#FFE4B5]';
                                        case 'silver': return 'bg-[#E2E8F0]';
                                        case 'gold': return 'bg-[#FEF08A]';
                                        case 'platinum': return 'bg-[#E9D5FF]';
                                        case 'lifetime': return 'bg-[#FBCFE8]';
                                        default: return 'bg-white';
                                      }
                                    };
                                    return <div key={`membership-${i}`} className="relative" >
                                      <input className="cursor-pointer hidden"
                                      type="radio" id={m.value} value={m.value} name="level"
                                      onChange={handleInput} checked={isSelected} />
                                      <label 
                                        className={`cursor-pointer flex items-center p-3 rounded-[30px] border-[3px] border-black transition-all duration-200 ${isSelected ? "shadow-[2px_2px_0px_0px_#ff4fa0] border-[#ff4fa0] translate-y-[2px] " + getTierBg(m.value) : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white"}`} 
                                        htmlFor={m.value}
                                      >
                                          <div className={`w-[50px] h-[50px] flex-shrink-0 rounded-[30px] flex items-center justify-center text-2xl mr-4 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isSelected ? 'bg-white' : getTierBg(m.value)}`}>
                                              {getTierIcon(m.value)}
                                          </div>
                                          <div className="flex flex-col text-left">
                                              <span className={`uppercase font-black text-lg leading-tight ${isSelected ? 'text-[#ff4fa0]' : 'text-black'}`}>
                                                {m.title}
                                              </span>
                                              <span className="text-sm font-medium text-gray-600">
                                                {getTierDescription(m.value)}
                                              </span>
                                          </div>
                                      </label>
                                    </div>
                                  })}
                              </div>
                              <button 
                                onClick={() => setStep(2)} 
                                disabled={!data.level} 
                                className="mt-6 w-full py-3 rounded-full text-lg font-black uppercase tracking-wider transition-all duration-200 bg-[#ff4fa0] text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                              >
                                Next Step
                              </button>
                          </div>
                      )}

                      {/* Step 2 */}
                      {step === 2 && (
                          <div className="w-full">
                              <div className="w-full mb-4">
                                  <label className="block text-left mb-2 text-lg font-semibold text-gray-800">{(data && data.level =='lifetime' ? "Lifetime membership price" : 'Monthly Price') + ` (${defaultCurrency})`}</label>
                                  <div className="relative  currency-wrapper dollar-simbols" >
                                    <span className="currency-tag">{defaultCurrency}</span>
                                    <input className="border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 w-full focus:outline-none focus:border-[#FF007F] transition-all font-bold"
                                        onChange={handleInput} defaultValue={item && item.price || ''}
                                        type="number" name="month_price"
                                        placeholder={data && data.level =='lifetime' ? "Enter Lifetime membership price" : 'Enter monthly price.. '}  />
                                  </div>
                                  {data.month_price > 0 && (
                                    <div className="mt-4 p-4 bg-[#BAE6FD] rounded-[20px] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600">Fans pay:</span>
                                            <span className="font-bold text-gray-900">
                                                {new Intl.NumberFormat('en-GB', { 
                                                    style: 'currency', 
                                                    currency: defaultCurrency 
                                                }).format(calculateTotalSupporterPays(data.month_price, defaultCurrency).total_supporter_pays)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">You receive:</span>
                                            <span className="font-bold text-green-600">
                                                {new Intl.NumberFormat('en-GB', { 
                                                    style: 'currency', 
                                                    currency: defaultCurrency 
                                                }).format(data.month_price)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 font-medium">Fans only see the total price to improve conversion</p>
                                        <p className="mt-1 text-xs text-gray-500 font-medium">Our fee is 19%. Uplift will show higher due to stripe / conversions to ensure you always receive 100% or slightly more.</p>
                                    </div>
                                  )}
                                  {defaultCurrency !== global_currency && data.month_price > 0 && (
                                    <p className="mt-1 text-sm text-gray-500">
                                      ≈ {formatMultiPrice(
                                          data.month_price,
                                          defaultCurrency
                                      )} ({global_currency})
                                  </p>)}
                              </div>

                              <div className="w-full mb-4">
                              <label className="block text-left mb-1 text-lg font-semibold text-gray-800">Thumbnail</label>
                                <p className="text-gray-500 mb-3 text-left text-sm" >This is not required, but it can be a nice way to build your brand or make the offering more attractive.</p>

                                <div className={`${!isEditable ? '' : 'hidden'} editable`} >
                                  <GlobalUploader type='minimal'
                                    ref={uploaderRef} ctxName='add-membership-context'
                                    sendFile={getFileUID}
                                    options={st.membership}
                                  />
                                </div>
                                <div className={`${isEditable ? '' : 'hidden'} editable`} >
                                    <UploadcareEditor setIsEditable={setIsEditable} uuid={thumb} updateFile={imageEdited}  />
                                </div>

                              </div>

                              <div className="flex gap-3 mt-6">
                                  <button onClick={() => setStep(1)} className="w-1/3 py-3 rounded-full text-lg font-black uppercase tracking-wider transition-all duration-200 bg-[#FEF08A] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Back</button>
                                  <button 
                                    onClick={() => setStep(3)} 
                                    disabled={!data.month_price} 
                                    className="w-2/3 py-3 rounded-full text-lg font-black uppercase tracking-wider transition-all duration-200 bg-[#ff4fa0] text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                  >
                                    Next Step
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* Step 3 */}
                      {step === 3 && (
                          <div className="w-full">
                              <label className="block text-left mb-2 text-lg font-semibold text-gray-800">Choose Membership Rewards</label>
                              <p className="text-left text-sm text-gray-500 mb-4">Select the perks your fans will receive with this tier.</p>
                              
                              <div className="flex memberships-lists flex-wrap gap-3 mb-6">
                                {membershipBenifits && membershipBenifits.map((m, i)=>{
                                  return <div className="member-reward text-left" key={`reward-${i}`}>
                                      <input className="cursor-pointer hidden"
                                      type="checkbox" id={m.value} value={m.value} name="rewards"
                                      onChange={selectRewards} />
                                      <label className={`cursor-pointer capitalize px-4 py-2 rounded-full text-sm font-bold border-[2px] border-black transition-all duration-200 block ${data.rewards && data.rewards.includes(m.value) ? "bg-[#A7F3D0] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px]" : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"}`} htmlFor={m.value}>
                                          {m.title}
                                      </label>
                                    </div>
                                })}
                              </div>

                              <div className="flex gap-3 mt-8">
                                  <button onClick={() => setStep(2)} className="w-1/3 py-3 rounded-full text-lg font-black uppercase tracking-wider transition-all duration-200 bg-[#FEF08A] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Back</button>
                                  <button onClick={AddMembership} disabled={loading || (!item && memberOnlyPostsCount === 0)}
                                      className="flex w-2/3 items-center justify-center py-3 rounded-full text-lg font-black uppercase tracking-wider transition-all duration-200 bg-[#ff4fa0] text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"  >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                            Processing...
                                        </span>
                                    ) : (item ? "Update Membership" : "Create Membership")}
                                  </button>
                              </div>
                              {!item && memberOnlyPostsCount === 0 && (
                                  <p className="mt-4 text-center text-red-500 text-sm">
                                      You haven't added any member-only posts yet. Please create at least one before adding a membership.
                                  </p>
                              )}
                          </div>
                      )}

                    </div>


              </div>
        </Popup>
    );
}
