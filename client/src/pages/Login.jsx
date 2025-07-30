import React from "react";
import dashSS from "../assets/dashSS.png"; // Assuming you have a dashboard preview image
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { useState, useEffect } from "react";

const LoginPage = () => {
  const API = import.meta.env.VITE_API_URL; // Ensure this is set in your .env file
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    // Check if user is already logged in ,If a token exists in localStorage or sessionStorage, redirect to home
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/users/login`, formData);
      console.log(response);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/"); // Redirect to home or dashboard after successful signup
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during Login. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-base-200">
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-base-100">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-thin text-white lowercase mb-2"
              style={{ letterSpacing: "0.3em" }}
            >
              finsight
            </h1>
           
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300 p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  value={formData.email}
                  name="email"
                  className="input input-bordered w-full focus:input-primary"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  value={formData.password}
                  name="password"
                  className="input input-bordered w-full focus:input-primary"
                  required
                />
                <label className="label">
                  <a
                    href="#"
                    className="label-text-alt link link-hover link-primary"
                  >
                    Forgot password?
                  </a>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full font-medium"
              >
                Login
              </button>
            </form>

            <div className="divider text-base-content/50">or</div>

            <button className="btn btn-outline w-full gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-base-content/70">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="link link-primary font-medium"
              >
                Sign Up
              </button>
            </p>
            <p className="mt-4 text-xs text-base-content/50">
              By logging in, you agree to our{" "}
              <a href="#" className="link link-primary">
                Terms of Use
              </a>{" "}
              and{" "}
              <a href="#" className="link link-primary">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Dashboard Preview */}
      <div className="hidden lg:flex w-3/5 bg-[#06050B] items-center justify-center p-12">
        <div className="relative">
          <div className="relative p-4 bg-[#06050B] shadow-[0_0_15px_rgba(255,255,255,0.3),_-60px_-40px_100px_rgba(30,64,175,0.5),_30px_-10px_60px_rgba(30,64,175,0.3)] rounded-lg">
            <img
              src={dashSS}
              alt="Dashboard Preview"
              className="w-[28rem] h-auto rounded-lg shadow-lg relative z-10"
            />
          </div>

          <div className="absolute bottom-4 right-4">
            <button className="bg-gray-800 p-2 rounded-full">
              <span className="text-white">ⓘ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
