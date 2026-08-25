import Avatar from '@/includes/Avatar'
import userphoto from "../../../assets/siteicon.png";
import Nocontent from '@/includes/Nocontent';
import { trackSearchClick } from "@/includes/Analytics";
import useBundleSection from './useBundle';

/**
 * The people who buy the most, ranked by HOW OFTEN — never by how much.
 *
 * 🚨 This panel replaced `LeaderboardStars` in the sidebar on 24 Aug 2026. That
 * one was headed "Top Supporters — fans who have shown the most support" while
 * its endpoint (`topGiftersAllTime`) actually returns the CREATOR behind each
 * of the largest recent payments, with the payment's AMOUNT — so a public page
 * was publishing a money figure beside a named account, which is the one thing
 * the board itself refuses to do (`'amount' => 0` in the row payload).
 *
 * ⚠️ It reads the shared bundle rather than firing its own request: the whole
 * point of `LeaderBoardController::bundle()` is that opening this page costs one
 * cached response, not seven heavy aggregates.
 */
export default function TopSupporters({grid = false}) {

  const { data: section, loading, error } = useBundleSection('top_supporters');
  const data = section?.data || [];

  const SupporterItem = ({ supporter, index }) => (
    <div className="rank py-3 border-b flex items-center justify-between">
      <div className="flex items-center justify-between">
        <div className="wisher wisher-rank">
          <Avatar
            role={supporter.role}
            profile_status_lock={supporter.profile_status_lock == 2 ? true : false}
            name={supporter.name}
            link={supporter.username || null}
            subhead={`@${supporter.username || "anonymous"}`}
            username={supporter.username || ""}
            src={supporter.avatar_url}
            onClick={() => trackSearchClick(supporter.id, supporter.username)}
          />
          <div className="index-badge">{index + 1}</div>
        </div>
      </div>
      <div className="rank-stats pl-2">
        <div className="text-right">
          <p className="toppercentage income font-semibold">
            {supporter.gift_count} {supporter.gift_count === 1 ? 'support' : 'supports'}
          </p>
          {/* 
          <p className="text-12 text-black/70" title={`Support types: ${supporter.support_types?.join(', ')}`}>
            {supporter.support_types?.length} {supporter.support_types?.length === 1 ? 'type' : 'types'}
          </p>
           */}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <svg className="animate-spin h-8 w-8 text-[#FF007F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
    {data && data.length > 0 ? <div className="bg-white rounded-box border-black p-4 mb-6">
      <h2 className="text-12 font-semibold uppercase tracking-[0.22em] text-black/70" title="Ranked by number of purchases, never by amount">
        Top supporters
      </h2>
      <p className="mb-3 text-13 text-black/70">Ranked by how often they buy, never by how much</p>
    
      {data && data.length ? (
        <>
        {grid ? 
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {data && data.map((supporter, index) => (
              <SupporterItem key={`${supporter.username}-${index}`} supporter={supporter} index={index} />
            ))}
          </div>
          :
          <>
            {data && data.map((supporter, index) => (
              <SupporterItem key={`${supporter.username}-${index}`} supporter={supporter} index={index} />
            ))}
          </>
        }
        </>
      ) : (
        <div className="my-4">
          <Nocontent classes="bg-white" text="No supporters yet" />
        </div>
      )}
    </div> : ''}
    </>
  );
}
