import upstox from "upstox-js-sdk";

const config = new upstox.Configuration({
  accessToken: process.env.UPSTOX_ACCESS_TOKEN,
});

const api = new upstox.MarketDataApi(config);

export const getLivePrice = async (symbol) => {
  try {
    const response = await api.getMarketQuoteSnapshot("NSE_EQ", symbol);
    return response.data.last_price; // current stock price
  } catch (error) {
    console.error("Error:", error.message);
    return 0;
  }
};