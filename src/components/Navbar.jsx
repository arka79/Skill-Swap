import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, logout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinkClasses = (path) =>
    `px-4 py-2 rounded-lg transition font-medium text-sm ${
      isActive(path)
        ? 'bg-indigo-600 text-white'
        : 'text-gray-300 hover:bg-indigo-700 hover:text-white'
    }`;

  return (
    <nav className="bg-indigo-800 shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/dashboard" className="text-white text-xl font-bold tracking-wide">
          🧠 SkillSwap
        </Link>

        {/* Nav Links */}
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className={navLinkClasses('/dashboard')}>
            Dashboard
          </Link>
          <Link to="/discover" className={navLinkClasses('/discover')}>
            Discover
          </Link>
          <Link to="/requests" className={navLinkClasses('/requests')}>
            Requests
          </Link>
          <Link to="/profile" className={navLinkClasses('/profile')}>
            Profile
          </Link>
          {user?.isAdmin && (
            <Link to="/admin" className={navLinkClasses('/admin')}>
              Admin
            </Link>
          )}

          {/* User + Logout */}
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-gray-100 text-sm">{user?.name}</span>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
