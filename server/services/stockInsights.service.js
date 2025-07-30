import fetch from "node-fetch";
import StockInsightsCache from "../config/models/stockInsightsCache.model.js";

export const getStockInsights = async (ticker, forceRefresh = false) => {
  try {
    // If not forcing refresh, check if we have cached data for this ticker
    if (!forceRefresh) {
      const cachedInsights = await StockInsightsCache.findOne({
        ticker: ticker.toUpperCase(),
      }).sort({ createdAt: -1 });

      // If we have cached data that's less than 24 hours old, return it
      if (cachedInsights) {
        const cacheAge = Date.now() - cachedInsights.createdAt.getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (cacheAge < twentyFourHours) {
          console.log(
            `✅ Using cached insights for ${ticker.toUpperCase()}, cached ${Math.round(
              cacheAge / (1000 * 60)
            )} minutes ago`
          );
          return {
            success: true,
            data: {
              ...cachedInsights.insights,
              cached: true,
              cacheAge: Math.round(cacheAge / (1000 * 60)), // Age in minutes
            },
          };
        } else {
          // Cache is expired, delete it
          await StockInsightsCache.deleteOne({ _id: cachedInsights._id });
          console.log(`🗑️ Deleted expired cache for ${ticker.toUpperCase()}`);
        }
      }
    } else {
      // Force refresh: delete any existing cache for this ticker
      await StockInsightsCache.deleteMany({ ticker: ticker.toUpperCase() });
      console.log(
        `🔄 Force refresh: Deleted existing cache for ${ticker.toUpperCase()}`
      );
    }

    console.log(`🔄 Fetching fresh AI insights for ${ticker.toUpperCase()}`);

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `
    You are a professional financial analyst with access to current market data. Provide a comprehensive stock analysis for ${ticker.toUpperCase()} with real market data as of ${currentDate}.

    IMPORTANT: You must provide actual, realistic financial data for ${ticker.toUpperCase()}. Use your knowledge of this company's recent performance, current market conditions, and financial metrics.

    For each fundamental analysis metric, provide both the actual value AND a specific explanation of what that exact value means for this company. Don't just define the metric - explain what the specific number indicates about the company's financial health, valuation, and performance.

    Example: Instead of just saying "P/E ratio measures price to earnings", say "P/E of 28.5 means investors are paying $28.50 for every $1 of annual earnings, which is relatively high and suggests strong growth expectations but also indicates the stock may be expensive."

    Return ONLY a valid JSON object with this exact structure (no additional text, no markdown, no explanations):

    {
      "overview": {
        "company_name": "${ticker.toUpperCase()} - [Real Company Name] (Data as of ${currentDate})",
        "sector": "[Real sector name]",
        "industry": "[Real industry name]", 
        "description": "[Real company business description based on current operations]",
        "current_price": "$[Current realistic price based on recent trading]"
      },
      "fundamental_analysis": {
        "market_cap": "[Real market capitalization]",
        "market_cap_explanation": "[Explain what this specific market cap value means - is it large/small cap, how it compares to industry, what this size indicates about the company]",
        "pe_ratio": "[Real P/E ratio based on current metrics]",
        "pe_ratio_explanation": "[Explain what this specific P/E value means - is it high/low/moderate, what this indicates about investor expectations, how it compares to industry average]",
        "pb_ratio": "[Real P/B ratio]",
        "pb_ratio_explanation": "[Explain what this specific P/B value means - is the stock trading above/below book value, what this suggests about valuation]",
        "debt_to_equity": "[Real debt to equity ratio]",
        "debt_to_equity_explanation": "[Explain what this specific D/E ratio means - is the debt level safe/risky, what this indicates about financial health]",
        "current_ratio": "[Real current ratio]",
        "current_ratio_explanation": "[Explain what this specific current ratio means - can the company easily pay short-term debts, is liquidity strong/weak]",
        "roe": "[Real ROE percentage]",
        "roe_explanation": "[Explain what this specific ROE percentage means - is the company efficiently using shareholder money, is this good/average/poor performance]",
        "roa": "[Real ROA percentage]",
        "roa_explanation": "[Explain what this specific ROA percentage means - is the company efficiently using its assets, how this compares to industry standards]"
      },
      "technical_analysis": {
        "support_levels": ["$[Real support level 1]", "$[Real support level 2]"],
        "support_explanation": "[Explain what these support levels mean - these are price points where the stock tends to bounce back up, useful for timing purchases]",
        "resistance_levels": ["$[Real resistance level 1]", "$[Real resistance level 2]"],
        "resistance_explanation": "[Explain what these resistance levels mean - these are price points where the stock tends to face selling pressure, useful for timing sales]",
        "trend": "[Current real market trend: Bullish/Bearish/Neutral]",
        "trend_explanation": "[Explain what this trend means - is the stock generally moving up/down/sideways, what this indicates for investment timing]"
      },
      "investment_analysis": {
        "risk_level": "[Real risk assessment: Low/Medium/High]",
        "risk_explanation": "[Explain what this risk level means - how volatile the stock might be, what kind of investor profile this suits]",
        "investment_horizon": "[Appropriate timeframe based on company profile]",
        "horizon_explanation": "[Explain what this timeframe means - why this duration is recommended, what to expect during this period]",
        "pros": ["[Real advantage 1]", "[Real advantage 2]", "[Real advantage 3]", "[Real advantage 4]", "[Real advantage 5]"],
        "cons": ["[Real disadvantage 1]", "[Real disadvantage 2]", "[Real disadvantage 3]", "[Real disadvantage 4]", "[Real disadvantage 5]"],
        "recommendation": "[Real investment recommendation based on current analysis]",
        "investment_advice": "[Practical investment guidance - position sizing, timing considerations, portfolio allocation, risk management strategies]"
      },
      "financial_health": {
        "revenue_growth": "[Real revenue growth percentage]",
        "revenue_explanation": "[Explain what this growth rate means - is the company growing fast/slow, what this indicates about business health]",
        "profit_margin": "[Real profit margin percentage]",
        "margin_explanation": "[Explain what this profit margin means - how much profit the company keeps from each dollar of sales, is this good/average/poor]",
        "cash_flow": "[Real cash flow status description]",
        "cashflow_explanation": "[Explain what this cash flow means - why cash is important, what positive/negative cash flow indicates]",
        "dividend_yield": "[Real dividend yield if applicable, or 'N/A']",
        "dividend_explanation": "[Explain what dividends mean - regular cash payments to shareholders, whether this stock pays income]"
      },
      "market_position": {
        "competitors": ["[Real competitor 1]", "[Real competitor 2]", "[Real competitor 3]"],
        "market_share": "[Real market share or position]",
        "competitive_advantages": ["[Real advantage 1]", "[Real advantage 2]", "[Real advantage 3]"]
      },
      "future_outlook": {
        "growth_potential": "[Real growth prospects based on company strategy and market]",
        "risks": ["[Real market risk]", "[Real company risk]", "[Real industry risk]", "[Real economic risk]"],
        "opportunities": ["[Real opportunity 1]", "[Real opportunity 2]", "[Real opportunity 3]", "[Real opportunity 4]"],
        "catalyst": "[Real upcoming catalysts and events that could impact stock price]"
      },
      "investment_guide": {
        "ownership_meaning": "[Simple explanation of what owning this stock means - you own a share of this company and participate in its growth and profits]",
        "getting_started": "[Practical guidance for stock investment - research approach, portfolio considerations, diversification principles]",
        "position_sizing": "[Guidance on investment amount - portfolio allocation percentages, risk-based sizing recommendations]",
        "entry_strategy": "[Timing and entry considerations based on current analysis - optimal entry points, market conditions to consider]",
        "exit_strategy": "[Exit planning guidance - profit-taking levels, stop-loss considerations, key signals to monitor]",
        "monitoring_checklist": ["[Key metric 1 to track regularly]", "[Key metric 2 to monitor]", "[Important event to watch]"],
        "risk_management": ["[Risk factor 1 to consider]", "[Risk mitigation strategy 2]", "[Portfolio protection method 3]"],
        "investment_approach": "[Recommended investment strategy for this stock - systematic investment, value accumulation, growth-focused approach, etc.]"
      }
    }

    Provide accurate, current financial analysis. Do not use placeholder or generic data.
    Respond with ONLY the JSON object, no other text.
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${data.error?.message || "Unknown error"}`);
    }

    const text = data.candidates[0].content.parts[0].text;
    console.log("Raw AI response:", text); // Debug log

    // Try to parse the JSON response
    try {
      // Clean up the response more thoroughly
      let jsonText = text.trim();

      // Remove markdown code blocks if present
      if (jsonText.includes("```json")) {
        jsonText = jsonText.replace(/```json\s*/g, "").replace(/\s*```/g, "");
      }

      // Remove any text before the first {
      const firstBrace = jsonText.indexOf("{");
      if (firstBrace > 0) {
        jsonText = jsonText.substring(firstBrace);
      }

      // Remove any text after the last }
      const lastBrace = jsonText.lastIndexOf("}");
      if (lastBrace > 0) {
        jsonText = jsonText.substring(0, lastBrace + 1);
      }

      console.log("Cleaned JSON text:", jsonText); // Debug log

      const insights = JSON.parse(jsonText);

      // Validate that we have the expected structure
      if (!insights.overview || !insights.investment_analysis) {
        console.log("Invalid structure, using fallback");
        throw new Error("Invalid response structure");
      }

      console.log("Successfully parsed AI response"); // Debug log

      // Cache the successful response
      try {
        await StockInsightsCache.create({
          ticker: ticker.toUpperCase(),
          insights: insights,
        });
        console.log(`💾 Cached insights for ${ticker.toUpperCase()}`);
      } catch (cacheError) {
        console.error("Error caching insights:", cacheError.message);
        // Don't fail the request if caching fails
      }

      return {
        success: true,
        data: {
          ...insights,
          cached: false,
          fresh: true,
        },
      };
    } catch (parseError) {
      console.log("JSON parse error:", parseError.message);
      console.log("Raw text that failed to parse:", text);

      return {
        success: false,
        error: `Failed to parse AI response: ${parseError.message}. The AI may have returned invalid JSON format.`,
        rawResponse: text,
      };
    }
  } catch (error) {
    console.error("Error getting stock insights:", error);

    // If API fails, try to return cached data as fallback (even if expired)
    console.log(
      `🔄 API failed, attempting to use cached data as fallback for ${ticker.toUpperCase()}`
    );

    try {
      const fallbackCache = await StockInsightsCache.findOne({
        ticker: ticker.toUpperCase(),
      }).sort({ createdAt: -1 });

      if (fallbackCache) {
        const cacheAge = Date.now() - fallbackCache.createdAt.getTime();
        console.log(
          `✅ Using cached data as fallback for ${ticker.toUpperCase()}, cached ${Math.round(
            cacheAge / (1000 * 60)
          )} minutes ago`
        );

        return {
          success: true,
          data: {
            ...fallbackCache.insights,
            cached: true,
            cacheAge: Math.round(cacheAge / (1000 * 60)),
            fallback: true,
            apiError: "AI service temporarily unavailable, showing cached data",
          },
        };
      }
    } catch (cacheError) {
      console.error("Error accessing cache for fallback:", cacheError);
    }

    return {
      success: false,
      error: `Failed to get stock insights: ${error.message}. Please check your API key and internet connection.`,
    };
  }
};
