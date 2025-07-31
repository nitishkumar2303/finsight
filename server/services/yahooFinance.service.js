import axios from "axios";
import StockPrice from "../config/models/stockPrice.model.js";

class YahooFinanceService {
  constructor() {
    this.baseURL = "https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock";
    this.headers = {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com",
    };
    
    // Debug: Check if API key is loaded
    if (!process.env.RAPIDAPI_KEY) {
      console.error("❌ RAPIDAPI_KEY is not set in environment variables!");
    } else {
      console.log("✅ RAPIDAPI_KEY found:", process.env.RAPIDAPI_KEY.substring(0, 10) + "...");
    }
  }

  // Get cached price from database
  async getPriceFromAPI(ticker) {
    try {
      console.log(`🔍 Making API request for ${ticker}...`);
      console.log(`📍 URL: ${this.baseURL}/quote`);
      console.log(`🔑 Headers:`, this.headers);
      
      const response = await axios.get(`${this.baseURL}/quote`, {
        headers: this.headers,
        params: { symbols: ticker },
        timeout: 10000, // 10 second timeout
      });
      
      console.log(`✅ API response status for ${ticker}:`, response.status);
      console.log(`📊 API response data for ${ticker}:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching price from API for ${ticker}:`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);
      console.error(`   Data: ${JSON.stringify(error.response?.data)}`);
      console.error(`   Message: ${error.message}`);
      return null;
    }
  }
  
  // ...existing code...
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

  // Fetch stock metadata from Yahoo Finance (for cron job - full API fetch)
  async getStockMetadata(ticker) {
    try {
      console.log(`Fetching metadata for ticker: ${ticker}`);

      // Fetch financial data module
      const financialResponse = await axios.get(`${this.baseURL}/modules`, {
        headers: this.headers,
        params: {
          symbol: ticker,
          module: "financial-data",
        },
      });

      // Fetch company profile for sector/industry info
      const profileResponse = await axios.get(`${this.baseURL}/modules`, {
        headers: this.headers,
        params: {
          symbol: ticker,
          module: "asset-profile",
        },
      });

      // Fetch price data for market cap
      const priceResponse = await axios.get(`${this.baseURL}/modules`, {
        headers: this.headers,
        params: {
          symbol: ticker,
          module: "price",
        },
      });

      const financialData = financialResponse.data?.body || {};
      const profileData = profileResponse.data?.body || {};
      const priceData = priceResponse.data?.body || {};

      // Debug: Log all available keys and look for market cap
      console.log(`\n=== DEBUG for ${ticker} ===`);
      console.log(`Financial data keys:`, Object.keys(financialData));
      console.log(`Price data keys:`, Object.keys(priceData));
      console.log(`Profile data keys:`, Object.keys(profileData));

      // Look for any field containing "market" or "cap"
      const allFields = { ...financialData, ...priceData, ...profileData };
      const marketCapFields = Object.keys(allFields).filter(
        (key) =>
          key.toLowerCase().includes("market") ||
          key.toLowerCase().includes("cap")
      );
      console.log(`Fields containing 'market' or 'cap':`, marketCapFields);

      // Get market cap from financial data (it should be in the same format as totalCash)
      let marketCap = null;

      // Try different possible locations for market cap
      // Market cap might be named differently in the API response
      const possibleMarketCapFields = [
        "marketCap",
        "marketCapitalization",
        "enterpriseValue",
        "marketValue",
        "totalMarketValue",
        "sharesOutstanding",
      ];

      for (const field of possibleMarketCapFields) {
        if (financialData[field]?.raw) {
          marketCap = financialData[field].raw;
          console.log(`Found ${field} in financialData: ${marketCap}`);
          break;
        } else if (priceData[field]?.raw) {
          marketCap = priceData[field].raw;
          console.log(`Found ${field} in priceData: ${marketCap}`);
          break;
        } else if (profileData[field]?.raw) {
          marketCap = profileData[field].raw;
          console.log(`Found ${field} in profileData: ${marketCap}`);
          break;
        }
      }

      // If we found sharesOutstanding, calculate market cap
      if (
        !marketCap &&
        priceData.sharesOutstanding?.raw &&
        priceData.regularMarketPrice?.raw
      ) {
        marketCap =
          priceData.sharesOutstanding.raw * priceData.regularMarketPrice.raw;
        console.log(`Calculated marketCap from shares * price: ${marketCap}`);
      }

      console.log(`Final market cap for ${ticker}: ${marketCap}`);
      console.log(`=== END DEBUG ===\n`);

      const metadata = {
        companyName: profileData.longName || profileData.shortName || ticker,
        sector: profileData.sector || "",
        industry: profileData.industry || "",
        marketCap: marketCap,
        marketCapCategory: this.getMarketCapCategory(marketCap),
        currency:
          financialData.financialCurrency || priceData.currency || "USD",
        exchange: priceData.exchangeName || priceData.exchange || "",
        currentPrice:
          financialData.currentPrice?.raw ||
          priceData.regularMarketPrice?.raw ||
          null,
        targetMeanPrice: financialData.targetMeanPrice?.raw || null,
        recommendationKey: financialData.recommendationKey || "",
        peRatio: priceData.trailingPE?.raw || null,
        profitMargins: financialData.profitMargins?.raw || null,
        returnOnEquity: financialData.returnOnEquity?.raw || null,
        revenueGrowth: financialData.revenueGrowth?.raw || null,
        earningsGrowth: financialData.earningsGrowth?.raw || null,
        metadataFetchedAt: new Date(),
      };

      console.log(`Successfully fetched metadata for ${ticker}:`, metadata);
      return metadata;
    } catch (error) {
      console.error(`Error fetching metadata for ${ticker}:`, error.message);

      // If API fails, try to use mock data for testing
      console.log(`API failed for ${ticker}, using mock data for testing`);
      return this.getMockMetadata(ticker);
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
      'AAPL': { marketCap: 3200000000000, price: 211.27, sector: 'Technology' }, // $3.2T - Large Cap
      'MSFT': { marketCap: 2800000000000, price: 512.57, sector: 'Technology' }, // $2.8T - Large Cap  
      'JNJ': { marketCap: 425000000000, price: 168.11, sector: 'Healthcare' }, // $425B - Large Cap
      'BA': { marketCap: 115000000000, price: 226.08, sector: 'Industrials' }, // $115B - Large Cap
      'XOM': { marketCap: 485000000000, price: 112.88, sector: 'Energy' }, // $485B - Large Cap
      'ALK': { marketCap: 6800000000, price: 54.15, sector: 'Industrials' }, // $6.8B - Mid Cap
      'DOCU': { marketCap: 16500000000, price: 79.88, sector: 'Technology' }, // $16.5B - Large Cap
      'ENPH': { marketCap: 4200000000, price: 33.48, sector: 'Technology' }, // $4.2B - Mid Cap
      'GME': { marketCap: 6900000000, price: 22.55, sector: 'Consumer Cyclical' }, // $6.9B - Mid Cap
    };

    const mock = mockData[ticker] || { marketCap: 5000000000, price: 100, sector: 'Unknown' };
    
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
      returnOnEquity: 0.20,
      revenueGrowth: 0.10,
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
