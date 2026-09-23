"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const heroImages = [
  {
    src: "/images/ethopia.jpeg",
    alt: "Ethiopian coffee",
  },
  {
    src: "/images/chimbuk.jpeg",
    alt: "Signature espresso",
  },
  {
    src: "/images/cluster.jpeg",
    alt: "cluster",
  },
  {
    src: null,
    alt: "East Bengal Coffee Roasters logo on a white background",
  },
];

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const showPrevious = () => {
    setActiveIndex(
      (currentIndex) =>
        (currentIndex - 1 + heroImages.length) % heroImages.length,
    );
  };

  const showNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % heroImages.length);
  };

  return (
    <section className="relative mt-20 h-[320px] md:h-[400px] w-full overflow-hidden bg-white lg:h-[38vw] lg:max-h-[650px]">
      <div className="relative h-full">
        {heroImages.map((image, index) =>
          image.src ? (
            <div
              key={image.src || `slide-${index}`}
              aria-hidden={index !== activeIndex}
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
                index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* 1. Blurred background image to fill the empty side spaces dynamically */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50 scale-110"
                style={{ backgroundImage: `url(${image.src})` }}
              />

              {/* 2. The actual product image, fully visible and uncropped */}
              <img
                src={image.src}
                alt={image.alt}
                className="absolute inset-0 h-full w-full object-cover object-center drop-shadow-2xl"
              />
            </div>
          ) : (
            <div
              key="white-slide"
              aria-label={image.alt}
              aria-hidden={index !== activeIndex}
              className={`absolute inset-0 bg-white transition-opacity duration-700 ${
                index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            />
          ),
        )}
      </div>

      <div className="absolute inset-0 bg-black/15" />

      {activeIndex === 3 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64 md:w-72 md:h-72 lg:w-[470px] lg:h-[470px]">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/80 to-indigo-900/80 rounded-full border-indigo-500 shadow-2xl flex flex-col items-center justify-center">
                <img
                  src="/ecbr-logo.png"
                  alt="East Bengal Coffee Roasters"
                  className="w-40 h-auto lg:w-80 lg:h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <button
        type="button"
        onClick={showPrevious}
        aria-label="Previous hero image"
        className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-900 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/20"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={showNext}
        aria-label="Next hero image"
        className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-900 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/20"
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button> */}

      <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {heroImages.map((image, index) => (
          <button
            key={image.src || `slide-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === activeIndex}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex
                ? "w-8 bg-white"
                : "w-2.5 bg-white/60 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
