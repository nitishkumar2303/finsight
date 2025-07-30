# Enhanced Portfolio with Stock Metadata

## New Features Added

### 1. Enhanced Database Schema

- **Holding Model**: Extended to include comprehensive stock metadata
- **Stock Metadata Fields**:
  - Company name, sector, industry
  - Market cap and market cap category (Large/Mid/Small/Micro Cap)
  - Financial metrics (PE ratio, profit margins, ROE, etc.)
  - Current price and target prices
  - Analyst recommendations

### 2. Yahoo Finance Integration

- **API Service**: `yahooFinance.service.js`
- **Automatic Stock Metadata Fetching**: When adding stocks to portfolio
- **Multiple API Endpoints**: Financial data, company profile, price data
- **Fallback Handling**: Graceful handling of API failures

### 3. Portfolio Insights

- **Sector Allocation**: View portfolio distribution by sectors
- **Market Cap Allocation**: View distribution by market cap categories
- **Enhanced Pie Charts**: Multiple view modes (Holdings/Sectors/Market Cap)
- **Risk Metrics**: Diversification score, average PE, average ROE

### 4. New API Endpoints

- `GET /holdings/insights` - Get comprehensive portfolio insights
- Enhanced `POST /holdings/add` - Now fetches and stores stock metadata

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the server directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/finsight

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# RapidAPI Key for Yahoo Finance
RAPIDAPI_KEY=your_rapidapi_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 2. Get RapidAPI Key

1. Go to [RapidAPI Yahoo Finance](https://rapidapi.com/apidojo/api/yahoo-finance1/)
2. Subscribe to the API (free tier available)
3. Copy your API key to the `.env` file

### 3. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 4. Run the Application

```bash
# Start server (from server directory)
npm start

# Start client (from client directory)
npm run dev
```

## How It Works

### Adding Stocks

1. When you add a stock to your portfolio, the system:
   - Fetches comprehensive metadata from Yahoo Finance API
   - Stores the metadata in the MongoDB holding document
   - Calculates market cap category automatically
   - Saves financial metrics for analysis

### Portfolio Insights

1. The insights API calculates:
   - **Sector Distribution**: How your portfolio is allocated across different sectors
   - **Market Cap Distribution**: Breakdown by Large/Mid/Small cap stocks
   - **Risk Metrics**: Diversification score based on sector spread
   - **Top Performers**: Ranked by percentage returns

### Enhanced Visualization

1. **Portfolio Distribution Card** now supports three views:
   - **Holdings**: Individual stock allocation (original view)
   - **Sectors**: Allocation by business sectors
   - **Market Cap**: Allocation by company size categories

### Data Structure Example

```javascript
// Enhanced Holding Document
{
  userId: ObjectId,
  ticker: "AAPL",
  quantity: 10,
  purchasePrice: 150.00,
  stockMetadata: {
    companyName: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 3000000000000,
    marketCapCategory: "Large Cap",
    currentPrice: 211.27,
    peRatio: 25.4,
    profitMargins: 0.243,
    recommendationKey: "buy"
    // ... more fields
  }
}
```

## Future Enhancements

- Real-time stock price updates
- Historical performance tracking
- Risk analysis and recommendations
- Portfolio rebalancing suggestions
- ESG (Environmental, Social, Governance) scoring
- Dividend tracking and analysis

## API Usage Examples

### Get Portfolio Insights

```javascript
const insights = await axios.get("/api/holdings/insights", {
  headers: { Authorization: `Bearer ${token}` },
});

console.log(insights.data);
// Returns: sector allocation, market cap distribution, risk metrics, etc.
```

### Add Stock with Metadata

```javascript
const response = await axios.post(
  "/api/holdings/add",
  {
    ticker: "AAPL",
    quantity: 10,
    purchasePrice: 150.0,
    purchaseDate: "2024-01-15",
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

console.log(response.data.stockMetadata);
// Returns: comprehensive stock information fetched from Yahoo Finance
```
