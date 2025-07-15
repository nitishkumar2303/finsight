import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";
import Header from "../components/Header";

const CACHE_KEY = "finsight_news_cache";
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes in ms

const News = () => {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState([]);
  const [newsList, setNewsList] = useState([]); // Unified news feed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const API = import.meta.env.VITE_API_URL;
  const NEWS_API_KEY = "d1rcav9r01qk8n665f1gd1rcav9r01qk8n665f20";

  // Fetch holdings
  const fetchHoldings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API}/holdings/get`);
      setHoldings(response.data);
    } catch (err) {
      setError("Failed to fetch holdings");
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch news for all holdings and aggregate
  const fetchNewsForHoldings = async (holdingsList, force = false) => {
    setRefreshing(true);
    setError(null);
    let allNews = [];
    let rateLimited = false;
    // Caching logic
    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { news, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) {
          setNewsList(news);
          setRefreshing(false);
          return;
        }
      }
    }
    for (const holding of holdingsList) {
      try {
        const today = new Date();
        const to = today.toISOString().split("T")[0];
        const fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 30);
        const from = fromDate.toISOString().split("T")[0];

        const url = `https://finnhub.io/api/v1/company-news?symbol=${holding.ticker}&from=${from}&to=${to}&token=${NEWS_API_KEY}`;
        const res = await fetch(url);
        if (res.status === 429) {
          rateLimited = true;
          break;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          allNews = allNews.concat(
            data.map((article) => ({ ...article, ticker: holding.ticker }))
          );
        }
      } catch (err) {
        // Ignore errors for individual stocks
      }
    }
    if (rateLimited) {
      setError(
        "You have reached the news provider's free limit. Please try again later or upgrade your API plan."
      );
      setNewsList([]);
    } else {
      // Sort all news by date (most recent first)
      allNews.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
      setNewsList(allNews);
      // Save to cache
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ news: allNews, timestamp: Date.now() })
      );
    }
    setRefreshing(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchHoldings();
  }, []);

  useEffect(() => {
    if (holdings.length === 0) return;
    fetchNewsForHoldings(holdings);
  }, [holdings]);

  // Scroll to top button logic
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Refresh handler (force fetch, update cache)
  const handleRefresh = () => {
    fetchHoldings();
    if (holdings.length > 0) fetchNewsForHoldings(holdings, true);
  };

  // Filtered news by search
  const filteredNews = newsList.filter(
    (article) =>
      article.headline?.toLowerCase().includes(search.toLowerCase()) ||
      article.summary?.toLowerCase().includes(search.toLowerCase()) ||
      article.ticker?.toLowerCase().includes(search.toLowerCase())
  );

  // Skeleton loader for cards
  const SkeletonCard = () => (
    <div className="animate-pulse bg-[rgba(33,33,34,0.85)] p-7 rounded-3xl shadow-2xl flex flex-col gap-4 min-h-[200px] border border-transparent bg-gradient-to-br from-[#232324]/80 to-[#232344]/60">
      <div className="h-7 w-3/4 bg-gray-700 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-800 rounded"></div>
      <div className="h-4 w-full bg-gray-800 rounded"></div>
      <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
      <div className="flex gap-2 mt-2">
        <div className="h-5 w-20 bg-gray-700 rounded"></div>
        <div className="h-5 w-10 bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <div className="pt-16 min-h-screen bg-gradient-to-br from-[#20202a] via-[#232324] to-[#19191e] font-sans">
        {/* Floating pill-shaped search bar */}
        <div className="flex justify-center w-full px-2 mt-2 mb-8">
          <div className="relative w-full max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-2-2" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search news, tickers, or keywords..."
              className="pl-12 pr-4 py-3 w-full rounded-full bg-[rgba(33,33,34,0.92)] shadow-xl border border-[#232324] focus:border-blue-600 text-white placeholder:text-gray-400 text-lg outline-none transition focus:ring-2 focus:ring-blue-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search news"
              style={{ fontFamily: "inherit" }}
            />
          </div>
        </div>
        {/* News grid */}
        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 md:px-6 py-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              {/* Modern SVG illustration for error */}
              <svg
                className="h-20 w-20 text-red-500 mb-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="#fff0"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow transition"
              >
                Try Again
              </button>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              {/* Modern SVG illustration for empty state */}
              <svg
                className="h-20 w-20 text-gray-500 mb-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="#fff0"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2">No news found</h2>
              <p className="text-gray-400">
                Try a different search or check back later for updates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-8">
              {filteredNews.map((article, idx) => (
                <a
                  key={idx}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "group bg-[rgba(33,33,34,0.92)] p-7 rounded-3xl shadow-2xl border border-transparent hover:border-blue-500 hover:shadow-blue-700/30 transition-all flex flex-col gap-4 focus:outline-none focus:ring-2 focus:ring-blue-600 " +
                    "hover:-translate-y-1 hover:scale-[1.03] animate-fadein"
                  }
                  tabIndex={0}
                  aria-label={article.headline || article.title}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {article.ticker && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-blue-700 to-blue-900 text-blue-200 rounded-full text-xs font-mono tracking-wide shadow border border-blue-800">
                        {article.ticker}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                      <svg
                        className="h-4 w-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"
                        />
                      </svg>
                      {article.datetime
                        ? new Date(article.datetime * 1000).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition line-clamp-2">
                    {article.headline || article.title}
                  </h3>
                  <div className="text-base text-gray-300 line-clamp-3 mb-2">
                    {article.summary || article.description}
                  </div>
                  <div className="flex items-center gap-3 mt-auto">
                    <span className="text-xs text-gray-400 font-medium">
                      {article.source}
                    </span>
                    {article.url && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                          article.url.split("/")[2] || ""
                        )}&sz=32`}
                        alt="favicon"
                        className="w-5 h-5 rounded-full ml-1 shadow"
                      />
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
        {/* Floating scroll-to-top button */}
        {showScrollTop && (
          <button
            className="fixed bottom-6 right-6 z-50 bg-[rgba(33,33,34,0.92)] hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl border border-blue-400 transition flex items-center justify-center backdrop-blur-md"
            onClick={handleScrollTop}
            aria-label="Scroll to top"
          >
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};

// Fade-in animation keyframes
// Add this to your global CSS (e.g., index.css):
// @keyframes fadein { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none;} }
// .animate-fadein { opacity: 1 !important; animation: fadein 0.7s cubic-bezier(0.4,0,0.2,1) both; }

export default News;
