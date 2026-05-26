import { useState } from "react";
import { usePage, Link } from "@inertiajs/react";

const Side = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = usePage().props;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
        className="fixed top-5 left-5 z-50 px-4 py-2 bg-black text-white rounded-[30px]   shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition"
      >
        {isOpen ? 'Close' : 'Menu'}
      </button>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-lg rounded-r-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col p-8
          select-none
        `}
        aria-label="Sidebar navigation"
      >
        {auth?.user ? (
          <Link 
            href={route('user.show', { username: auth.user.username })}
            className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-[30px] border border-gray-100 hover:bg-gray-100 transition-colors group"
          >
            <img 
              src={auth.user.avatar_url} 
              alt={auth.user.name} 
              className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-gray-900 truncate">{auth.user.name}</span>
              <span className="text-sm text-gray-500 truncate">@{auth.user.username}</span>
            </div>
          </Link>
        ) : (
          <h2 className="text-3xl font-extrabold mb-6 text-gray-900 select-text">
            Sidebar Menu
          </h2>
        )}
        <nav className="flex flex-col space-y-4 text-gray-700">
          <a href="#" className="hover:text-gray-900 transition">
            Dashboard
          </a>
          <a href="#" className="hover:text-gray-900 transition">
            Projects
          </a>
          <a href="#" className="hover:text-gray-900 transition">
            Team
          </a>
          <a href="#" className="hover:text-gray-900 transition">
            Reports
          </a>
        </nav>
      </aside>
    </>
  );
};

export default Side;

