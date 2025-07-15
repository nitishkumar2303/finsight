import dotenv from "dotenv";
dotenv.config();
// services/stock.service.js
import axios from "axios";

const RAPID_API_KEY = process.env.RAPIDAPI_KEY;
const API_HOST = "insightsentry.p.rapidapi.com";

export const fetchLivePrice = async (ticker) => {
  try {
    const response = await axios.get(
       "https://insightsentry.p.rapidapi.com/v2/symbols/NASDAQ:" +
        ticker +
        "/series",
      {
        params: {
          bar_type: "day",
          bar_interval: "1",
          extended: "true",
          badj: "true",
          dadj: "false",
        },
        headers: {
          "x-rapidapi-host": API_HOST,
          "x-rapidapi-key": RAPID_API_KEY,
        },
      }
    );
    // console.log(`🔍 Response for ${ticker}:`, response.data);

    // Correct extraction from 'series'
    const price = response.data?.series?.[0]?.close || 0;
    return parseFloat(price);
  } catch (err) {
    console.error(`❌ Price fetch error for ${ticker}:`, err.message);
    return 0;
  }
};

export const fetchPriceHistory = async (ticker, startDate, endDate) => {
  try {
    const response = await axios.get(
      `https://twelve-data1.p.rapidapi.com/time_series`,
      {
        params: {
          symbol: ticker,
          interval: "1day",
          outputsize: 100,
          format: "json",
          start_date: startDate,
          end_date: endDate,
        },
        headers: {
          "x-rapidapi-host": "twelve-data1.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        },
      }
    );
    return response.data?.values || [];
  } catch (err) {
    console.error(`❌ Price history fetch error for ${ticker}:`, err.message);
    return [];
  }
};

