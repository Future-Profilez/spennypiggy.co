import { Link, router, usePage } from "@inertiajs/react";
import { route } from 'ziggy-js';
import { RetroHomeIcon, RetroCartIcon, RetroSearchIcon, RetroUserIcon } from '../Components/RetroIcons';
import '../../css/retro-bottombar.css';

export default function BottomBar(){
   const count = 0;
   // ⚠️ `auth` is on props; `url` is on the page object itself.
   const { props, url } = usePage();
   const auth = props?.auth;
   const username = auth?.user?.username;

   // Only a creator has anything to list. A supporter opening the chooser would
   // be shown six ways to sell on an account that cannot sell.
   const canAdd = auth?.user?.role === 1 && username;

   // ⚠️ Read from the CURRENT render, never from state seeded in an effect. This
   // used to be `useState` filled by a `useEffect` keyed on [auth, ziggy] — neither
   // changes on an Inertia navigation, so the highlight stuck wherever the bar
   // first mounted and the nav told you that you were somewhere you were not.
   const path = (url || "/").split("?")[0];
   const active = path.startsWith("/cart") ? "cart"
      : path.startsWith("/discover") ? "discover"
      : path.startsWith("/account") ? "account"
      : username && (path === `/${username}` || path.startsWith(`/${username}/`)) ? "home"
      // ⚠️ Deliberately nothing. The old code defaulted to "home" everywhere, so on
      // My Listings, the financial dashboard and every other screen the bar claimed
      // you were on your profile. A nav with nothing lit is honest; a nav pointing
      // at the wrong place is worse than no nav.
      : null;

   // The chooser lives on the creator's own profile (Dashboard.jsx `Toggle`) and
   // listens for `toggleAddOptions`. That listener only exists while that page is
   // mounted, so from anywhere else we send them there with `?add=menu` — the same
   // entry point My Listings uses. Dispatching from another page would do nothing
   // at all, silently.
   const openAddOptions = () => {
      const onOwnProfile = path === `/${username}` || path.startsWith(`/${username}/`);

      if (onOwnProfile) {
         window.dispatchEvent(new Event("toggleAddOptions"));
         return;
      }
      router.visit(`/${username}?add=menu`);
   };

   if (!auth || !auth.user) return null;

   return (
      <nav
         aria-label="Main"
         className="fixed md:hidden retro-bottom-bar flex flex-col justify-center bg-[#FF007F]"
      >
         {/* No vertical padding here — the row's own height IS the bar's height
             (see `--sp-bottombar-h`), and padding on this element would put the
             two out of step. */}
         <div className="relative z-10 mx-auto flex w-full max-w-lg items-stretch">
            <Link
               href={`/${username}`}
               as="button"
               aria-label="Your page"
               aria-current={active === 'home' ? 'page' : undefined}
               className={`retro-nav-button ${active === 'home' ? 'active' : ''}`}
            >
               <RetroHomeIcon size={22} isActive={active === 'home'} />
               <span className="retro-nav-label">Home</span>
            </Link>

            <Link
               href={route("cart")}
               as="button"
               aria-label="Basket"
               aria-current={active === 'cart' ? 'page' : undefined}
               className={`retro-nav-button ${active === 'cart' ? 'active' : ''}`}
            >
               <RetroCartIcon size={22} isActive={active === 'cart'} count={count || 0} />
               <span className="retro-nav-label">Basket</span>
            </Link>

            {/* The bar's one action, centred: reachable with either thumb, and the
                only thing here that is not a place. Deliberately unlabelled —
                the circle already says "do something" where every squircle says
                "go somewhere", and a fifth word would flatten that. */}
            {canAdd && (
               <button
                  type="button"
                  onClick={openAddOptions}
                  aria-label="Add something to sell"
                  className="retro-nav-add"
               >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                     <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
               </button>
            )}

            <Link
               href={route("discover")}
               aria-label="Discover creators"
               aria-current={active === 'discover' ? 'page' : undefined}
               className={`retro-nav-button ${active === 'discover' ? 'active' : ''}`}
            >
               <RetroSearchIcon size={22} isActive={active === 'discover'} />
               <span className="retro-nav-label">Discover</span>
            </Link>

            <Link
               href={'/account'}
               as="button"
               aria-label="Your account"
               aria-current={active === 'account' ? 'page' : undefined}
               className={`retro-nav-button ${active === 'account' ? 'active' : ''}`}
            >
               <RetroUserIcon size={22} isActive={active === 'account'} />
               <span className="retro-nav-label">Account</span>
            </Link>
         </div>
      </nav>
   );
}
