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
  const [newsFilter, setNewsFilter] = useState("all"); // 'all' or 'today'
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading
  const [sentimentData, setSentimentData] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const API = import.meta.env.VITE_API_URL;
  const NEWS_API_KEY = "d1rcav9r01qk8n665f1gd1rcav9r01qk8n665f20";

  // Mock data for trending tickers
  const trendingTickers = [
    { ticker: "RELIANCE", name: "Reliance Industries" },
    { ticker: "TCS", name: "Tata Consultancy" },
    { ticker: "AAPL", name: "Apple Inc." },
    { ticker: "TSLA", name: "Tesla Inc." },
    { ticker: "HDFCBANK", name: "HDFC Bank" },
  ];

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
          setInitialLoading(false); // Set initial loading to false when using cache
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
    setInitialLoading(false); // Set initial loading to false after fetching
  };

  // Fetch sentiment analysis
  const fetchSentimentAnalysis = async (articles) => {
    if (!articles || articles.length === 0) return;

    try {
      setSentimentLoading(true);

      // Limit to first 100 articles to prevent payload size issues
      const limitedArticles = articles.slice(0, 100);

      // Optimize payload by sending only essential data
      const optimizedArticles = limitedArticles.map((article) => ({
        headline: article.headline || article.title || "",
        summary: article.summary || article.description || "",
        ticker: article.ticker || "",
        url: article.url || "",
        datetime: article.datetime || null,
        source: article.source || "",
      }));

      const response = await axios.post(`${API}/sentiment/analyze`, {
        articles: optimizedArticles,
      });
      setSentimentData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch sentiment analysis:", error);
      setSentimentData(null);
    } finally {
      setSentimentLoading(false);
    }
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

  useEffect(() => {
    if (newsList.length > 0) {
      fetchSentimentAnalysis(newsList);
    }
  }, [newsList]);

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
  let filteredNews = newsList.filter(
    (article) =>
      article.headline?.toLowerCase().includes(search.toLowerCase()) ||
      article.summary?.toLowerCase().includes(search.toLowerCase()) ||
      article.ticker?.toLowerCase().includes(search.toLowerCase())
  );

  // Apply today filter without state updates
  if (newsFilter === "today") {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    const todayArticles = filteredNews.filter((article) => {
      if (!article.datetime) {
        return false;
      }
      const articleDate = new Date(article.datetime * 1000);
      return articleDate >= todayStart && articleDate <= todayEnd;
    });

    // If no articles found for today, show articles from the last 3 days as a fallback
    if (todayArticles.length === 0) {
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

      filteredNews = filteredNews.filter((article) => {
        if (!article.datetime) return false;
        const articleDate = new Date(article.datetime * 1000);
        return articleDate >= threeDaysAgo;
      });
    } else {
      filteredNews = todayArticles;
    }
  }

  // Handle fallback state updates in useEffect
  useEffect(() => {
    if (newsFilter === "today") {
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      );

      const todayArticles = newsList.filter((article) => {
        if (!article.datetime) return false;
        const articleDate = new Date(article.datetime * 1000);
        return articleDate >= todayStart && articleDate <= todayEnd;
      });

      setUsingFallback(todayArticles.length === 0);
    } else {
      setUsingFallback(false);
    }
  }, [newsFilter, newsList]);

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

  // Loading screen component
  const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      {/* Modern loading animation */}
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div
          className="absolute inset-0 w-16 h-16 border-4 border-blue-400 border-b-transparent rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        ></div>
      </div>
      <h2 className="text-2xl font-bold mb-2 text-white">Loading News</h2>
      <p className="text-gray-400 mb-4">
        Fetching the latest news for your portfolio...
      </p>
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );

  // Sentiment Analysis Component
  const SentimentAnalysis = () => {
    if (sentimentLoading) {
      return (
        <div className="bg-[rgba(33,33,34,0.92)] rounded-2xl shadow-xl border border-[#232324] p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            Sentiment Analysis
          </h2>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      );
    }

    if (!sentimentData) {
      return (
        <div className="bg-[rgba(33,33,34,0.92)] rounded-2xl shadow-xl border border-[#232324] p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            Sentiment Analysis
          </h2>
          <p className="text-gray-400 text-center">
            No sentiment data available
          </p>
        </div>
      );
    }

    const getSentimentColor = (sentiment) => {
      switch (sentiment) {
        case "positive":
          return "text-green-400";
        case "negative":
          return "text-red-400";
        default:
          return "text-gray-400";
      }
    };

    const getSentimentIcon = (sentiment) => {
      switch (sentiment) {
        case "positive":
          return (
            <svg
              className="w-6 h-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6.292A2 2 0 015.292 10H7"
              />
            </svg>
          );
        case "negative":
          return (
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2"
              />
            </svg>
          );
        default:
          return (
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          );
      }
    };

    return (
      <div className="bg-[rgba(33,33,34,0.92)] rounded-2xl shadow-xl border border-[#232324] p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          AI Sentiment Analysis
        </h2>

        {/* Overall Sentiment */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {getSentimentIcon(sentimentData.overallSentiment)}
            <span
              className={`font-bold text-lg ${getSentimentColor(
                sentimentData.overallSentiment
              )}`}
            >
              {sentimentData.overallSentiment.charAt(0).toUpperCase() +
                sentimentData.overallSentiment.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span>Confidence: {sentimentData.confidence}%</span>
            <span>Articles: {sentimentData.totalArticles}</span>
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Sentiment Breakdown
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-green-400 text-sm">Positive</span>
              <span className="text-white font-mono">
                {sentimentData.breakdown.positive}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400 text-sm">Negative</span>
              <span className="text-white font-mono">
                {sentimentData.breakdown.negative}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Neutral</span>
              <span className="text-white font-mono">
                {sentimentData.breakdown.neutral}
              </span>
            </div>
          </div>
        </div>

        {/* Top Articles by Sentiment */}
        {sentimentData.topArticles.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              High Confidence Articles
            </h3>
            <div className="space-y-2">
              {sentimentData.topArticles.slice(0, 3).map((article, idx) => (
                <div key={idx} className="p-3 bg-[rgba(0,0,0,0.2)] rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {getSentimentIcon(article.sentiment.sentiment)}
                    <span
                      className={`text-xs font-semibold ${getSentimentColor(
                        article.sentiment.sentiment
                      )}`}
                    >
                      {article.sentiment.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {article.headline || article.title}
                  </p>
                  {article.ticker && (
                    <span className="text-xs text-blue-400 font-mono">
                      {article.ticker}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="pt-16 min-h-screen bg-gradient-to-br from-[#20202a] via-[#232324] to-[#19191e] font-sans">
        <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
          {/* Left: News Section */}
          <div className="md:w-2/3 w-full flex flex-col">
            {/* Search bar with filters */}
            <div className="flex justify-center w-full mb-6">
              <div className="flex items-center gap-4 w-full max-w-2xl">
                {/* Search input */}
                <div className="relative flex-1">
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

                {/* Filter buttons */}
                <div className="flex gap-2 bg-[rgba(33,33,34,0.92)] rounded-full shadow border border-[#232324] p-1">
                  <button
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      newsFilter === "all"
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-300 hover:bg-blue-900/20"
                    }`}
                    onClick={() => {
                      setNewsFilter("all");
                      setUsingFallback(false);
                    }}
                  >
                    All
                  </button>
                  <button
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      newsFilter === "today"
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-300 hover:bg-blue-900/20"
                    }`}
                    onClick={() => {
                      setNewsFilter("today");
                      setUsingFallback(false);
                    }}
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            {/* Fallback message */}
            {usingFallback && newsFilter === "today" && (
              <div className="flex justify-center w-full mb-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-300 text-sm">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    No news found for today. Showing recent articles from the
                    last 3 days instead.
                  </span>
                </div>
              </div>
            )}
            {/* News list */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto w-full">
                {initialLoading ? (
                  <LoadingScreen />
                ) : loading ? (
                  <div className="flex flex-col gap-6 mt-8">
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
                    <h2 className="text-2xl font-bold mb-2">
                      Something went wrong
                    </h2>
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
                  <ul className="flex flex-col gap-6 mt-8">
                    {filteredNews.map((article, idx) => (
                      <li key={idx}>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            "group flex items-start gap-5 bg-[rgba(33,33,34,0.92)] p-6 rounded-2xl shadow-xl border border-transparent hover:border-blue-500 hover:shadow-blue-700/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 " +
                            "hover:-translate-y-0.5 hover:scale-[1.01] animate-fadein"
                          }
                          tabIndex={0}
                          aria-label={article.headline || article.title}
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          {/* Favicon or fallback icon */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700 mr-2">
                            {article.url ? (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                                  article.url.split("/")[2] || ""
                                )}&sz=64`}
                                alt="favicon"
                                className="w-8 h-8 rounded"
                              />
                            ) : (
                              <svg
                                className="w-8 h-8 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4m0 4h.01" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
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
                                  ? new Date(
                                      article.datetime * 1000
                                    ).toLocaleDateString()
                                  : ""}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition line-clamp-2">
                              {article.headline || article.title}
                            </h3>
                            <div className="text-base text-gray-300 line-clamp-3 mb-2">
                              {article.summary || article.description}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-400 font-medium">
                                {article.source}
                              </span>
                            </div>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          {/* Right: Sentiment Analysis & Trending Tickers */}
          <div className="md:w-1/3 w-full flex flex-col gap-8">
            {/* Sentiment Analysis Card */}
            <SentimentAnalysis />

            {/* Trending Tickers Card */}
            <div className="bg-[rgba(33,33,34,0.92)] rounded-2xl shadow-xl border border-[#232324] p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                Trending Tickers
              </h2>
              <ul className="flex flex-col gap-2">
                {trendingTickers.map((stock) => (
                  <li key={stock.ticker} className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-700 to-blue-900 text-blue-200 rounded-full text-xs font-mono tracking-wide border border-blue-800 shadow">
                      {stock.ticker}
                    </span>
                    <span className="text-gray-300 text-sm">{stock.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
