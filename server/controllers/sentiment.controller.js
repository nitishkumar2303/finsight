import sentimentService from "../services/sentiment.service.js";

class SentimentController {
  // Analyze sentiment for all news articles
  async analyzeNewsSentiment(req, res) {
    try {
      const { articles } = req.body;

      if (!articles || !Array.isArray(articles)) {
        return res.status(400).json({
          success: false,
          message: "Articles array is required",
        });
      }

      const sentimentAnalysis = sentimentService.analyzeNewsSentiment(articles);

      res.status(200).json({
        success: true,
        data: sentimentAnalysis,
      });
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to analyze sentiment",
        error: error.message,
      });
    }
  }

  // Analyze sentiment for a specific ticker
  async analyzeTickerSentiment(req, res) {
    try {
      const { articles, ticker } = req.body;

      if (!articles || !Array.isArray(articles)) {
        return res.status(400).json({
          success: false,
          message: "Articles array is required",
        });
      }

      if (!ticker) {
        return res.status(400).json({
          success: false,
          message: "Ticker symbol is required",
        });
      }

      const sentimentAnalysis = sentimentService.getTickerSentiment(
        articles,
        ticker
      );

      res.status(200).json({
        success: true,
        data: sentimentAnalysis,
      });
    } catch (error) {
      console.error("Ticker sentiment analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to analyze ticker sentiment",
        error: error.message,
      });
    }
  }

  // Analyze sentiment for a single article
  async analyzeArticleSentiment(req, res) {
    try {
      const { article } = req.body;

      if (!article) {
        return res.status(400).json({
          success: false,
          message: "Article object is required",
        });
      }

      const sentimentAnalysis =
        sentimentService.analyzeArticleSentiment(article);

      res.status(200).json({
        success: true,
        data: sentimentAnalysis,
      });
    } catch (error) {
      console.error("Article sentiment analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to analyze article sentiment",
        error: error.message,
      });
    }
  }
}

export default new SentimentController();
