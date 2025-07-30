import natural from "natural";
import nlp from "compromise";

// Initialize sentiment analyzer
const analyzer = new natural.SentimentAnalyzer(
  "English",
  natural.PorterStemmer,
  "afinn"
);

// Financial keywords that might affect sentiment
const financialKeywords = {
  positive: [
    "bullish",
    "surge",
    "rally",
    "gain",
    "profit",
    "growth",
    "positive",
    "strong",
    "up",
    "rise",
    "beat",
    "exceed",
    "outperform",
    "upgrade",
    "buy",
    "hold",
    "recommend",
    "target",
    "potential",
    "recovery",
    "bounce",
    "rebound",
    "breakthrough",
    "innovation",
    "success",
    "win",
    "earnings",
    "revenue",
    "sales",
    "demand",
    "expansion",
    "acquisition",
    "merger",
    "partnership",
  ],
  negative: [
    "bearish",
    "decline",
    "fall",
    "drop",
    "loss",
    "negative",
    "weak",
    "down",
    "crash",
    "plunge",
    "miss",
    "disappoint",
    "underperform",
    "downgrade",
    "sell",
    "avoid",
    "risk",
    "concern",
    "worry",
    "volatility",
    "uncertainty",
    "recession",
    "crisis",
    "bankruptcy",
    "default",
    "debt",
    "cut",
    "layoff",
    "restructure",
    "decline",
    "slowdown",
    "contraction",
    "loss",
    "deficit",
  ],
};

// Market-specific sentiment indicators
const marketIndicators = {
  positive: [
    "bull market",
    "bullish trend",
    "market rally",
    "investor confidence",
    "positive outlook",
  ],
  negative: [
    "bear market",
    "bearish trend",
    "market correction",
    "investor fear",
    "negative outlook",
  ],
};

class SentimentService {
  // Analyze sentiment of a single article
  analyzeArticleSentiment(article) {
    const text = `${article.headline || ""} ${
      article.summary || ""
    }`.toLowerCase();

    // Basic sentiment score using natural
    const words = text.split(/\s+/);
    const sentimentScore = analyzer.getSentiment(words);

    // Financial keyword analysis
    const financialScore = this.analyzeFinancialKeywords(text);

    // Market indicator analysis
    const marketScore = this.analyzeMarketIndicators(text);

    // Combine scores with weights
    const combinedScore =
      sentimentScore * 0.4 + financialScore * 0.4 + marketScore * 0.2;

    // Determine sentiment category
    let sentiment = "neutral";
    let confidence = Math.abs(combinedScore);

    if (combinedScore > 0.3) {
      sentiment = "positive";
    } else if (combinedScore < -0.3) {
      sentiment = "negative";
    }

    // Normalize confidence to 0-100
    confidence = Math.min(confidence * 100, 100);

    return {
      sentiment,
      score: combinedScore,
      confidence: Math.round(confidence),
      breakdown: {
        general: sentimentScore,
        financial: financialScore,
        market: marketScore,
      },
    };
  }

  // Analyze financial keywords
  analyzeFinancialKeywords(text) {
    let positiveCount = 0;
    let negativeCount = 0;

    financialKeywords.positive.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = text.match(regex);
      if (matches) {
        positiveCount += matches.length;
      }
    });

    financialKeywords.negative.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = text.match(regex);
      if (matches) {
        negativeCount += matches.length;
      }
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / total;
  }

  // Analyze market indicators
  analyzeMarketIndicators(text) {
    let positiveCount = 0;
    let negativeCount = 0;

    marketIndicators.positive.forEach((indicator) => {
      const regex = new RegExp(indicator, "gi");
      const matches = text.match(regex);
      if (matches) {
        positiveCount += matches.length;
      }
    });

    marketIndicators.negative.forEach((indicator) => {
      const regex = new RegExp(indicator, "gi");
      const matches = text.match(regex);
      if (matches) {
        negativeCount += matches.length;
      }
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / total;
  }

  // Analyze sentiment for multiple articles
  analyzeNewsSentiment(articles) {
    if (!articles || articles.length === 0) {
      return {
        overallSentiment: "neutral",
        overallScore: 0,
        confidence: 0,
        breakdown: {
          positive: 0,
          negative: 0,
          neutral: 0,
        },
        topArticles: [],
      };
    }

    const sentimentResults = articles.map((article) => ({
      ...article,
      sentiment: this.analyzeArticleSentiment(article),
    }));

    // Calculate overall sentiment
    const totalScore = sentimentResults.reduce(
      (sum, article) => sum + article.sentiment.score,
      0
    );
    const averageScore = totalScore / sentimentResults.length;

    // Count sentiment categories
    const breakdown = sentimentResults.reduce(
      (acc, article) => {
        acc[article.sentiment.sentiment]++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    // Determine overall sentiment
    let overallSentiment = "neutral";
    if (averageScore > 0.2) {
      overallSentiment = "positive";
    } else if (averageScore < -0.2) {
      overallSentiment = "negative";
    }

    // Calculate confidence based on consistency
    const maxCategory = Math.max(
      breakdown.positive,
      breakdown.negative,
      breakdown.neutral
    );
    const confidence = Math.round(
      (maxCategory / sentimentResults.length) * 100
    );

    // Get top articles by confidence
    const topArticles = sentimentResults
      .sort((a, b) => b.sentiment.confidence - a.sentiment.confidence)
      .slice(0, 5);

    return {
      overallSentiment,
      overallScore: averageScore,
      confidence,
      breakdown,
      topArticles,
      totalArticles: articles.length,
    };
  }

  // Get sentiment summary for a specific ticker
  getTickerSentiment(articles, ticker) {
    const tickerArticles = articles.filter(
      (article) =>
        article.ticker && article.ticker.toLowerCase() === ticker.toLowerCase()
    );

    return this.analyzeNewsSentiment(tickerArticles);
  }
}

export default new SentimentService();
