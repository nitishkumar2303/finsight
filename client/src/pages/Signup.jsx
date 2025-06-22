import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import dashSS from "../assets/dashSS.png"; // Assuming you have a dashboard preview image
import axios from "../config/axios";

const Signup = () => {
  const API = import.meta.env.VITE_API_URL; // Ensure this is set in your .env file
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

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
      const response = await axios.post(`${API}/users/register`, formData);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/"); // Redirect to home or dashboard after successful signup
      alert("Signup successful! Redirecting to home...");
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred during signup. Please try again.");
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
              Create your account
            </p>
            <form className="space-y-4">
              <input
                onChange={handleChange}
                value={formData.name}
                type="text"
                name="name"
                placeholder="Name"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded font-light text-sm placeholder-gray-400"
              />
              <input
                onChange={handleChange}
                value={formData.email}
                type="email"
                name="email"
                placeholder="Email"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded font-light text-sm placeholder-gray-400"
              />
              <input
                onChange={handleChange}
                value={formData.password}
                type="password"
                name="password"
                placeholder="Password"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded font-light text-sm placeholder-gray-400"
              />
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-light tracking-wide text-base"
              >
                Sign Up
              </button>
            </form>
            <div className="mt-4 text-sm font-light text-gray-400">
              or sign up with
              <div className="flex justify-center space-x-4 mt-2">
                <button className="p-2 bg-gray-800 rounded">
                  <img src="google-icon.png" alt="Google" className="h-6" />
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm font-light text-gray-400">
              Already have an account?{" "}
              <a href="#" className="text-blue-400 underline font-normal">
                Log In
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

export default Signup;
