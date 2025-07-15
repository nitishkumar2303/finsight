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

  // Data for the performance line chart
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

  const allocationData = {
    labels: ["Total Net Worth"],
    datasets: [
      {
        data: [35.128],
        backgroundColor: ["rgb(37,59,190)"],
      },
    ],
  };

  //the below function is used to handle the form input changes
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
      <div className="bg-black text-white min-h-screen w-full p-2 xs:p-3 sm:p-6 rounded-lg font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start mt-16 xs:mt-16 sm:mt-20 m-2 xs:m-4 sm:m-8 space-y-2 xs:space-y-3 sm:space-y-0 sm:space-x-8">
          {/* Left Section: Portfolio and Performance */}
          <div className="flex flex-col w-full sm:w-4/5">
            <div className="bg-[rgb(33,33,34)] p-2 xs:p-3 sm:p-5 rounded-[4px] mr-0 sm:mr-5">
              <div className="flex items-center border-b-1 border-neutral-600 pb-1 xs:pb-2 sm:pb-4">
                <h2 className="text-base xs:text-l font-bold">Portfolio</h2>
                <div className="ml-auto flex space-x-1 xs:space-x-2">
                  <span className="pt-1 font-bold">⚙️</span>
                  <span className="pt-1 font-bold">⋮</span>
                </div>
              </div>

              <div>
                <div className="mt-1 xs:mt-2 sm:mt-4 flex justify-between">
                  <div>
                    <h1 className="text-2xl xs:text-3xl">₹ 35,128.93</h1>
                    <span className="text-green-400 text-sm xs:text-base">
                      ↑ 1.82% (+₹628.93)
                    </span>
                  </div>
                  <div className="mt-1 xs:mt-2 sm:mt-4 flex space-x-1 xs:space-x-2 sm:space-x-4 text-xs xs:text-sm text-gray-400">
                    {["day", "week", "month", "year"].map((range, idx) => (
                      <button
                        key={range}
                        className={`px-2 py-1 rounded ${
                          selectedRange === range ||
                          (range === "YTD" && selectedRange === "YTD") ||
                          (range === "max" && selectedRange === "max")
                            ? "bg-blue-600 text-white"
                            : ""
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
                          : range === "YTD"
                          ? "YTD"
                          : "Max"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt- xs:mt-3 sm:mt-6">
                  <div className="w-full h-24 xs:h-32 sm:h-40">
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
                                // Show value with currency
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

            {/* Positions Section */}
            <div className="mt-2 xs:mt-3 sm:mt-6 bg-[rgb(33,33,34)] p-2 xs:p-3 sm:p-5 rounded-[4px] mr-0 sm:mr-5">
              <div className="flex items-center border-b-1 border-neutral-600 pb-1 xs:pb-2 sm:pb-4">
                <h2 className="text-base xs:text-l font-bold">Positions</h2>
                <div className="ml-auto flex space-x-2">
                  <button
                    className="bg-white text-black px-1 xs:px-2 py-0.5 xs:py-1 rounded text-xs xs:text-sm"
                    onClick={() => fetchStocksAndPrices(true)}
                  >
                    Refresh
                  </button>
                  <button
                    className="bg-blue-600 text-white px-1 xs:px-2 py-0.5 xs:py-1 rounded text-xs xs:text-sm hover:bg-blue-700 transition"
                    onClick={() => setShowModal(true)}
                  >
                    + Add transaction
                  </button>
                </div>
              </div>
              <div className="text-xs xs:text-sm">
                <div className="w-full">
                  {/* Header */}
                  <table className="w-full text-xs xs:text-sm text-left text-gray-300 border-separate border-spacing-y-1 xs:border-spacing-y-2 sm:border-spacing-y-3">
                    <thead>
                      <tr className="bg-[rgb(33,33,34)]">
                        <th className="w-2/5 px-2 py-2 text-left font-semibold text-gray-400">
                          Title
                        </th>
                        <th className="w-1/5 px-2 py-2 text-left font-semibold text-gray-400">
                          Buy in
                        </th>
                        <th className="w-1/5 px-2 py-2 text-left font-semibold text-gray-400">
                          Position
                        </th>
                        <th className="w-1/5 px-2 py-2 text-left font-semibold text-gray-400">
                          P/L
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8">
                            {/* Simple spinner */}
                            <div className="flex justify-center items-center">
                              <svg
                                className="animate-spin h-6 w-6 text-blue-400"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                              </svg>
                              <span className="ml-2 text-blue-400">
                                Fetching live prices...
                              </span>
                            </div>
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

                          // Set color based on profit/loss
                          const profitLossColor =
                            profitLoss !== null
                              ? profitLoss >= 0
                                ? "text-green-400"
                                : "text-red-400"
                              : "";

                          return (
                            <tr
                              key={index}
                              className="rounded-lg hover:bg-[rgb(50,50,51)] transition"
                            >
                              {/* Title */}
                              <td className="w-2/5 px-2 py-2 align-middle">
                                <div className="flex items-center">
                                  <img
                                    src={`https://picsum.photos/200?random=${index}`}
                                    alt="Random"
                                    className="w-6 xs:w-8 h-6 xs:h-8 mr-2 rounded-full"
                                  />
                                  <div>
                                    <div className="text-white font-medium">
                                      {stock.ticker}
                                    </div>
                                    <div className="text-gray-400 text-xs">
                                      {stock.quantity} shares
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {/* Buy in */}
                              <td className="w-1/5 px-2 py-2 align-middle">
                                <div>
                                  <div className="text-white font-medium">
                                    {buyValue !== null
                                      ? buyValue.toFixed(2)
                                      : "N/A"}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {stock.purchasePrice}
                                  </div>
                                </div>
                              </td>
                              {/* Position */}
                              <td className="w-1/5 px-2 py-2 align-middle">
                                <div>
                                  <div className="text-white font-medium">
                                    {currentValue !== null
                                      ? `₹${currentValue.toFixed(2)}`
                                      : "N/A"}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {stock.livePrice !== null
                                      ? `₹${stock.livePrice}`
                                      : "N/A"}
                                  </div>
                                </div>
                              </td>
                              {/* P/L */}
                              <td
                                className={`w-1/5 px-2 py-2 align-middle ${profitLossColor}`}
                              >
                                <div>
                                  <span>
                                    {profitLoss !== null
                                      ? profitLoss.toFixed(2)
                                      : "N/A"}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-1">
                                    {percentChange !== null
                                      ? `${
                                          percentChange >= 0 ? "↑" : "↓"
                                        } ${Math.abs(percentChange).toFixed(
                                          2
                                        )}%`
                                      : ""}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          {/* Right Section: Allocation */}
          <div className="w-full sm:w-2/6">
            <div className="bg-[rgb(33,33,34)] p-3 xs:p-5 sm:p-10 rounded-[4px] shadow-lg">
              <div className=" mb-1 xs:mb-2 sm:mb-4">Distribution</div>
              <div className="text-center">
                <Doughnut
                  data={allocationData}
                  options={{
                    cutout: "70%", // Adjust this value (e.g., '60%' or '80%') to change thickness
                    borderWidth: 0,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
                <h3 className="mt-1 xs:mt-2 sm:mt-4 text-base xs:text-lg">
                  Total Net Worth
                </h3>
                <h1 className="text-2xl xs:text-3xl">₹ 35,128.93</h1>
              </div>
            </div>

            {/* Add more blocks here */}
            {/* <ReactSpeedometer /> */}
            <div className="flex flex-col bg-[rgb(33,33,34)] mt-2 xs:mt-3 sm:mt-6 p-2 xs:p-3 sm:p-6 rounded-[8px] shadow-lg">
              <div className="flex justify-between items-center mb-1 xs:mb-2 sm:mb-4">
                <h2 className="text-white text-sm xs:text-base font-semibold">
                  Performance Meter
                </h2>
                <span className="text-gray-400 text-[10px] xs:text-xs">
                  Updated just now
                </span>
              </div>

              <div className="flex justify-center items-center h-32 xs:h-40">
                <ReactSpeedometer
                  width={180}
                  xs:width={230}
                  height={120}
                  xs:height={140}
                />
              </div>

              <button className="mt-1 xs:mt-2 sm:mt-4 self-center bg-blue-600 text-white px-2 xs:px-3 sm:px-5 py-0.5 xs:py-1 sm:py-1.5 rounded-md hover:bg-blue-700 transition text-xs xs:text-sm font-medium">
                Calculate Heat of Portfolio
              </button>

              <div className="mt-1 xs:mt-2 sm:mt-3 text-center text-[10px] xs:text-xs text-gray-400">
                Speedometer based on current portfolio trends.
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backdropFilter: "blur(20px)" }}
        >
          {/* Loading overlay */}
          {modalLoading && (
            <div
              className="fixed inset-0 z-60 flex flex-col items-center justify-center"
              style={{
                background: "rgba(33,33,34,0.85)",
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-8 border-blue-600 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-3 rounded-full border-4 border-blue-400 border-t-transparent animate-spin-slow"></div>
                  <div className="absolute w-6 h-6 bg-blue-600 rounded-full shadow-lg"></div>
                </div>
                <span className="mt-10 text-blue-400 text-lg font-bold animate-fade-in">
                  Adding transaction...
                </span>
                <style>
                  {`
                    @keyframes spin-slow {
                      0% { transform: rotate(0deg);}
                      100% { transform: rotate(360deg);}
                    }
                    .animate-spin-slow {
                      animation: spin-slow 2.5s linear infinite;
                    }
                    @keyframes fade-in {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                    .animate-fade-in {
                      animation: fade-in 0.7s ease;
                    }
                  `}
                </style>
              </div>
            </div>
          )}
          {/* Modal box */}
          <div
            className="bg-[#232324] text-white rounded-lg p-4 w-full max-w-sm shadow-2xl border border-[#2C2C2D] relative overflow-y-auto"
            style={{
              maxHeight: "90vh",
              minWidth: "260px",
            }}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
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
              &times;
            </button>
            <h2 className="text-lg font-bold mb-3">Add Transaction</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setModalLoading(true);
                try {
                  await axios.post(`${API}/holdings/add`, form, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
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
                <label className="block mb-1 text-gray-400 text-xs">
                  Transaction Type
                </label>
                <select
                  className="w-full p-1.5 rounded bg-[#2C2D2D] text-white border border-[#3A3A3C] text-xs"
                  value={form.transactionType || "Buy"}
                  onChange={(e) =>
                    setForm({ ...form, transactionType: e.target.value })
                  }
                >
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1 text-gray-400 text-xs">
                  Add Security
                </label>
                <input
                  type="text"
                  placeholder="Ticker, ISIN, Stock, ETF, ..."
                  className="w-full p-1.5 rounded bg-[#2C2D2D] text-white border border-[#3A3A3C] placeholder-gray-400 text-xs"
                  value={form.ticker}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm({ ...form, ticker: value });
                    clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(() => {
                      fetchStockSuggestions(value);
                    }, 500); // 500ms debounce
                  }}
                  required
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 bg-[#232324] border border-[#3A3A3C] rounded-md mt-1 w-full max-h-40 overflow-y-auto text-xs">
                    {suggestions.map((stock, idx) => (
                      <div
                        key={stock.symbol}
                        className="px-3 py-2 hover:bg-[#2C2D2D] cursor-pointer"
                        onClick={() => {
                          setForm({ ...form, ticker: stock.symbol });
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-semibold">{stock.symbol}</span> -{" "}
                        {stock.name} ({stock.exchange})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="block mb-1 text-gray-400 text-xs">
                  Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  className="w-full p-1.5 rounded bg-[#2C2D2D] text-white border border-[#3A3A3C] placeholder-gray-400 text-xs"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 text-gray-400 text-xs">
                  Transaction Date
                </label>
                <input
                  type="date"
                  className="w-full p-1.5 rounded bg-[#2C2D2D] text-white border border-[#3A3A3C] text-xs"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm({ ...form, purchaseDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-3 flex items-center gap-2">
                <div className="w-2/3">
                  <label className="block mb-1 text-gray-400 text-xs">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. ₹150.00"
                    className="w-full p-1.5 rounded bg-[#2C2D2D] text-white border border-[#3A3A3C] placeholder-gray-400 text-xs"
                    value={form.purchasePrice}
                    onChange={(e) =>
                      setForm({ ...form, purchasePrice: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="w-1/3">
                  <label className="block mb-1 text-gray-400 text-xs invisible">
                    Currency
                  </label>
                  <select
                    className="w-full p-1.5 rounded bg-[#2C2D2D] text-white border border-[#3A3A3C] text-xs"
                    value={form.currency || "INR"}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value })
                    }
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    {/* Add more currencies if needed */}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="block mb-1 text-gray-400 text-xs">
                  Notes
                </label>
                <textarea
                  placeholder="Notes"
                  className="w-full p-1.5 rounded bg-[#2C2D2D] text-white border border-[#3A3A3C] placeholder-gray-400 text-xs"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="mb-4 text-base font-bold text-white">
                Total Amount{" "}
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
                  className="w-full py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-100 transition text-sm"
                >
                  {modalLoading ? (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-8 border-blue-600 border-t-transparent animate-spin"></div>
                          <div className="absolute inset-3 rounded-full border-4 border-blue-400 border-t-transparent animate-spin-slow"></div>
                          <div className="absolute w-6 h-6 bg-blue-600 rounded-full shadow-lg"></div>
                        </div>
                        <span className="mt-10 text-blue-400 text-lg font-bold animate-fade-in">
                          Adding transaction...
                        </span>
                        <style>
                          {`
                            @keyframes spin-slow {
                              0% { transform: rotate(0deg);}
                              100% { transform: rotate(360deg);}
                            }
                            .animate-spin-slow {
                              animation: spin-slow 2.5s linear infinite;
                            }
                            @keyframes fade-in {
                              from { opacity: 0; }
                              to { opacity: 1; }
                            }
                            .animate-fade-in {
                              animation: fade-in 0.7s ease;
                            }
                          `}
                        </style>
                      </div>
                    </div>
                  ) : (
                    "Add Transaction"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
