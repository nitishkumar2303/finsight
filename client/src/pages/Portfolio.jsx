import React from "react";
import { useEffect } from "react";
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

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, []);

  // Data for the performance line chart
  const performanceData = {
    labels: ["1D", "1W", "1M", "YTD", "1Y", "Max"],
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

  const stocks = [
    {
      name: "Tata Steel GDR",
      code: "TTST x23",
      logo: "https://via.placeholder.com/20",
      buyIn: "₹34,500.00",
      position: "₹34,858.42",
      profit: "+₹358.42",
      change: "↑ 1.04%",
    },
    {
      name: "Reliance Industries",
      code: "REL x15",
      logo: "", // No image, fallback dot shown
      buyIn: "₹15,000.00",
      position: "₹15,000.00",
      profit: "+₹0.00",
      change: "↑ 0.00%",
    },
    {
      name: "TTML",
      code: "TTML x234",
      logo: "",
      buyIn: "₹11,700.00",
      position: "₹11,700.00",
      profit: "+₹0.00",
      change: "↑ 0.00%",
    },
    {
      name: "Infosys",
      code: "INFY x34",
      logo: "",
      buyIn: "₹11,016.00",
      position: "₹11,016.00",
      profit: "+₹0.00",
      change: "↑ 0.00%",
    },
    {
      name: "State Bank of India",
      code: "SBIN x23",
      logo: "",
      buyIn: "₹7,866.00",
      position: "₹7,866.00",
      profit: "+₹0.00",
      change: "↑ 0.00%",
    },
  ];

  // Data for the allocation doughnut chart
  const allocationData = {
    labels: ["Total Net Worth"],
    datasets: [
      {
        data: [35.128],
        backgroundColor: ["rgb(37,59,190)"],
      },
    ],
  };

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
                    <span>1D</span> <span>1W</span> <span>1M</span>{" "}
                    <span>YTD</span>
                    <span>1Y</span> <span>Max</span>
                  </div>
                </div>
                <div className="mt- xs:mt-3 sm:mt-6">
                  <div className="w-full h-40 xs:h-52 sm:h-60">
                    <Line
                      data={{
                        ...performanceData,
                        datasets: [
                          {
                            ...performanceData.datasets[0],
                            borderColor: "#00BFFF", // DeepSkyBlue
                            backgroundColor: "transparent", // Make background transparent
                          },
                        ],
                      }}
                      options={{
                        maintainAspectRatio: false,
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
                <div className="ml-auto">
                  <button className="bg-white text-black px-1 xs:px-2 py-0.5 xs:py-1 rounded text-xs xs:text-sm">
                    + Add transaction
                  </button>
                </div>
              </div>
              <div className="mt-1 xs:mt-2 sm:mt-4 text-xs xs:text-sm">
                <div className="w-full">
                  {/* Header */}
                  <div className="flex text-gray-400 font-semibold border-b border-neutral-700 py-0.5 xs:py-1 sm:py-2">
                    <div className="w-2/5">Title</div>
                    <div className="w-1/5">Buy in</div>
                    <div className="w-1/5">Position</div>
                    <div className="w-1/5">P/L</div>
                  </div>

                  {/* Rows */}
                  <table className="w-full text-xs xs:text-sm text-left text-gray-300 border-separate border-spacing-y-1 xs:border-spacing-y-2 sm:border-spacing-y-3">
                    <tbody>
                      {stocks.map((stock, index) => (
                        <tr
                          key={index}
                          className="rounded-lg hover:bg-[rgb(50,50,51)] transition"
                        >
                          <td className="px-1 xs:px-2 sm:px-4 py-1 xs:py-2 sm:py-3">
                            <div className="flex items-center">
                              <img
                                src={`https://picsum.photos/200?random=${index}`}
                                alt="Random"
                                className="w-6 xs:w-8 h-6 xs:h-8 mr-1 xs:mr-2 sm:mr-3 rounded-full"
                              />

                              <div className="leading-tight text-xs xs:text-sm">
                                <div className="text-white font-medium">
                                  {stock.name}
                                </div>
                                <div className="text-gray-400 text-[10px] xs:text-xs font-extralight">
                                  {stock.code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-1 xs:px-2 sm:px-4 py-1 xs:py-2 sm:py-3">
                            {stock.buyIn}
                          </td>
                          <td className="px-1 xs:px-2 sm:px-4 py-1 xs:py-2 sm:py-3">
                            {stock.position}
                          </td>
                          <td className="px-1 xs:px-2 sm:px-4 py-1 xs:py-2 sm:py-3 text-green-400">
                            <div className="flex flex-col items-start">
                              <span>{stock.profit}</span>
                              <span className="text-xs">{stock.change}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
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
    </>
  );
};

export default Dashboard;
