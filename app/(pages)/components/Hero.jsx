"use client";

import React from "react";
import Header from "./Header";

export default function Hero() {
  return (
    <>
      <section
        className="relative bg-cover bg-center bg-no-repeat flex items-center p-0 justify-center text-center  h-[100vh] overflow-hidden  mx-4 -mt-16 font-poppins"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80')",
        }}
      >
        {/* Overlay for dark effect */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-3xl"></div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto text-white">
                <Header />

          <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
            Discover Your Perfect Home
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-200">
            Find, connect, and own properties with ease on <span className="font-bold text-blue-400">Connect</span>.
          </p>
          <a
            href="https://connect-realestate.com" // Change this to your desired link
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 bg-blue-500 hover:bg-blue-600 transition duration-300 text-white px-8 py-3 rounded-full font-medium"
          >
            Explore Properties
          </a>
        </div>
      </section>
    </>
  );
}
