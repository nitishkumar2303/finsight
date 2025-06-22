import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { BrowserRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaClock,
  FaStar,
  FaBell,
  FaUser,
  FaBars,
} from "react-icons/fa";

const Header = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".user-dropdown")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 z-50 w-full border-t-[0.5px] border-b-[0.5px] border-neutral-600 bg-[rgb(33,33,34)]  text-white h-14 flex items-center px-4 md:px-6 justify-between">
      {/* Left - Logo + Brand */}
      <div className="flex items-center pl-2.5">
        <img src={logo} alt="Logo" className="w-9 h-9 md:w-13 md:h-13 mt-1" />
        <div className="text-sm md:text-lg  font-sans font-thin tracking-wide">
          fin-sight
        </div>
      </div>
       {/* Center - Search bar */}
      <div className="flex-1 flex justify-center px-6 ">
        <input
          type="text"
          placeholder="Search for stocks, etfs or profiles"
          className="w-3/5 bg-[#2a2a2a] text-xs font-light text-white placeholder:text-gray-400 rounded-md py-2.5 px-4 outline-none"
        />
      </div>
      {/* Right - Desktop Icons */}
      <div className="hidden md:flex items-center gap-6 pr-8">
        <FaHome className="text-sm cursor-pointer " />
        <FaClock className="text-sm cursor-pointer" />
        <FaStar className="text-sm cursor-pointer" />
        <FaBell className="text-sm cursor-pointer" />
        <div
          className="w-8 h-8 ml-5 rounded-full bg-[#5e5e5e] flex items-center justify-center user-dropdown"
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          <FaUser className="text-s cursor-pointer" />
          {showDropdown && (
            <div className="absolute right-10 top-18 z-50 bg-[#1a1a1a] text-white rounded-md shadow-lg p-4 w-56">
              <div className="mb-3">
                <p className="text-sm font-semibold">Nitish Kumar</p>
                <p className="text-xs text-gray-400">@asset_engineer…</p>
                <button className="mt-2 cursor-pointer text-sm text-white border border-gray-600 px-3 py-1 rounded hover:bg-gray-700">
                  Show profile
                </button>
              </div>
              <div className="border-t border-gray-700 pt-2">
                <p className="text-sm py-1 cursor-pointer hover:bg-gray-800 px-2 rounded">
                  Settings
                </p>
                <p className="text-sm py-1 cursor-pointer hover:bg-gray-800 px-2 rounded">
                  Help & Support
                </p>

                <p
                  className="text-sm cursor-pointer py-1 hover:bg-gray-800 px-2 rounded text-red-500"
                  onClick={handleLogout}
                >
                  Logout
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Right - Mobile Hamburger */}
      <div className="md:hidden">
        <FaBars
          className="text-lg cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        />
      </div>
      {/* Dropdown Menu for Mobile */}
      {menuOpen && (
        <div className="absolute right-4 top-14 z-50 bg-[#2a2a2a] rounded-md shadow-md p-3 flex flex-col gap-2 w-40">
          <FaHome className="text-sm cursor-pointer" />
          <FaClock className="text-sm cursor-pointer" />
          <FaStar className="text-sm cursor-pointer" />
          <FaBell className="text-sm cursor-pointer" />
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center self-end">
            <FaUser className="text-xs" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
