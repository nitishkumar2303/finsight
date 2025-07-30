import React, { useState, useEffect, useRef } from "react";
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
  FaSearch,
} from "react-icons/fa";

const Header = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Stock suggestions functionality from Portfolio
  const POLYGON_API_KEY = "J2ggyqW_S4yNVBOwaApz_UZPQ4J1UQRk";
  const fetchStockSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(
          query
        )}&active=true&limit=10&apiKey=${POLYGON_API_KEY}`
      );
      const data = await response.json();
      const results = data.results || [];
      setSuggestions(
        results.map((ticker) => ({
          symbol: ticker.ticker,
          name: ticker.name,
          exchange: ticker.primary_exchange,
        }))
      );
      setShowSuggestions(true);
    } catch (err) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleStockSelect = (stockSymbol) => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/stock-insights/${stockSymbol}`);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest(".user-dropdown") &&
        !e.target.closest(".search-container")
      ) {
        setShowDropdown(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 z-50 w-full border-b border-base-300 bg-base-100 shadow-lg text-base-content h-16 flex items-center px-4 md:px-6 justify-between">
      {/* Left - Logo + Brand */}
      <div className="flex items-center pl-2.5">
        <img src={logo} alt="Logo" className="w-9 h-9 md:w-11 md:h-11 mt-1" />
        <div className="text-sm md:text-lg font-sans font-semibold tracking-wide text-primary">
          fin-sight
        </div>
      </div>

      {/* Center - Search bar */}
      <div className="flex-1 flex justify-center px-6 search-container relative">
        <div className="relative w-3/5">
          <input
            type="text"
            placeholder="Search for stocks, etfs or profiles"
            className="w-full bg-base-200 text-sm font-normal text-base-content placeholder:text-base-content/60 rounded-lg py-2.5 px-4 pr-10 outline-none border border-base-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                fetchStockSuggestions(value);
              }, 500);
            }}
            autoComplete="off"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-xs" />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 bg-base-100 border border-base-300 rounded-lg mt-1 w-full max-h-60 overflow-y-auto text-sm shadow-xl">
              {suggestions.map((stock, idx) => (
                <div
                  key={stock.symbol}
                  className="px-4 py-3 hover:bg-base-200 cursor-pointer text-base-content border-b border-base-300 last:border-b-0 transition-colors"
                  onClick={() => handleStockSelect(stock.symbol)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content">
                        {stock.symbol}
                      </span>
                      <span className="text-base-content/70 ml-2 text-sm">
                        {stock.name}
                      </span>
                    </div>
                    <span className="text-base-content/50 text-xs">
                      {stock.exchange}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right - Desktop Icons */}
      <div className="hidden md:flex items-center gap-6 pr-4">
        <button
          className="btn btn-ghost btn-sm p-2"
          onClick={() => navigate("/portfolio")}
        >
          <FaHome className="text-base" />
        </button>
        <button className="btn btn-ghost btn-sm p-2">
          <FaClock className="text-base" />
        </button>
        <button className="btn btn-ghost btn-sm p-2">
          <FaStar className="text-base" />
        </button>
        <button className="btn btn-ghost btn-sm p-2">
          <FaBell className="text-base" />
        </button>
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar bg-primary/10 hover:bg-primary/20"
          >
            <FaUser className="text-primary" />
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-4 shadow-xl bg-base-100 rounded-lg w-64 border border-base-300"
          >
            <div className="mb-3 px-2">
              <p className="text-sm font-semibold text-base-content">
                Nitish Kumar
              </p>
              <p className="text-xs text-base-content/60">@asset_engineer…</p>
              <button className="mt-3 btn btn-outline btn-sm w-full">
                Show profile
              </button>
            </div>
            <div className="border-t border-base-300 pt-2">
              <li>
                <a className="text-sm rounded-lg hover:bg-base-200">Settings</a>
              </li>
              <li>
                <a className="text-sm rounded-lg hover:bg-base-200">
                  Help & Support
                </a>
              </li>
              <li>
                <a
                  className="text-sm rounded-lg hover:bg-error/10 text-error cursor-pointer"
                  onClick={handleLogout}
                >
                  Logout
                </a>
              </li>
            </div>
          </ul>
        </div>
      </div>
      {/* Right - Mobile Hamburger */}
      <div className="md:hidden">
        <button
          className="btn btn-ghost btn-sm p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FaBars className="text-lg" />
        </button>
      </div>

      {/* Dropdown Menu for Mobile */}
      {menuOpen && (
        <div className="absolute right-4 top-16 z-50 bg-base-100 border border-base-300 rounded-lg shadow-xl p-4 flex flex-col gap-3 w-48">
          <button
            className="btn btn-ghost btn-sm justify-start gap-3"
            onClick={() => navigate("/portfolio")}
          >
            <FaHome className="text-base" />
            <span>Dashboard</span>
          </button>
          <button className="btn btn-ghost btn-sm justify-start gap-3">
            <FaClock className="text-base" />
            <span>History</span>
          </button>
          <button className="btn btn-ghost btn-sm justify-start gap-3">
            <FaStar className="text-base" />
            <span>Watchlist</span>
          </button>
          <button className="btn btn-ghost btn-sm justify-start gap-3">
            <FaBell className="text-base" />
            <span>Alerts</span>
          </button>
          <div className="divider my-2"></div>
          <button className="btn btn-ghost btn-sm justify-start gap-3">
            <FaUser className="text-base" />
            <span>Profile</span>
          </button>
          <button
            className="btn btn-ghost btn-sm justify-start gap-3 text-error hover:bg-error/10"
            onClick={handleLogout}
          >
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
