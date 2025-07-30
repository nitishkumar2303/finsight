# Stock Insights Setup Guide

## Prerequisites

1. **Google Gemini API Key**: You need to get an API key from Google AI Studio
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the API key

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Existing variables (if any)
PORT=5050
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# New variable for Stock Insights
GEMINI_API_KEY=your_gemini_api_key_here
```

## Features Added

### 1. Stock Insights Service (`services/stockInsights.service.js`)

- Uses Google Gemini API to provide comprehensive stock analysis
- Returns structured data including:
  - Company overview
  - Fundamental analysis
  - Technical analysis
  - Investment recommendations
  - Financial health metrics
  - Market position
  - Future outlook

### 2. Stock Insights Controller (`controllers/stockInsights.controller.js`)

- Handles API requests for stock insights
- Validates ticker symbols
- Returns formatted responses

### 3. Stock Insights Routes (`routes/stockInsights.routes.js`)

- Protected route requiring authentication
- Endpoint: `GET /api/stock-insights/:ticker`

### 4. Frontend Stock Insights Page (`client/src/pages/StockInsights.jsx`)

- Comprehensive UI displaying all stock insights
- Responsive design with modern styling
- Error handling and loading states
- Navigation back to portfolio

### 5. Updated Portfolio Page

- Added "View Insights" button to each stock position
- New "Actions" column in the positions table
- Direct navigation to stock insights page

## API Endpoints

### Get Stock Insights

```
GET /api/stock-insights/:ticker
Authorization: Bearer <token>
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "company_name": "Apple Inc.",
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "description": "Apple Inc. designs, manufactures, and markets..."
    },
    "fundamental_analysis": {
      "market_cap": "$2.5T",
      "pe_ratio": "25.5",
      "pb_ratio": "15.2",
      "debt_to_equity": "1.2",
      "current_ratio": "1.8",
      "roe": "15.5%",
      "roa": "8.2%"
    },
    "technical_analysis": {
      "current_price": "$150.25",
      "price_change": "+2.5%",
      "support_levels": ["$145", "$140"],
      "resistance_levels": ["$155", "$160"],
      "trend": "Bullish"
    },
    "investment_analysis": {
      "risk_level": "Medium",
      "investment_horizon": "Long-term",
      "pros": ["Strong brand", "Innovation leader", "Cash rich"],
      "cons": ["High valuation", "Market saturation", "Regulatory risks"],
      "recommendation": "Buy - Strong fundamentals and growth potential"
    },
    "financial_health": {
      "revenue_growth": "8.5%",
      "profit_margin": "25.2%",
      "cash_flow": "Strong positive",
      "dividend_yield": "0.5%"
    },
    "market_position": {
      "competitors": ["Samsung", "Google", "Microsoft"],
      "market_share": "15.2%",
      "competitive_advantages": ["Brand loyalty", "Ecosystem", "Innovation"]
    },
    "future_outlook": {
      "growth_potential": "High",
      "risks": ["Economic downturn", "Supply chain issues"],
      "opportunities": [
        "AI integration",
        "Emerging markets",
        "Services growth"
      ],
      "catalyst": "New product launches and AI integration"
    }
  }
}
```

## Usage

1. **From Portfolio Page**: Click "View Insights" button next to any stock position
2. **Direct URL**: Navigate to `/stock-insights/AAPL` (replace AAPL with any ticker)
3. **Authentication**: Must be logged in to access insights

## Error Handling

- Invalid ticker symbols return 400 error
- API failures return 500 error with details
- Frontend shows appropriate error messages and loading states

## Dependencies Added

- `@google/generative-ai`: Google Gemini API client

## Notes

- The Gemini API provides real-time analysis based on current market data
- Responses are structured but may vary based on available information
- API calls are rate-limited by Google's policies
- Consider implementing caching for frequently accessed stocks
