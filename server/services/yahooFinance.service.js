import axios from "axios";
import StockPrice from "../config/models/stockPrice.model.js";

class YahooFinanceService {
  constructor() {
    this.geminiApiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    this.geminiApiKey = process.env.GEMINI_API_KEY;

    // Debug: Check if API key is loaded
    if (!this.geminiApiKey) {
      console.error("❌ GEMINI_API_KEY is not set in environment variables!");
    } else {
      console.log(
        "✅ GEMINI_API_KEY found:",
        this.geminiApiKey.substring(0, 10) + "..."
      );
    }
  }

  // Get cached price from database
  async getCachedPrice(ticker) {
    try {
      const stockPrice = await StockPrice.findOne({ ticker })
        .sort({ "values.datetime": -1 })
        .limit(1);

      if (stockPrice && stockPrice.values && stockPrice.values.length > 0) {
        const latestPrice = stockPrice.values[stockPrice.values.length - 1];
        return latestPrice.close;
      }
      return null;
    } catch (error) {
      console.error(
        `Error fetching cached price for ${ticker}:`,
        error.message
      );
      return null;
    }
  }

  // Get stock data from Gemini AI
  async getPriceFromAPI(ticker) {
    try {
      console.log(`� Fetching stock data for ${ticker} using Gemini AI...`);

      const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      const prompt = `Get the latest stock information for ${ticker} as of ${currentDate}. 
      Please provide ONLY a JSON response with the following exact structure (no additional text):
      {
        "symbol": "${ticker}",
        "price": current_stock_price_number,
        "currency": "USD",
        "lastUpdated": "${currentDate}",
        "success": true
      }
      
      Make sure to provide the most recent available stock price data. If the stock doesn't exist, set success to false.`;

      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      console.log(
        `✅ Gemini API response status for ${ticker}:`,
        response.status
      );

      const geminiResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (geminiResponse) {
        try {
          // Clean the response to extract JSON
          const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const stockData = JSON.parse(jsonMatch[0]);
            console.log(`📊 Parsed stock data for ${ticker}:`, stockData);
            return stockData;
          }
        } catch (parseError) {
          console.error(
            `❌ Error parsing Gemini response for ${ticker}:`,
            parseError.message
          );
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ Error fetching stock data from Gemini for ${ticker}:`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Message: ${error.message}`);
      return null;
    }
  }

  // Determine market cap category based on market cap value
  getMarketCapCategory(marketCap) {
    if (!marketCap || marketCap <= 0) return "Unknown";

    const capInBillions = marketCap / 1000000000;

    console.log(`Market cap: ${marketCap}, in billions: ${capInBillions}`);

    if (capInBillions >= 10) return "Large Cap"; // >= $10B
    if (capInBillions >= 2) return "Mid Cap"; // $2B - $10B
    if (capInBillions >= 0.3) return "Small Cap"; // $300M - $2B
    return "Micro Cap"; // < $300M
  }

  // Fetch stock metadata from Gemini AI (for cron job - full API fetch)
  async getStockMetadata(ticker) {
    try {
      console.log(`Fetching metadata for ticker: ${ticker} using Gemini AI`);

      const currentDate = new Date().toISOString().split("T")[0];

      const prompt = `Get comprehensive stock information for ${ticker} as of ${currentDate}. 
      Please provide ONLY a JSON response with the following exact structure (no additional text):
      {
        "symbol": "${ticker}",
        "companyName": "Company Full Name",
        "sector": "Sector Name",
        "industry": "Industry Name",
        "marketCap": market_cap_in_dollars_number,
        "currency": "USD",
        "exchange": "Exchange Name",
        "currentPrice": current_price_number,
        "targetMeanPrice": analyst_target_price_number,
        "recommendationKey": "buy/hold/sell",
        "peRatio": pe_ratio_number,
        "profitMargins": profit_margin_decimal,
        "returnOnEquity": roe_decimal,
        "revenueGrowth": revenue_growth_decimal,
        "earningsGrowth": earnings_growth_decimal,
        "lastUpdated": "${currentDate}",
        "success": true
      }
      
      Make sure all financial data is current and accurate. If the stock doesn't exist or data is unavailable, set success to false.`;

      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );

      console.log(
        `✅ Gemini metadata response status for ${ticker}:`,
        response.status
      );

      const geminiResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (geminiResponse) {
        try {
          // Clean the response to extract JSON
          const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const stockData = JSON.parse(jsonMatch[0]);

            if (stockData.success) {
              const metadata = {
                companyName: stockData.companyName || ticker,
                sector: stockData.sector || "",
                industry: stockData.industry || "",
                marketCap: stockData.marketCap || null,
                marketCapCategory: this.getMarketCapCategory(
                  stockData.marketCap
                ),
                currency: stockData.currency || "USD",
                exchange: stockData.exchange || "",
                currentPrice: stockData.currentPrice || null,
                targetMeanPrice: stockData.targetMeanPrice || null,
                recommendationKey: stockData.recommendationKey || "",
                peRatio: stockData.peRatio || null,
                profitMargins: stockData.profitMargins || null,
                returnOnEquity: stockData.returnOnEquity || null,
                revenueGrowth: stockData.revenueGrowth || null,
                earningsGrowth: stockData.earningsGrowth || null,
                metadataFetchedAt: new Date(),
              };

              console.log(
                `Successfully fetched metadata for ${ticker}:`,
                metadata
              );
              return metadata;
            }
          }
        } catch (parseError) {
          console.error(
            `❌ Error parsing Gemini metadata response for ${ticker}:`,
            parseError.message
          );
        }
      }

