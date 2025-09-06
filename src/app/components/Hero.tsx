"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const slides = [
  { id: 1, image: "/printer.png" }, // replace with your images
  { id: 2, image: "/printer.png" },
  { id: 3, image: "/printer.png" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="w-full flex justify-center">
      <div className="relative max-w-[1550px] w-full h-full px-4 sm:px-16 flex items-center justify-center overflow-hidden">
        {/* Content Left */}
        <div className="absolute left-32 top-1/2 -translate-y-1/2 max-w-md space-y-3 z-20">
          <h1 className="text-4xl font-extrabold leading-snug">
            High-Quality Printing, <br /> Every Page, Every Time.
          </h1>
          <p className="text-sm font-medium max-w-sm">
            Print More, Save More – Reliable Printers at the Best Prices.
          </p>
          <button className="px-6 py-4 bg-orange-400 hover:bg-orange-600 text-white text-base font-semibold rounded-xs shadow-lg">
            Smart Printing Starts Here.
          </button>
        </div>

        {/* Image Right */}
        <div className="w-full flex justify-center items-center">
          <Image
            src={slides[current].image}
            alt="Printer"
            width={1550}
            height={400}
            className="object-contain transition-all duration-500"
          />
        </div>

        {/* Left Button */}
        <button
          onClick={prevSlide}
          className="absolute left-1 top-1/2 -translate-y-1/2 bg-white shadow-md px-4 py-12 rounded-md hover:bg-gray-100 z-30"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Right Button */}
        <button
          onClick={nextSlide}
          className="absolute right-1 top-1/2 -translate-y-1/2 bg-white shadow-md px-4 py-12 rounded-md hover:bg-gray-100 z-30"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>

        {/* Bottom Dots */}
        <div className="absolute bottom-6 flex gap-3 justify-center w-full">
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-1.5 w-8 rounded-sm cursor-pointer transition-all ${
                current === index ? "bg-orange-500" : "bg-orange-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
