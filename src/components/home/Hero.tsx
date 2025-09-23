"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  { id: 1, image: "/hero1.png" },
  { id: 2, image: "/hero2.png" },
  { id: 3, image: "/hero3.png" },
  { id: 4, image: "/hero4.png" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <div className="w-full pt-10 xl:pt-0 flex justify-center">
      <div className="relative max-w-[1550px] mx-auto w-full h-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 flex items-center justify-center overflow-hidden">
        {/* Stack Card Images */}
        <div className="w-full h-[600px] relative flex items-center justify-center">
          {slides.map((slide, idx) => {
            // Calculate stack position
            const isActive = idx === current;
            const isPrev = idx === (current - 1 + slides.length) % slides.length;
            return (
              <AnimatePresence key={slide.id}>
                {isActive && (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -60 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="absolute left-0 top-0 w-full h-full flex justify-center items-center"
                    style={{ zIndex: 10 }}
                  >
                    <Image
                      src={slide.image}
                      alt="Printer"
                      width={1250}
                      height={600}
                      className="object-contain rounded-xl shadow-xl"
                    />
                  </motion.div>
                )}
                {/* Show previous image underneath for stack effect */}
                {isPrev && (
                  <motion.div
                    key={slide.id + "-prev"}
                    initial={{ opacity: 0.5, scale: 0.92, y: 60 }}
                    animate={{ opacity: 0.7, scale: 0.96, y: 20 }}
                    exit={{ opacity: 0, scale: 0.9, y: -60 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="absolute left-0 top-0 w-full h-full flex justify-center items-center"
                    style={{ zIndex: 5 }}
                  >
                    <Image
                      src={slide.image}
                      alt="Printer"
                      width={1250}
                      height={600}
                      className="object-contain rounded-xl shadow-xl"
                      style={{ filter: "blur(1px) grayscale(30%)" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    </div>
  );
}

