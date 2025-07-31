import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../config/axios";
import Header from "../components/Header";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const StockInsights = () => {
  const navigate = useNavigate();
  const { ticker } = useParams();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (ticker) {
      fetchStockInsights();
    }
  }, [ticker]);

  const fetchStockInsights = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const url = forceRefresh
        ? `/stock-insights/${ticker}?refresh=true`
        : `/stock-insights/${ticker}`;

      const response = await axios.get(url);

      if (response.data.success) {
        setInsights(response.data.data);
      } else {
        setError(
          response.data.error ||
            "Failed to fetch AI-generated stock insights. Please try again."
        );
      }
    } catch (error) {
      console.error("Error fetching stock insights:", error);
      if (error.response?.status === 401) {
        setError("Please log in to view stock insights");
        setTimeout(() => navigate("/login"), 2000);
      } else if (error.response?.data?.error) {
        setError(`AI Analysis Error: ${error.response.data.error}`);
      } else {
        setError(
          "Failed to connect to AI service. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStockInsights(true);
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "low":
        return "badge-success";
      case "medium":
        return "badge-warning";
      case "high":
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation?.toLowerCase()) {
      case "buy":
        return "badge-success";
      case "hold":
        return "badge-warning";
      case "sell":
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case "bullish":
        return <ArrowTrendingUpIcon className="w-4 h-4 text-success" />;
      case "bearish":
        return <ArrowTrendingDownIcon className="w-4 h-4 text-error" />;
      default:
        return <ChartBarIcon className="w-4 h-4 text-base-content/50" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-base-content/70">
              Fetching stock insights for {ticker?.toUpperCase()}...
            </p>
            <p className="text-xs text-base-content/50 mt-2">
              This may take a moment if generating fresh AI analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-base-content mb-2">Error</h2>
            <p className="text-base-content/70 mb-4">{error}</p>
            <button onClick={() => navigate("/")} className="btn btn-primary">
              Back to Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-base-200">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <InformationCircleIcon className="w-16 h-16 text-base-content/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-base-content mb-2">
              No Data
            </h2>
            <p className="text-base-content/70">
              No insights available for this stock.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Header />

      <div className="bg-base-200 text-base-content min-h-screen w-full p-2 xs:p-3 sm:p-6 rounded-lg font-sans">
        <div className="flex flex-col justify-center items-center mt-16 xs:mt-16 sm:mt-20">
          <div className="flex flex-col w-full max-w-6xl gap-4">
            {/* Header */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-base-content">
                      {insights.overview?.company_name || ticker} (
                      {ticker?.toUpperCase()})
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-base-content/70 text-sm">
                        {insights.overview?.sector} •{" "}
                        {insights.overview?.industry}
                      </p>
                      {/* Cache Status */}
                      {insights.cached && !insights.fallback && (
                        <div className="flex items-center gap-1 text-xs text-base-content/60">
                          <ClockIcon className="w-3 h-3" />
                          <span>Cached {insights.cacheAge} min ago</span>
                        </div>
                      )}
                      {insights.cached && insights.fallback && (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          <span>Cached data (API unavailable)</span>
                        </div>
                      )}
                      {insights.fresh && (
                        <div className="flex items-center gap-1 text-xs text-success">
                          <CheckCircleIcon className="w-3 h-3" />
                          <span>Fresh AI analysis</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRefresh}
                      className="btn btn-outline btn-sm flex items-center gap-1"
                      disabled={loading}
                      title="Get fresh AI analysis"
                    >
                      <ArrowPathIcon
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="btn btn-ghost btn-sm"
                    >
                      Back to Portfolio
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fallback Data Warning */}
            {insights.fallback && insights.apiError && (
              <div className="alert alert-warning">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Using Cached Data</div>
                  <div className="text-sm">
                    {insights.apiError}. Data shown is from previous successful
                    analysis.
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="btn btn-warning btn-sm"
                  disabled={loading}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Overview */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title text-lg font-bold mb-3 flex items-center">
                  <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                  Company Overview
                </h2>
                <p className="text-base-content/80 text-sm leading-relaxed">
                  {insights.overview?.description ||
                    "No description available."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fundamental Analysis */}
              <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body p-4 sm:p-6">
                  <h2 className="card-title text-lg font-bold mb-3 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Fundamental Analysis
                  </h2>
                  <div className="space-y-4">
                    {insights.fundamental_analysis &&
                      Object.entries(insights.fundamental_analysis)
                        .filter(([key]) => !key.includes("_explanation"))
                        .map(([key, value]) => {
                          const explanationKey = `${key}_explanation`;
                          const explanation =
                            insights.fundamental_analysis[explanationKey];

                          return (
                            <div
                              key={key}
                              className="p-3 bg-base-200 rounded-lg border border-base-300"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-base-content font-semibold capitalize text-sm">
                                  {key.replace(/_/g, " ")}:
                                </span>
                                <span className="font-bold text-primary text-sm">
                                  {value || "N/A"}
                                </span>
                              </div>
                              {explanation && (
                                <div className="text-xs text-base-content/70 leading-relaxed">
                                  <InformationCircleIcon className="w-3 h-3 inline mr-1" />
                                  {explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                  </div>
                </div>
              </div>

              {/* Technical Analysis */}
              <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body p-4 sm:p-6">
                  <h2 className="card-title text-lg font-bold mb-3 flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Technical Analysis
                  </h2>
                  <div className="space-y-4">
                    {insights.technical_analysis && (
                      <>
                        {/* Support Levels */}
                        <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-base-content font-semibold text-sm">
                              Support Levels:
                            </span>
                            <span className="font-bold text-success text-sm">
                              {Array.isArray(
                                insights.technical_analysis.support_levels
                              )
                                ? insights.technical_analysis.support_levels.join(
                                    ", "
                                  )
                                : insights.technical_analysis.support_levels ||
                                  "N/A"}
                            </span>
                          </div>
                          {insights.technical_analysis.support_explanation && (
                            <div className="text-xs text-base-content/70 leading-relaxed">
                              <InformationCircleIcon className="w-3 h-3 inline mr-1" />
                              {insights.technical_analysis.support_explanation}
                            </div>
                          )}
                        </div>

                        {/* Resistance Levels */}
                        <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-base-content font-semibold text-sm">
                              Resistance Levels:
                            </span>
                            <span className="font-bold text-error text-sm">
                              {Array.isArray(
                                insights.technical_analysis.resistance_levels
                              )
                                ? insights.technical_analysis.resistance_levels.join(
                                    ", "
                                  )
                                : insights.technical_analysis
                                    .resistance_levels || "N/A"}
                            </span>
                          </div>
                          {insights.technical_analysis
                            .resistance_explanation && (
                            <div className="text-xs text-base-content/70 leading-relaxed">
                              <InformationCircleIcon className="w-3 h-3 inline mr-1" />
                              {
                                insights.technical_analysis
                                  .resistance_explanation
                              }
                            </div>
                          )}
                        </div>

                        {/* Trend */}
                        <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-base-content font-semibold text-sm">
                              Current Trend:
                            </span>
                            <div className="flex items-center">
                              {getTrendIcon(insights.technical_analysis.trend)}
                              <span className="font-bold text-primary text-sm ml-1">
                                {insights.technical_analysis.trend || "N/A"}
                              </span>
                            </div>
                          </div>
                          {insights.technical_analysis.trend_explanation && (
                            <div className="text-xs text-base-content/70 leading-relaxed">
                              <InformationCircleIcon className="w-3 h-3 inline mr-1" />
                              {insights.technical_analysis.trend_explanation}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Analysis */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title text-lg font-bold mb-4 flex items-center">
                  <LightBulbIcon className="w-5 h-5 mr-2" />
                  Investment Analysis
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                    <div className="text-center mb-2">
                      <span
                        className={`badge badge-md ${getRiskColor(
                          insights.investment_analysis?.risk_level
                        )}`}
                      >
                        Risk:{" "}
                        {insights.investment_analysis?.risk_level || "N/A"}
                      </span>
                    </div>
                    {insights.investment_analysis?.risk_explanation && (
                      <div className="text-xs text-base-content/70 leading-relaxed text-center">
                        <InformationCircleIcon className="w-3 h-3 inline mr-1" />
                        {insights.investment_analysis.risk_explanation}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                    <div className="text-center mb-2">
                      <span className="badge badge-md badge-primary">
                        {insights.investment_analysis?.investment_horizon ||
                          "N/A"}
                      </span>
                    </div>
                    {insights.investment_analysis?.horizon_explanation && (
                      <div className="text-xs text-base-content/70 leading-relaxed text-center">
                        <InformationCircleIcon className="w-3 h-3 inline mr-1" />
                        {insights.investment_analysis.horizon_explanation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Investment Guidance */}
                {insights.investment_analysis?.investment_advice && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                    <h3 className="text-sm font-bold text-primary mb-2 flex items-center">
                      🎯 Investment Guidance
                    </h3>
                    <p className="text-base-content/80 text-xs leading-relaxed">
                      {insights.investment_analysis.investment_advice}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pros */}
                  <div>
                    <h3 className="text-sm font-bold text-success mb-3 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Advantages
                    </h3>
                    <ul className="space-y-2">
                      {insights.investment_analysis?.pros?.map((pro, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="w-3 h-3 text-success mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-base-content/80 text-xs leading-relaxed">
                            {pro}
                          </span>
                        </li>
                      )) || (
                        <li className="text-base-content/50 text-xs">
                          No advantages listed
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <h3 className="text-sm font-bold text-error mb-3 flex items-center">
                      <XCircleIcon className="w-4 h-4 mr-2" />
                      Disadvantages
                    </h3>
                    <ul className="space-y-2">
                      {insights.investment_analysis?.cons?.map((con, index) => (
                        <li key={index} className="flex items-start">
                          <XCircleIcon className="w-3 h-3 text-error mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-base-content/80 text-xs leading-relaxed">
                            {con}
                          </span>
                        </li>
                      )) || (
                        <li className="text-base-content/50 text-xs">
                          No disadvantages listed
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {insights.investment_analysis?.recommendation && (
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                    <h4 className="font-bold text-primary mb-2 text-sm">
                      Recommendation Reasoning:
                    </h4>
                    <p className="text-base-content/80 text-xs leading-relaxed">
                      {insights.investment_analysis.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Health */}
              <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body p-4 sm:p-6">
                  <h2 className="card-title text-lg font-bold mb-3 flex items-center">
                    <ShieldCheckIcon className="w-5 h-5 mr-2" />
                    Financial Health
                  </h2>
                  <div className="space-y-3">
                    {insights.financial_health &&
                      Object.entries(insights.financial_health).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center py-2 border-b border-base-300 last:border-b-0"
                          >
                            <span className="text-base-content/70 capitalize text-sm font-medium">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="font-semibold text-base-content text-sm">
                              {value || "N/A"}
                            </span>
                          </div>
                        )
                      )}
                  </div>
                </div>
              </div>

              {/* Market Position */}
              <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body p-4 sm:p-6">
                  <h2 className="card-title text-lg font-bold mb-3 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Market Position
                  </h2>
                  <div className="space-y-3">
                    {insights.market_position &&
                      Object.entries(insights.market_position).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center py-2 border-b border-base-300 last:border-b-0"
                          >
                            <span className="text-base-content/70 capitalize text-sm font-medium">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="font-semibold text-base-content text-sm">
                              {Array.isArray(value)
                                ? value.join(", ")
                                : value || "N/A"}
                            </span>
                          </div>
                        )
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Future Outlook */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title text-lg font-bold mb-4 flex items-center">
                  <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
                  Future Outlook
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                    <h3 className="text-base font-bold text-base-content mb-2">
                      Growth Potential
                    </h3>
                    <p className="text-base-content/80 text-sm">
                      {insights.future_outlook?.growth_potential || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-info/10 rounded-lg border-l-4 border-info">
                    <h3 className="text-base font-bold text-base-content mb-2">
                      Key Catalysts
                    </h3>
                    <p className="text-base-content/80 text-sm">
                      {insights.future_outlook?.catalyst || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risks */}
                  <div>
                    <h3 className="text-base font-bold text-error mb-3 flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                      Risks
                    </h3>
                    <ul className="space-y-2">
                      {insights.future_outlook?.risks?.map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <ExclamationTriangleIcon className="w-4 h-4 text-error mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-base-content/80 text-sm">
                            {risk}
                          </span>
                        </li>
                      )) || (
                        <li className="text-base-content/50 text-sm">
                          No risks identified
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div>
                    <h3 className="text-base font-bold text-success mb-3 flex items-center">
                      <LightBulbIcon className="w-5 h-5 mr-2" />
                      Opportunities
                    </h3>
                    <ul className="space-y-2">
                      {insights.future_outlook?.opportunities?.map(
                        (opportunity, index) => (
                          <li key={index} className="flex items-start">
                            <LightBulbIcon className="w-4 h-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-base-content/80 text-sm">
                              {opportunity}
                            </span>
                          </li>
                        )
                      ) || (
                        <li className="text-base-content/50 text-sm">
                          No opportunities identified
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Guide */}
            {insights.investment_guide && (
              <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl border border-primary/20">
                <div className="card-body p-4 sm:p-6">
                  <h2 className="card-title text-lg font-bold mb-4 flex items-center text-primary">
                    <ShieldCheckIcon className="w-5 h-5 mr-2" />� Investment
                    Guide
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* What This Means */}
                    <div className="p-4 bg-base-100 rounded-lg border border-base-300">
                      <h3 className="text-base font-bold mb-2 flex items-center">
                        💡 What This Investment Means
                      </h3>
                      <p className="text-base-content/80 text-sm">
                        {insights.investment_guide?.ownership_meaning}
                      </p>
                    </div>

                    {/* How to Start */}
                    <div className="p-4 bg-base-100 rounded-lg border border-base-300">
                      <h3 className="text-base font-bold mb-2 flex items-center">
                        🚀 How to Get Started
                      </h3>
                      <p className="text-base-content/80 text-sm">
                        {insights.investment_guide?.getting_started}
                      </p>
                    </div>

                    {/* Investment Amount */}
                    <div className="p-4 bg-base-100 rounded-lg border border-base-300">
                      <h3 className="text-base font-bold mb-2 flex items-center">
                        💰 Position Sizing
                      </h3>
                      <p className="text-base-content/80 text-sm">
                        {insights.investment_guide?.position_sizing}
                      </p>
                    </div>

                    {/* When to Buy */}
                    <div className="p-4 bg-base-100 rounded-lg border border-base-300">
                      <h3 className="text-base font-bold mb-2 flex items-center">
                        ⏰ Entry Strategy
                      </h3>
                      <p className="text-base-content/80 text-sm">
                        {insights.investment_guide?.entry_strategy}
                      </p>
                    </div>

                    {/* When to Sell */}
                    <div className="p-4 bg-base-100 rounded-lg border border-base-300">
                      <h3 className="text-base font-bold mb-2 flex items-center">
                        📈 Exit Strategy
                      </h3>
                      <p className="text-base-content/80 text-sm">
                        {insights.investment_guide?.exit_strategy}
                      </p>
                    </div>

                    {/* Simple Strategy */}
                    <div className="p-4 bg-base-100 rounded-lg border border-base-300">
                      <h3 className="text-base font-bold mb-2 flex items-center">
                        📊 Recommended Strategy
                      </h3>
                      <p className="text-base-content/80 text-sm">
                        {insights.investment_guide?.investment_approach}
                      </p>
                    </div>
                  </div>

                  {/* Key Things to Watch */}
                  <div className="mt-6 p-4 bg-base-100 rounded-lg border border-base-300">
                    <h3 className="text-base font-bold mb-3 flex items-center">
                      👀 Key Monitoring Points
                    </h3>
                    <ul className="space-y-2">
                      {insights.investment_guide?.monitoring_checklist?.map(
                        (item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircleIcon className="w-4 h-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-base-content/80 text-sm">
                              {item}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Common Mistakes */}
                  <div className="mt-4 p-4 bg-base-100 rounded-lg border border-base-300">
                    <h3 className="text-base font-bold mb-3 flex items-center">
                      ⚖️ Risk Management
                    </h3>
                    <ul className="space-y-2">
                      {insights.investment_guide?.risk_management?.map(
                        (risk, index) => (
                          <li key={index} className="flex items-start">
                            <XCircleIcon className="w-4 h-4 text-error mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-base-content/80 text-sm">
                              {risk}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Cache Info Footer */}
            <div className="mt-6 p-4 bg-base-300/50 rounded-lg border border-base-300">
              <div className="flex items-center justify-between text-xs text-base-content/60">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <InformationCircleIcon className="w-3 h-3" />
                    <span>AI-powered analysis</span>
                  </div>
                  {insights.cached && (
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      <span>Cached data • Updates daily</span>
                    </div>
                  )}
                  {insights.fresh && (
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3" />
                      <span>Latest analysis • Valid for 24 hours</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div>
                    Analysis generated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockInsights;
