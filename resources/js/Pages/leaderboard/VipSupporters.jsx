import useBundleSection from './useBundle';
import { RiVipDiamondLine, RiStarLine, RiTrophyLine, RiUserStarLine, RiCalendarLine } from 'react-icons/ri';
import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { trackSearchClick } from "@/includes/Analytics";

export default function VipSupporters() {
    const { formatMultiPrice } = PriceFormat();
    // Shared with every other panel on the page — one request, not seven.
    const { data: section, loading, error, retry: fetchVipSupporters } = useBundleSection('vip_supporters');
    const vipSupporters = section?.data || [];

    const VipCard = ({ supporter }) => {
        const { vip_level } = supporter;
        const badgeStyle = {
            backgroundColor: vip_level.color,
            background: `linear-gradient(135deg, ${vip_level.color}20, ${vip_level.color}40)`,
            borderColor: vip_level.color,
        };

        // ⚠️ The tier edge is set INLINE. `border-black` is a full `border`
        // shorthand in this project, so a width class beside it is discarded
        // silently; an inline style cannot be.
        //
        // 🚨 A FULL FRAME, NOT A 4px RAIL DOWN ONE SIDE. A thick coloured side-tab
        // on a card is the banned device; the tier still reads as its own colour,
        // all the way round.
        //
        // ⚠️ A PLAIN LINE COMMENT — `{/* */}` between JSX attributes is not a
        // comment, it is a spread position, and it fails the build with
        // `Expected "..." but found "}"`.
        return (
            <div className="vip-card bg-white rounded-box border-black p-4 mb-4 transition-all duration-300"
                 style={{border: `2px solid ${vip_level.color}`}}>
                <div className="flex relative items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div className="absolute top-[-8px] left-[-8px] z-10 rank-badge flex h-7 w-7 items-center justify-center rounded-full bg-white font-gulfs text-13 leading-none text-black/70 ">
                            {supporter.rank}
                        </div>
                        <Avatar
                            name={supporter.name}
                            src={supporter.avatar_url}
                            role={supporter.role}
                            profile_status_lock={supporter.profile_status_lock}
                            username={supporter.username}
                            link={supporter.username}
                            size="md"
                            onClick={() => trackSearchClick(supporter.id, supporter.username)}
                        />
                        {/* <div className="flex flex-col">
                            <h3 className="font-semibold text-black text-13">{supporter.name}</h3>
                            <p className="text-12 text-black/80">@{supporter.username}</p>
                        </div> */}
                    </div>
                    
                </div>
                <div className="flex justify-between gap-3 text-center">
                    {/* 🚨 TWO COMMENTED-OUT TILES DELETED HERE (21 Aug 2026).
                        One rendered a gift-box glyph and the label "Gifts" — banned
                        vocabulary AND a banned icon on a payment-adjacent surface.
                        The other printed a supporter's TOTAL SPEND, which this
                        platform never sends to the client.

                        Neither was rendered, which is exactly why they were worth
                        removing: `Welcome.jsx`'s own header says it — dead copy is
                        the copy that gets pasted back in. One uncommented line away
                        from shipping both a compliance defect and a privacy leak. */}
                    <div className="stat-item">
                        <p className="font-bold text-black text-13">{supporter.creators_supported_count}</p>
                        <div className="flex items-center justify-center mb-1">
                            <RiUserStarLine size={16} className="text-blue-500 mr-1" />
                            {/* ⚠️ `creators_supported_count` is how many CREATORS this
                                person backs, not how many supporters they have. The old
                                label said the opposite of what the number means. */}
                            <span className="text-12 text-black/70">Creators backed</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <p className="font-bold text-black text-13">{Math.round(supporter.vip_score)}</p>
                        <div className="flex items-center justify-center mb-1">
                            <RiStarLine size={16} className="text-yellow-500 mr-1" />
                            <span className="text-12 text-black/70">VIP Score</span>
                        </div>
                    </div>
                </div>
                <div className="vip-badge flex   mt-3 text-center justify-center items-center px-3 py-1 rounded-full text-13 font-semibold" style={badgeStyle}>
                    <span className="mr-1">{vip_level.icon}</span>
                    <span style={{color: vip_level.color}}>{vip_level.level}</span>
                </div>

                {/* <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center text-12 text-black/70">
                        <RiCalendarLine size={14} className="mr-1" />
                        <span>Last support: {supporter.latest_support_date}</span>
                    </div>
                    <div className="flex space-x-1">
                        {supporter.support_types.map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-12 text-black/80 capitalize">
                                {type}
                            </span>
                        ))}
                    </div>
                </div> */}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-box border-black p-4 mb-6 flex justify-center items-center" style={{minHeight: '200px'}}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading VIP Supporters...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-box border-black p-4 mb-6 text-center">
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button 
                        className="button esm border-red-600 text-red-600 ml-2" 
                        onClick={fetchVipSupporters} >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return vipSupporters.length > 0 ? (
        <div className="bg-white rounded-box border-black p-4 mb-6">
            <h2 className="mb-1 text-start text-12 font-semibold uppercase tracking-[0.22em] text-black/70">
                VIP supporters
            </h2>
            <p className="mb-4 text-13 text-black/70">
                The people buying most often, over the last three months
            </p>

            <div className="space-y-3">
                <VipCard supporter={vipSupporters[0]} />
                {vipSupporters.slice(0, 5).map((supporter, index) => (
                    <div key={supporter.id} className={`${index === 0 ? 'hidden':""} fading  rank py-3 border-bottom flex items-center justify-between relative`}>
                        <div className="flex items-center space-x-3">
                            <div className="absolute top-2 left-1 z-10 rank-badge flex h-7 w-7 items-center justify-center rounded-full bg-white font-gulfs text-13 leading-none text-black/70 ">
                                {supporter.rank}
                            </div>
                            <Avatar
                                name={supporter.name}
                                src={supporter.avatar_url}
                                role={supporter.role}
                                profile_status_lock={supporter.profile_status_lock}
                                username={supporter.username}
                                link={supporter.username}
                                size="md"
                                onClick={() => { try { const payload = { creator_id: supporter.id, creator_username: supporter.username }; if (payload.creator_id || payload.creator_username) { axios.post('/analytics/search-click', payload); } } catch(_e) {} }}
                            />
                            {/* <div className="flex flex-col">
                                <h3 className="font-semibold text-black text-13">{supporter.name}</h3>
                                <p className="text-12 text-black/80">@{supporter.username}</p>
                            </div> */}
                        </div>
                        <div className="flexs items-center space-x-2">
                            <div className="text-13 text-center font-bold text-black">{Math.round(supporter.vip_score)}</div>
                            <div className="vip-badge flex items-center px-2 py-1 rounded-full text-12 font-semibold" 
                                 style={{ backgroundColor: supporter.vip_level.color + '20', borderColor: supporter.vip_level.color }}>
                                <span className="mr-1">{supporter.vip_level.icon}</span>
                                <span style={{color: supporter.vip_level.color}}>{supporter.vip_level.level}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* {vipSupporters.length > 5 && (
                <div className="text-center mt-4">
                    <p className="text-13 text-black/70">+ {vipSupporters.length - 5} more VIP supporters</p>
                </div>
            )} */}
        </div>
    ) : '';
}