      // If Gemini fails, use mock data for testing
      console.log(`Gemini failed for ${ticker}, using mock data for testing`);
      return this.getMockMetadata(ticker);
    } catch (error) {
      console.error(`Error fetching metadata for ${ticker}:`, error.message);

      // If API fails, try to use mock data for testing
      console.log(`API failed for ${ticker}, using mock data for testing`);
      return this.getMockMetadata(ticker);
    }
  }

  // Get stock suggestions for search dropdown
  async getStockSuggestions(query) {
    try {
      console.log(`🔍 Getting stock suggestions for: ${query}`);

      const prompt = `Provide stock ticker suggestions for the search query "${query}". 
      Please provide ONLY a JSON response with the following exact structure (no additional text):
      {
        "suggestions": [
          {
            "symbol": "TICKER1",
            "name": "Company Name 1",
            "exchange": "NASDAQ"
          },
          {
            "symbol": "TICKER2", 
            "name": "Company Name 2",
            "exchange": "NYSE"
          }
        ],
        "success": true
      }
      
      Include up to 10 relevant stock suggestions. Match by company name, ticker symbol, or industry. Only include real, actively traded stocks.`;

      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log(`✅ Gemini suggestions response status:`, response.status);

      const geminiResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (geminiResponse) {
        try {
          // Clean the response to extract JSON
          const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const suggestionData = JSON.parse(jsonMatch[0]);
            console.log(`📊 Stock suggestions for ${query}:`, suggestionData);
            return suggestionData.suggestions || [];
          }
        } catch (parseError) {
          console.error(
            `❌ Error parsing Gemini suggestions response:`,
            parseError.message
          );
        }
      }

      return [];
    } catch (error) {
      console.error(`❌ Error fetching stock suggestions from Gemini:`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Message: ${error.message}`);
      return [];
    }
  }

  // Get cached stock metadata (for regular requests - uses database)
  async getCachedStockMetadata(ticker) {
    try {
      // Get cached price from database
      const cachedPrice = await this.getCachedPrice(ticker);

      // For now, return basic metadata with cached price
      // In a real implementation, you might want to cache full metadata too
      return {
        companyName: ticker,
        sector: "",
        industry: "",
        marketCap: null,
        marketCapCategory: "Unknown",
        currency: "USD",
        exchange: "",
        currentPrice: cachedPrice,
        targetMeanPrice: null,
        recommendationKey: "",
        peRatio: null,
        profitMargins: null,
        returnOnEquity: null,
        revenueGrowth: null,
        earningsGrowth: null,
        metadataFetchedAt: new Date(),
        fromCache: true,
      };
    } catch (error) {
      console.error(
        `Error fetching cached metadata for ${ticker}:`,
        error.message
      );
      return this.getDefaultMetadata(ticker);
    }
  }

  // Batch fetch metadata for multiple tickers
  async batchGetStockMetadata(tickers) {
    const metadataPromises = tickers.map((ticker) =>
      this.getStockMetadata(ticker)
    );
    const results = await Promise.allSettled(metadataPromises);

    const metadata = {};
    results.forEach((result, index) => {
      const ticker = tickers[index];
      if (result.status === "fulfilled") {
        metadata[ticker] = result.value;
      } else {
        console.error(`Failed to fetch metadata for ${ticker}:`, result.reason);
        metadata[ticker] = this.getDefaultMetadata(ticker);
      }
    });

    return metadata;
  }

  // Mock metadata for testing market cap categorization
  getMockMetadata(ticker) {
    const mockData = {
      AAPL: { marketCap: 3200000000000, price: 211.27, sector: "Technology" }, // $3.2T - Large Cap
      MSFT: { marketCap: 2800000000000, price: 512.57, sector: "Technology" }, // $2.8T - Large Cap
      JNJ: { marketCap: 425000000000, price: 168.11, sector: "Healthcare" }, // $425B - Large Cap
      BA: { marketCap: 115000000000, price: 226.08, sector: "Industrials" }, // $115B - Large Cap
      XOM: { marketCap: 485000000000, price: 112.88, sector: "Energy" }, // $485B - Large Cap
      ALK: { marketCap: 6800000000, price: 54.15, sector: "Industrials" }, // $6.8B - Mid Cap
      DOCU: { marketCap: 16500000000, price: 79.88, sector: "Technology" }, // $16.5B - Large Cap
      ENPH: { marketCap: 4200000000, price: 33.48, sector: "Technology" }, // $4.2B - Mid Cap
      GME: { marketCap: 6900000000, price: 22.55, sector: "Consumer Cyclical" }, // $6.9B - Mid Cap
    };

    const mock = mockData[ticker] || {
      marketCap: 5000000000,
      price: 100,
      sector: "Unknown",
    };

    return {
      companyName: ticker,
      sector: mock.sector,
      industry: "",
      marketCap: mock.marketCap,
      marketCapCategory: this.getMarketCapCategory(mock.marketCap),
      currency: "USD",
      exchange: "NASDAQ",
      currentPrice: mock.price,
      targetMeanPrice: mock.price * 1.1,
      recommendationKey: "buy",
      peRatio: 25,
      profitMargins: 0.15,
      returnOnEquity: 0.2,
      revenueGrowth: 0.1,
      earningsGrowth: 0.12,
      metadataFetchedAt: new Date(),
    };
  }

  // Get default metadata structure
  getDefaultMetadata(ticker) {
    return {
      companyName: ticker,
      sector: "",
      industry: "",
      marketCap: null,
      marketCapCategory: "Unknown",
      currency: "USD",
      exchange: "",
      currentPrice: null,
      targetMeanPrice: null,
      recommendationKey: "",
      peRatio: null,
      profitMargins: null,
      returnOnEquity: null,
      revenueGrowth: null,
      earningsGrowth: null,
      metadataFetchedAt: new Date(),
    };
  }
}

export default new YahooFinanceService();
