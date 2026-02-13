import { useState } from "react";

const Side = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
        className="fixed top-5 left-5 z-50 px-4 py-2 bg-black text-white rounded-[30px] md:rounded-[40px]   shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition"
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
        <h2 className="text-3xl font-extrabold mb-6 text-gray-900 select-text">
          Sidebar Menu
        </h2>
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

