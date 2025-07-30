import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Line } from "react-chartjs-2";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import axios from "../config/axios"; // Importing the axios instance

// import the component
import ReactSpeedometer from "react-d3-speedometer";
// and just use it

import Header from "../components/Header";

// Import Heroicons for better icons
import {
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState("month");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    ticker: "",
    quantity: "",
    purchasePrice: "",
    purchaseDate: "",
    notes: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const debounceRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, []);

  const API = import.meta.env.VITE_API_URL; // Ensure this is set in your .env file
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalValue: 0,
    totalInvested: 0,
    totalProfitLoss: 0,
    percentageChange: 0,
  });
  const [portfolioInsights, setPortfolioInsights] = useState({
    sectorAllocation: {},
    marketCapAllocation: {},
    recommendationDistribution: {},
    topPerformers: [],
    riskMetrics: {
      averagePE: 0,
      averageROE: 0,
      diversificationScore: 0,
    },
  });
  const [insightsView, setInsightsView] = useState("allocation"); // 'allocation', 'sector', 'marketCap'

  const fetchStocksAndPrices = async () => {
    setLoading(true);

    // Always fetch holdings fresh
    let holdings = [];
    try {
      const holdingsResponse = await axios.get(`${API}/holdings/get`);
      holdings = holdingsResponse.data;
      // console.log("Holdings fetched:", holdings);
    } catch (error) {
      console.error("Error fetching holdings:", error);
      setLoading(false);
      return;
    }

    // Fetch portfolio insights
    try {
      const insightsResponse = await axios.get(`${API}/holdings/insights`);
      setPortfolioInsights(insightsResponse.data);
      console.log("Portfolio insights fetched:", insightsResponse.data);
    } catch (error) {
      console.error("Error fetching portfolio insights:", error);
    }

    // Fetch latest price for all tickers from backend
    let prices = {};
    const tickers = holdings.map((h) => h.ticker);
    // console.log("Fetching latest prices for tickers:", tickers);
    try {
      const pricesResponse = await axios.get(
        `${API}/stock/last-price?tickers=${tickers.join(",")}`
      );
      prices = pricesResponse.data; // { TICKER: lastPriceObj, ... }
      // console.log("Latest prices fetched:", prices);
    } catch (error) {
      console.error("Error fetching latest prices from backend:", error);
    }

    // Merge latest close price into holdings for display
    const stocksWithPrices = holdings.map((h) => {
      const latestPriceObj = prices[h.ticker];
      const latestDate = latestPriceObj
        ? new Date(latestPriceObj.datetime).toISOString().split("T")[0]
        : null;

      return {
        ...h,
        livePrice: latestPriceObj?.close || null,
        latestPriceDate: latestDate,
      };
    });

    // Calculate portfolio summary
    let totalValue = 0;
    let totalInvested = 0;

    stocksWithPrices.forEach((holding) => {
      const invested = holding.purchasePrice * holding.quantity;
      const currentValue =
        (holding.livePrice || holding.purchasePrice) * holding.quantity;

      totalInvested += invested;
      totalValue += currentValue;
    });

    const totalProfitLoss = totalValue - totalInvested;
    const percentageChange =
      totalInvested > 0
        ? ((totalValue - totalInvested) / totalInvested) * 100
        : 0;

    setPortfolioSummary({
      totalValue,
      totalInvested,
      totalProfitLoss,
      percentageChange,
    });

    // console.log("Stocks with prices:", stocksWithPrices);

    setStock(stocksWithPrices);
    setLoading(false);
  };

  useEffect(() => {
    fetchStocksAndPrices();
  }, []);

  useEffect(() => {
    const fetchNetWorthHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API}/portfolio/net-worth-history?range=${selectedRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response.data;
        console.log("Net worth history data:", data);
        const values = data.map((item) => item.value);
        const isUptrend =
          values.length > 1 && values[values.length - 1] > values[0];
        const lineColor = isUptrend ? "#00FF00" : "#FF2D2D";

        setChartData({
          labels: data.map((item) => item.date),
          datasets: [
            {
              label: "",
              data: values,
              borderColor: lineColor,
              backgroundColor: "transparent",
              borderWidth: 2,
              pointRadius: 3,
              tension: 0,
            },
          ],
        });
      } catch (err) {
        console.error("Error fetching net worth history:", err);
      }
    };
    fetchNetWorthHistory();
  }, [selectedRange]);

  // Data for the performance line chart - keeping static for now
  const performanceData = {
    labels: ["1D", "1W", "1M", "1Y"],
    datasets: [
      {
        label: "Performance",
        data: [35, 34.5, 35.1, 34.8, 35.128, 35.128],
        borderColor: "#00FF00",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  // Dynamic allocation data based on insights view
  const getAllocationData = () => {
    if (insightsView === "sector") {
      // Show sector allocation
      const sectorData = portfolioInsights.sectorAllocation;
      if (!sectorData || Object.keys(sectorData).length === 0) {
        return {
          labels: ["No Data"],
          datasets: [{ data: [1], backgroundColor: ["#6b7280"] }],
        };
      }

      const sectors = Object.keys(sectorData);
      const colors = [
        "#FF6B8A",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FFEAA7",
        "#DDA0DD",
        "#FFB347",
        "#87CEEB",
      ];

      return {
        labels: sectors,
        datasets: [
          {
            data: sectors.map((sector) => sectorData[sector].value),
            backgroundColor: sectors.map(
              (_, index) => colors[index % colors.length]
            ),
            borderWidth: 0,
            hoverBorderWidth: 2,
            hoverBorderColor: "#ffffff",
          },
        ],
      };
    }

    if (insightsView === "marketCap") {
      // Show market cap allocation
      const marketCapData = portfolioInsights.marketCapAllocation;
      if (!marketCapData || Object.keys(marketCapData).length === 0) {
        return {
          labels: ["No Data"],
          datasets: [{ data: [1], backgroundColor: ["#6b7280"] }],
        };
      }

      const caps = Object.keys(marketCapData);
      const colors = {
        "Large Cap": "#22c55e",
        "Mid Cap": "#3b82f6",
        "Small Cap": "#f59e0b",
        "Micro Cap": "#ef4444",
        Unknown: "#6b7280",
      };

      return {
        labels: caps,
        datasets: [
          {
            data: caps.map((cap) => marketCapData[cap].value),
            backgroundColor: caps.map((cap) => colors[cap] || "#6b7280"),
            borderWidth: 0,
            hoverBorderWidth: 2,
            hoverBorderColor: "#ffffff",
          },
        ],
      };
    }

    // Default: Show individual stock allocation
    if (!stock || stock.length === 0) {
      return {
        labels: ["No Holdings"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#6b7280"],
          },
        ],
      };
    }

    // Calculate allocation for each holding
    const allocations = stock.map((holding, index) => {
      const currentValue =
        (holding.livePrice || holding.purchasePrice) * holding.quantity;
      const percentage =
        portfolioSummary.totalValue > 0
          ? (currentValue / portfolioSummary.totalValue) * 100
          : 0;

      return {
        ticker: holding.ticker,
        value: currentValue,
        percentage: percentage,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Generate distinct colors
      };
    });

    // Sort by value and take top holdings (limit to 8 for better visualization)
    const topHoldings = allocations
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // If there are more than 8 holdings, group the rest as "Others"
    const otherHoldings = allocations.slice(8);
    if (otherHoldings.length > 0) {
      const othersValue = otherHoldings.reduce(
        (sum, holding) => sum + holding.value,
        0
      );
      const othersPercentage =
        portfolioSummary.totalValue > 0
          ? (othersValue / portfolioSummary.totalValue) * 100
          : 0;

      topHoldings.push({
        ticker: `Others (${otherHoldings.length})`,
        value: othersValue,
        percentage: othersPercentage,
        color: "#9ca3af",
      });
    }

    return {
      labels: topHoldings.map((h) => h.ticker),
      datasets: [
        {
          data: topHoldings.map((h) => h.value),
          backgroundColor: topHoldings.map((h) => h.color),
          borderWidth: 0,
          hoverBorderWidth: 2,
          hoverBorderColor: "#ffffff",
          hoverBackgroundColor: topHoldings.map((h) => h.color),
        },
      ],
    };
  };

  const allocationData = getAllocationData();

  //the below function is used to handle the form input changes
  const fetchStockSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    try {
      setSuggestionsLoading(true);
      setShowSuggestions(true);

      // Use a simple search for now - you can enhance this later
      // For now, we'll just create mock suggestions
      const mockSuggestions = [
        {
          symbol: query.toUpperCase(),
          name: `${query.toUpperCase()} Company`,
          exchange: "NASDAQ",
        },
      ];

      setSuggestions(mockSuggestions);
      setSuggestionsLoading(false);
    } catch (err) {
      console.error("Error fetching stock suggestions:", err);
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
    }
  };

  //the below function is used to stop the scroll of background when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  return (
    <>
      <Header />
      <div className="bg-base-200 text-base-content min-h-screen w-full p-2 xs:p-3 sm:p-6 rounded-lg font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start mt-20 xs:mt-20 sm:mt-24 m-2 xs:m-4 sm:m-8 space-y-2 xs:space-y-3 sm:space-y-0 sm:space-x-8">
          {/* Left Section: Portfolio and Performance */}
          <div className="flex flex-col w-full sm:w-4/5 gap-4">
            {/* Portfolio Card */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-4 sm:p-6">
                <div className="flex items-center border-b border-base-300 pb-4">
                  <h2 className="card-title text-lg font-bold">Portfolio</h2>
                  <div className="ml-auto flex space-x-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      aria-label="Settings"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                    </button>
                    <button className="btn btn-ghost btn-sm" aria-label="More">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold">
                      ₹{" "}
                      {portfolioSummary.totalValue.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </h1>
                    <span
                      className={`text-base font-semibold flex items-center gap-1 ${
                        portfolioSummary.totalProfitLoss >= 0
                          ? "text-success"
                          : "text-error"
                      }`}
                    >
                      {portfolioSummary.totalProfitLoss >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(portfolioSummary.percentageChange).toFixed(2)}%{" "}
                      <span className="hidden xs:inline">
                        ({portfolioSummary.totalProfitLoss >= 0 ? "+" : ""}₹
                        {portfolioSummary.totalProfitLoss.toLocaleString(
                          "en-IN",
                          { maximumFractionDigits: 2 }
                        )}
                        )
                      </span>
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {["day", "week", "month", "year"].map((range) => (
                      <button
                        key={range}
                        className={`btn btn-xs sm:btn-sm rounded-full px-3 font-semibold transition-all duration-150 ${
                          selectedRange === range
                            ? "btn-primary text-white"
                            : "btn-ghost"
                        }`}
                        onClick={() => setSelectedRange(range)}
                      >
                        {range === "day"
                          ? "1D"
                          : range === "week"
                          ? "1W"
                          : range === "month"
                          ? "1M"
                          : range === "year"
                          ? "1Y"
                          : range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <div className="w-full h-32 sm:h-40">
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            enabled: true,
                            backgroundColor: "#222",
                            titleColor: "#fff",
                            bodyColor: "#fff",
                            borderColor: "#FF2D2D",
                            borderWidth: 1,
                            callbacks: {
                              label: function (context) {
                                return `₹${context.parsed.y}`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            grid: { display: false, drawOnChartArea: false },
                            ticks: { display: false },
                            border: { display: false },
                          },
                          y: {
                            grid: { display: false, drawOnChartArea: false },
                            ticks: { display: false },
                            border: { display: false },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card bg-base-100 shadow-lg border border-base-300">
                <div className="card-body p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    ₹
                    {portfolioSummary.totalInvested.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    Total Invested
                  </div>
                </div>
              </div>
              <div className="card bg-base-100 shadow-lg border border-base-300">
                <div className="card-body p-4 text-center">
                  <div className="text-2xl font-bold text-info">
                    ₹
                    {portfolioSummary.totalValue.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    Current Value
                  </div>
                </div>
              </div>
              <div className="card bg-base-100 shadow-lg border border-base-300">
                <div className="card-body p-4 text-center">
                  <div
                    className={`text-2xl font-bold ${
                      portfolioSummary.totalProfitLoss >= 0
                        ? "text-success"
                        : "text-error"
                    }`}
                  >
                    {portfolioSummary.totalProfitLoss >= 0 ? "+" : ""}₹
                    {Math.abs(portfolioSummary.totalProfitLoss).toLocaleString(
                      "en-IN",
                      { maximumFractionDigits: 0 }
                    )}
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    Total P&L
                  </div>
                </div>
              </div>
              <div className="card bg-base-100 shadow-lg border border-base-300">
                <div className="card-body p-4 text-center">
                  <div
                    className={`text-2xl font-bold ${
                      portfolioSummary.percentageChange >= 0
                        ? "text-success"
                        : "text-error"
                    }`}
                  >
                    {portfolioSummary.percentageChange >= 0 ? "+" : ""}
                    {portfolioSummary.percentageChange.toFixed(1)}%
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    Returns
                  </div>
                </div>
              </div>
            </div>

            {/* Positions Section */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-4 sm:p-6">
                <div className="flex items-center border-b border-base-300 pb-4">
                  <h2 className="card-title text-lg font-bold">Positions</h2>
                  <div className="ml-auto flex space-x-2">
                    <button
                      className="btn btn-outline btn-sm flex items-center gap-1"
                      onClick={() => fetchStocksAndPrices(true)}
                    >
                      <ArrowPathIcon className="h-4 w-4" /> Refresh
                    </button>
                    <button
                      className="btn btn-primary btn-sm flex items-center gap-1"
                      onClick={() => setShowModal(true)}
                    >
                      <PlusIcon className="h-4 w-4" /> Add transaction
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto mt-4">
                  <table className="table table-zebra w-full text-sm">
                    <thead>
                      <tr>
                        <th>Stock</th>
                        <th>Invested</th>
                        <th>Current Value</th>
                        <th>P&L</th>
                        <th>Weight</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                            <span className="ml-2 text-primary">
                              Fetching live prices...
                            </span>
                          </td>
                        </tr>
                      ) : stock.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-base-content/60"
                          >
                            No positions yet. Add your first transaction to get
                            started!
                          </td>
                        </tr>
                      ) : (
                        stock.map((stock, index) => {
                          // Calculate profit/loss and percentage change
                          const buyValue =
                            typeof stock.purchasePrice === "number" &&
                            typeof stock.quantity === "number"
                              ? stock.purchasePrice * stock.quantity
                              : null;
                          const currentValue =
                            typeof stock.livePrice === "number" &&
                            typeof stock.quantity === "number"
                              ? stock.livePrice * stock.quantity
                              : null;
                          const profitLoss =
                            buyValue !== null && currentValue !== null
                              ? currentValue - buyValue
                              : null;
                          const percentChange =
                            buyValue !== null &&
                            buyValue !== 0 &&
                            currentValue !== null
                              ? ((currentValue - buyValue) / buyValue) * 100
                              : null;

                          // Calculate portfolio weight
                          const portfolioWeight =
                            portfolioSummary.totalValue > 0 &&
                            currentValue !== null
                              ? (currentValue / portfolioSummary.totalValue) *
                                100
                              : 0;

                          // Set color based on profit/loss
                          const profitLossColor =
                            profitLoss !== null
                              ? profitLoss >= 0
                                ? "text-success"
                                : "text-error"
                              : "";

                          return (
                            <tr
                              key={index}
                              className="hover:bg-base-200 transition"
                            >
                              <td>
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="font-semibold">
                                      {stock.ticker}
                                    </div>
                                    <div className="text-xs text-base-content/60">
                                      {stock.quantity} shares @ ₹
                                      {stock.purchasePrice}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="font-semibold">
                                    ₹
                                    {buyValue !== null
                                      ? buyValue.toLocaleString("en-IN")
                                      : "N/A"}
                                  </div>
                                  <div className="text-xs text-base-content/60">
                                    Avg: ₹{stock.purchasePrice}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="font-semibold">
                                    {currentValue !== null
                                      ? `₹${currentValue.toLocaleString(
                                          "en-IN"
                                        )}`
                                      : "N/A"}
                                  </div>
                                  <div className="text-xs text-base-content/60">
                                    LTP:{" "}
                                    {stock.livePrice !== null
                                      ? `₹${stock.livePrice}`
                                      : "N/A"}
                                  </div>
                                </div>
                              </td>
                              <td className={profitLossColor}>
                                <div>
                                  <div className="font-semibold">
                                    {profitLoss !== null
                                      ? `${
                                          profitLoss >= 0 ? "+" : ""
                                        }₹${Math.abs(profitLoss).toLocaleString(
                                          "en-IN"
                                        )}`
                                      : "N/A"}
                                  </div>
                                  <div className="text-xs">
                                    {percentChange !== null
                                      ? `${
                                          percentChange >= 0 ? "↑" : "↓"
                                        } ${Math.abs(percentChange).toFixed(
                                          2
                                        )}%`
                                      : ""}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="text-center">
                                  <div className="text-sm font-semibold">
                                    {portfolioWeight.toFixed(1)}%
                                  </div>
                                  <div className="w-full bg-base-300 rounded-full h-2 mt-1">
                                    <div
                                      className="bg-primary h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${Math.min(
                                          portfolioWeight,
                                          100
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button
                                  onClick={() =>
                                    navigate(`/stock-insights/${stock.ticker}`)
                                  }
                                  className="btn btn-primary btn-sm"
                                >
                                  Analyze
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Best & Worst Performers */}
                {stock.length > 0 && (
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    {(() => {
                      // Calculate performance for each stock
                      const stockPerformance = stock
                        .map((s) => {
                          const invested = s.purchasePrice * s.quantity;
                          const current =
                            (s.livePrice || s.purchasePrice) * s.quantity;
                          const profitLoss = current - invested;
                          const percentage =
                            invested > 0
                              ? ((current - invested) / invested) * 100
                              : 0;
                          return {
                            ...s,
                            profitLoss,
                            percentage,
                            invested,
                            current,
                          };
                        })
                        .filter((s) => s.livePrice); // Only include stocks with live prices

                      const bestPerformer = stockPerformance.reduce(
                        (best, current) =>
                          current.percentage > best.percentage ? current : best,
                        stockPerformance[0] || {}
                      );

                      const worstPerformer = stockPerformance.reduce(
                        (worst, current) =>
                          current.percentage < worst.percentage
                            ? current
                            : worst,
                        stockPerformance[0] || {}
                      );

                      return (
                        <>
                          {/* Best Performer */}
                          {bestPerformer.ticker && (
                            <div className="card bg-gradient-to-r from-success/10 to-success/5 border border-success/20">
                              <div className="card-body p-4">
                                <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                                  🏆 Best Performer
                                </h4>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-bold text-lg">
                                      {bestPerformer.ticker}
                                    </div>
                                    <div className="text-sm text-base-content/70">
                                      {bestPerformer.quantity} shares
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-success font-bold">
                                      +{bestPerformer.percentage.toFixed(2)}%
                                    </div>
                                    <div className="text-sm text-success">
                                      +₹
                                      {bestPerformer.profitLoss.toLocaleString(
                                        "en-IN"
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Worst Performer */}
                          {worstPerformer.ticker &&
                            stockPerformance.length > 1 && (
                              <div className="card bg-gradient-to-r from-error/10 to-error/5 border border-error/20">
                                <div className="card-body p-4">
                                  <h4 className="font-semibold text-error mb-2 flex items-center gap-2">
                                    📉 Needs Attention
                                  </h4>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-bold text-lg">
                                        {worstPerformer.ticker}
                                      </div>
                                      <div className="text-sm text-base-content/70">
                                        {worstPerformer.quantity} shares
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-error font-bold">
                                        {worstPerformer.percentage.toFixed(2)}%
                                      </div>
                                      <div className="text-sm text-error">
                                        ₹
                                        {worstPerformer.profitLoss.toLocaleString(
                                          "en-IN"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right Section: Allocation */}
          <div className="w-full sm:w-2/6 flex flex-col gap-4">
            {/* Distribution Card */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-semibold text-base-content/80">
                    Portfolio Distribution
                  </div>
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost btn-sm"
                    >
                      <span className="text-xs">
                        {insightsView === "allocation"
                          ? "Holdings"
                          : insightsView === "sector"
                          ? "Sectors"
                          : "Market Cap"}
                      </span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32"
                    >
                      <li>
                        <a
                          onClick={() => setInsightsView("allocation")}
                          className="text-xs"
                        >
                          Holdings
                        </a>
                      </li>
                      <li>
                        <a
                          onClick={() => setInsightsView("sector")}
                          className="text-xs"
                        >
                          Sectors
                        </a>
                      </li>
                      <li>
                        <a
                          onClick={() => setInsightsView("marketCap")}
                          className="text-xs"
                        >
                          Market Cap
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative">
                    <div
                      style={{
                        height: "250px",
                        width: "250px",
                        margin: "0 auto",
                      }}
                    >
                      <Doughnut
                        data={allocationData}
                        options={{
                          cutout: "70%",
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            mode: "point",
                            intersect: true,
                          },
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              enabled: true,
                              mode: "point",
                              intersect: true,
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              titleColor: "#ffffff",
                              bodyColor: "#ffffff",
                              borderColor: "#ffffff",
                              borderWidth: 1,
                              cornerRadius: 6,
                              padding: 10,
                              displayColors: false,
                              callbacks: {
                                title: function (tooltipItems) {
                                  return tooltipItems[0].label;
                                },
                                label: function (context) {
                                  const value = context.parsed;
                                  const percentage =
                                    portfolioSummary.totalValue > 0
                                      ? (
                                          (value /
                                            portfolioSummary.totalValue) *
                                          100
                                        ).toFixed(1)
                                      : 0;
                                  return `₹${value.toLocaleString(
                                    "en-IN"
                                  )} (${percentage}%)`;
                                },
                              },
                            },
                          },
                          onHover: (event, elements) => {
                            if (event.native && event.native.target) {
                              event.native.target.style.cursor =
                                elements.length > 0 ? "pointer" : "default";
                            }
                          },
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          ₹
                          {portfolioSummary.totalValue.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                          })}
                        </div>
                        <div className="text-xs text-base-content/60">
                          Total Value
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    Portfolio Holdings
                  </h3>
                  <div className="mt-2 text-sm text-base-content/70">
                    {stock.length}{" "}
                    {stock.length === 1 ? "Position" : "Positions"}
                  </div>
                  {/* Summary stats instead of legend */}
                  {stock.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                      <div className="bg-base-200 rounded-lg p-2">
                        <div className="text-xs text-base-content/60">
                          Largest Position
                        </div>
                        <div className="font-semibold text-sm">
                          {(() => {
                            const largest = stock.reduce((max, current) => {
                              const currentValue =
                                (current.livePrice || current.purchasePrice) *
                                current.quantity;
                              const maxValue =
                                (max.livePrice || max.purchasePrice) *
                                max.quantity;
                              return currentValue > maxValue ? current : max;
                            });
                            const largestValue =
                              (largest.livePrice || largest.purchasePrice) *
                              largest.quantity;
                            const percentage =
                              portfolioSummary.totalValue > 0
                                ? (
                                    (largestValue /
                                      portfolioSummary.totalValue) *
                                    100
                                  ).toFixed(1)
                                : 0;
                            return `${largest.ticker} (${percentage}%)`;
                          })()}
                        </div>
                      </div>
                      <div className="bg-base-200 rounded-lg p-2">
                        <div className="text-xs text-base-content/60">
                          Diversification
                        </div>
                        <div className="font-semibold text-sm">
                          {(() => {
                            const largestPercent = Math.max(
                              ...stock.map((s) => {
                                const value =
                                  (s.livePrice || s.purchasePrice) * s.quantity;
                                return portfolioSummary.totalValue > 0
                                  ? (value / portfolioSummary.totalValue) * 100
                                  : 0;
                              })
                            );
                            return largestPercent > 50
                              ? "Concentrated"
                              : largestPercent > 30
                              ? "Moderate"
                              : "Well Diversified";
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Performance Meter Card */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-semibold">Portfolio Health</h2>
                  <span className="text-xs text-base-content/60">
                    Updated just now
                  </span>
                </div>
                <div className="flex justify-center items-center h-32 xs:h-40">
                  <ReactSpeedometer
                    width={180}
                    height={120}
                    minValue={-50}
                    maxValue={50}
                    value={Math.min(
                      Math.max(portfolioSummary.percentageChange, -50),
                      50
                    )}
                    needleColor="#374151"
                    startColor="#ef4444"
                    endColor="#22c55e"
                    segments={10}
                    currentValueText={`${
                      portfolioSummary.percentageChange >= 0 ? "+" : ""
                    }${portfolioSummary.percentageChange.toFixed(1)}%`}
                    customSegmentLabels={[]}
                    labelFontSize="0px"
                    ringWidth={15}
                    needleTransitionDuration={1500}
                    needleTransition="easeElastic"
                    currentValuePlaceholderStyle="font-size: 14px; font-weight: bold;"
                    segmentColors={[
                      "#ef4444", // Red
                      "#f87171", // Light red
                      "#fb923c", // Orange red
                      "#f59e0b", // Orange
                      "#eab308", // Yellow
                      "#84cc16", // Light green
                      "#22c55e", // Green
                      "#16a34a", // Dark green
                      "#15803d", // Darker green
                      "#166534", // Darkest green
                    ]}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">
                      Total Invested:
                    </span>
                    <span className="font-semibold">
                      ₹{portfolioSummary.totalInvested.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">Current Value:</span>
                    <span className="font-semibold">
                      ₹{portfolioSummary.totalValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">Total P&L:</span>
                    <span
                      className={`font-semibold ${
                        portfolioSummary.totalProfitLoss >= 0
                          ? "text-success"
                          : "text-error"
                      }`}
                    >
                      {portfolioSummary.totalProfitLoss >= 0 ? "+" : ""}₹
                      {portfolioSummary.totalProfitLoss.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-center text-xs text-base-content/60">
                  {portfolioSummary.percentageChange >= 20
                    ? "Excellent performance! 🚀"
                    : portfolioSummary.percentageChange >= 10
                    ? "Strong portfolio growth! 📈"
                    : portfolioSummary.percentageChange >= 0
                    ? "Positive returns 👍"
                    : portfolioSummary.percentageChange >= -10
                    ? "Minor decline 📉"
                    : "Consider reviewing strategy 🔍"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Add Transaction */}
        {showModal && (
          <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/40 backdrop-blur-sm transition-all">
            {/* Loading overlay */}
            {modalLoading && (
              <div className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/70">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="mt-6 text-primary text-lg font-bold animate-fade-in">
                  Adding transaction...
                </span>
              </div>
            )}
            {/* Modal box */}
            <div
              className="card bg-base-100 text-base-content rounded-lg p-6 w-full max-w-sm shadow-2xl border border-base-300 relative overflow-y-auto animate-fade-in"
              style={{ maxHeight: "90vh", minWidth: "260px" }}
            >
              <button
                className="btn btn-ghost btn-circle absolute top-3 right-3"
                onClick={() => {
                  setShowModal(false);
                  setForm({
                    ticker: "",
                    quantity: "",
                    purchasePrice: "",
                    purchaseDate: "",
                    notes: "",
                  });
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <h2 className="text-lg font-bold mb-3">Add Transaction</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setModalLoading(true);
                  try {
                    await axios.post(`${API}/holdings/add`, form, {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                          "token"
                        )}`,
                      },
                    });
                    setShowModal(false);
                    setForm({
                      ticker: "",
                      quantity: "",
                      purchasePrice: "",
                      purchaseDate: "",
                      notes: "",
                    });
                    fetchStocksAndPrices();
                  } catch (err) {
                    alert("Failed to add transaction");
                  } finally {
                    setModalLoading(false);
                  }
                }}
              >
                <div className="mb-3">
                  <label className="block mb-1 text-xs font-semibold">
                    Transaction Type
                  </label>
                  <select
                    className="select select-bordered w-full text-xs"
                    value={form.transactionType || "Buy"}
                    onChange={(e) =>
                      setForm({ ...form, transactionType: e.target.value })
                    }
                  >
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </div>
                <div className="mb-3 relative">
                  <label className="block mb-1 text-xs font-semibold">
                    Add Security
                  </label>
                  <input
                    type="text"
                    placeholder="Ticker, ISIN, Stock, ETF, ..."
                    className="input input-bordered w-full text-xs"
                    value={form.ticker}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, ticker: value });
                      clearTimeout(debounceRef.current);
                      debounceRef.current = setTimeout(() => {
                        fetchStockSuggestions(value);
                      }, 500);
                    }}
                    required
                    autoComplete="off"
                  />
                  {showSuggestions && (
                    <div className="absolute z-50 bg-base-100 border border-base-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto text-xs shadow-lg">
                      {suggestionsLoading ? (
                        <div className="px-3 py-4 text-center">
                          <span className="loading loading-spinner loading-sm text-primary"></span>
                          <span className="ml-2 text-base-content/60">
                            Searching...
                          </span>
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((stock, idx) => (
                          <div
                            key={stock.symbol}
                            className="px-3 py-2 hover:bg-base-200 cursor-pointer"
                            onClick={() => {
                              setForm({ ...form, ticker: stock.symbol });
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="font-semibold">
                              {stock.symbol}
                            </span>{" "}
                            - {stock.name} ({stock.exchange})
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-base-content/60">
                          No stocks found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="block mb-1 text-xs font-semibold">
                    Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    className="input input-bordered w-full text-xs"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 text-xs font-semibold">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full text-xs"
                    value={form.purchaseDate}
                    onChange={(e) =>
                      setForm({ ...form, purchaseDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="w-2/3">
                    <label className="block mb-1 text-xs font-semibold">
                      Purchase Price
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. ₹150.00"
                      className="input input-bordered w-full text-xs"
                      value={form.purchasePrice}
                      onChange={(e) =>
                        setForm({ ...form, purchasePrice: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block mb-1 text-xs font-semibold invisible">
                      Currency
                    </label>
                    <select
                      className="select select-bordered w-full text-xs"
                      value={form.currency || "INR"}
                      onChange={(e) =>
                        setForm({ ...form, currency: e.target.value })
                      }
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block mb-1 text-xs font-semibold">
                    Notes
                  </label>
                  <textarea
                    placeholder="Notes"
                    className="textarea textarea-bordered w-full text-xs"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
                <div className="mb-4 text-base font-bold">
                  Total Amount
                  <span className="float-right">
                    ₹
                    {form.quantity && form.purchasePrice
                      ? (form.quantity * form.purchasePrice).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-full font-semibold text-sm"
                  >
                    {modalLoading ? (
                      <span className="loading loading-spinner loading-md text-white"></span>
                    ) : (
                      "Add Transaction"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
