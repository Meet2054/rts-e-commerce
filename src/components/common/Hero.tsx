"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const slides = [
  { id: 1, image: "/hero1.png" },
  { id: 2, image: "/hero2.png" },
  { id: 3, image: "/hero3.png" },
  { id: 4, image: "/hero4.png" },
];

const slidesWithClone = [...slides, slides[0]]; // Add first slide at end

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [transition, setTransition] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 2000);
    return () => clearInterval(interval);
  }, [current]);

  const nextSlide = () => {
    if (current < slides.length) {
      setCurrent(current + 1);
      setTransition(true);
    }
  };

  const prevSlide = () => {
    if (current === 0) {
      setTransition(false);
      setCurrent(slides.length - 1);
      setTimeout(() => setTransition(true), 0); // re-enable transition
    } else {
      setCurrent(current - 1);
      setTransition(true);
    }
  };

  // When transition ends, if at clone, reset to real first slide instantly
  useEffect(() => {
    if (current === slides.length) {
      timeoutRef.current = setTimeout(() => {
        setTransition(false);
        setCurrent(0);
      }, 700); // match transition duration
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current]);

  const handleDotClick = (idx: number) => {
    setCurrent(idx);
    setTransition(true);
  };

  return (
    <div className="w-full pt-10 xl:pt-0 flex justify-center ">
      <div className="relative max-w-[1550px] mx-auto w-full h-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 flex items-center justify-center overflow-hidden">

        {/* Sliding Images */}
        <div className="w-full flex justify-center items-center overflow-hidden relative">
          <div
            className={`flex ${
              transition ? "transition-transform duration-700 ease-in-out" : ""
            } w-full`}
            // style={{
            //   transform: `translateX(-${current * 100}%)`,
            //   height: "100%",
            // }}
            onTransitionEnd={() => {
              if (current === slides.length) {
                setTransition(false);
                setCurrent(0);
              }
            }}
          >
            {slidesWithClone.map((slide) => (
              <div
                key={slide.id + Math.random()}
                className="min-w-full flex justify-center items-center"
                // style={{ height: "100%" }}
              >
                <Image
                  src={slide.image}
                  alt="Printer"
                  width={1550}
                  height={600}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Left Button */}
        <button
          onClick={prevSlide}
          className="absolute hidden md:block left-1 top-1/2 -translate-y-1/2 bg-white shadow-md px-4 py-12 cursor-pointer rounded-md hover:bg-[#F7941F] z-30"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Right Button */}
        <button
          onClick={nextSlide}
          className="absolute hidden md:block right-1 top-1/2 -translate-y-1/2 bg-white shadow-md px-4 py-12 cursor-pointer rounded-md hover:bg-[#F7941F] z-30"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>

        {/* Bottom Dots */}
        <div className="absolute bottom-6 flex gap-3 justify-center w-full">
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-1.5 w-8 rounded-sm cursor-pointer transition-all ${
                current % slides.length === index
                  ? "bg-orange-500"
                  : "bg-orange-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

