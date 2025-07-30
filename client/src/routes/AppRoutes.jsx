import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Portfolio from "../pages/Portfolio";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import News from "../pages/News.jsx";
import StockInsights from "../pages/StockInsights.jsx";
// import Login from "../pages/Login";
// import Signup from "../pages/Signup";
// import Dashboard from "../pages/Dashboard";

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/news" element={<News />} />
          <Route path="/stock-insights/:ticker" element={<StockInsights />} />

          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/signup" element={<Signup />} /> */}
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
