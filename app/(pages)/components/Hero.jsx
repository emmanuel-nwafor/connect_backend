"use client"

import React from 'react';
import Header from './Header';

export default function Hero() {
  return (
    <>
      <Header />
      <section className="bgflex items-center px-4 overflow-hidden rounded-3xl mx-4 -mt-16 font-poppins">
        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 max-w-7xl relative z-10 px-4">
          <div className="flex-1 text-white text-left max-w-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-yellow-300">★★★★★</div>
              <div className="flex -space-x-2 ml-3">
                <img className="w-7 h-7 rounded-full object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="Customer 1" />
                <img className="w-7 h-7 rounded-full object-cover" src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" alt="Customer 2" />
                <img className="w-7 h-7 rounded-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" alt="Customer 3" />
              </div>
              <span className="text-sm ml-2">Trusted by 5K customers</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Dream<br />Property is Just a<br />Click Away
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Whether you're buying or selling, we've got you covered. Help find the perfect place to call home.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition">
              Explore Properties →
            </button>
          </div>
        </div>
      </section>
    </>
  );
}