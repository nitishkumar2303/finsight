import React from "react";
import dashSS from "../assets/dashSS.png"; // Assuming you have a dashboard preview image
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { useState , useEffect } from "react";

const LoginPage = () => {
  const API = import.meta.env.VITE_API_URL; // Ensure this is set in your .env file
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  
  
  useEffect(() => {   // Check if user is already logged in ,If a token exists in localStorage or sessionStorage, redirect to home
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
    <div className="flex h-screen text-white">
      {/* Left Section - Login Form */}
      <div className="w-2/5 flex items-center bg-black justify-center p-12">
        <div className="text-center w-full">
          <h1
            className="text-3xl font-extralight tracking-wide mt-10 mb-30 lowercase"
            style={{ letterSpacing: "0.25em" }}
          >
            finsight
          </h1>
          <div className="mt-8">
            <p className="text-gray-300 font-light mb-10 text-lg">
              Welcome Back
            </p>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                onChange={handleChange}
                value={formData.email}
                name="email"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded font-light text-sm placeholder-gray-400"
              />
              <input
                type="password"
                placeholder="Password"
                onChange={handleChange}
                value={formData.password}
                name="password"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded font-light text-sm placeholder-gray-400"
              />
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-light tracking-wide text-base"
              >
                Login
              </button>
            </form>
            <div className="mt-4 text-sm font-light text-gray-400">
              or Log in with
              <div className="flex justify-center space-x-4 mt-2">
                <button className="p-2 bg-gray-800 rounded">
                  <img src="google-icon.png" alt="Google" className="h-6" />
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm font-light text-gray-400">
              Don't have an account?{" "}
              <a href="#" className="text-blue-400 underline font-normal">
                Sign Up
              </a>
            </p>
            <p className="mt-2 text-xs text-gray-500 font-extralight">
              By confirming the registration, you agree to our Terms of Use and
              the Privacy Policy.
            </p>
          </div>
        </div>
      </div>
      {/* Right Section - Dashboard Preview */}
      <div className="w-3/5 bg-[#06050B] flex items-center justify-center p-12">
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
