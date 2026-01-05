"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, ExternalLink } from "lucide-react";
import type { HeroBannerOffer } from "@/services/heroBannerService";

interface HeroBannerSliderProps {
  offers: HeroBannerOffer[];
}

export default function HeroBannerSlider({ offers }: HeroBannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play slider (changes slide every 5 seconds)
  useEffect(() => {
    if (!isAutoPlaying || offers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, offers.length]);

  if (!offers || offers.length === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + offers.length) % offers.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % offers.length);
    setIsAutoPlaying(false);
  };

  const currentOffer = offers[currentSlide];

  // Support multiple possible image field names
  const imageUrl = currentOffer.background_image_url 
    || currentOffer.image_url 
    || currentOffer.hero_image 
    || currentOffer.banner_image 
    || currentOffer.image;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development' && currentOffer) {
    console.log("[HeroBannerSlider] Current offer:", {
      id: currentOffer.id,
      title: currentOffer.title,
      imageUrl,
      allKeys: Object.keys(currentOffer)
    });
  }

  return (
    <section className="relative h-[400px] md:h-[450px] w-full overflow-hidden bg-gray-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={currentOffer.title || "Banner"}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800" />
        )}
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Navigation Arrows */}
      {offers.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-white"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-2xl text-white">
            {/* Title */}
            {currentOffer.title && (
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {currentOffer.title}
              </h1>
            )}

            {/* Offer Headline */}
            {currentOffer.offer_headline && (
              <p className="text-lg md:text-xl font-semibold mb-4 text-blue-300">
                {currentOffer.offer_headline}
              </p>
            )}

            {/* RERA Info */}
            {currentOffer.rera_number && (
              <div className="text-sm md:text-base text-gray-200 mb-4">
                RERA No. {currentOffer.rera_number}
                {currentOffer.rera_link && (
                  <a
                    href={currentOffer.rera_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 underline hover:text-white transition-colors"
                  >
                    {currentOffer.rera_link}
                  </a>
                )}
              </div>
            )}

            {/* Location Highlights */}
            {currentOffer.location_text && (
              <div className="flex items-center gap-2 text-base md:text-lg text-gray-200 mb-2">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>{currentOffer.location_text}</span>
              </div>
            )}
            {currentOffer.location_highlight && (
              <p className="text-sm md:text-base text-gray-300 mb-4">
                {currentOffer.location_highlight}
              </p>
            )}

            {/* Configurations */}
            {currentOffer.configurations && Array.isArray(currentOffer.configurations) && currentOffer.configurations.length > 0 && (
              <div className="mb-6 space-y-2">
                {currentOffer.configurations.map((config, idx) => (
                  <div key={idx} className="text-base md:text-lg text-white">
                    {config.bhk && (
                      <span className="font-semibold">{config.bhk}</span>
                    )}
                    {config.sqft && (
                      <span className="mx-2">
                        {config.sqft}
                        {config.sqm && ` (${config.sqm})`}
                      </span>
                    )}
                    {config.price && (
                      <span className="font-semibold"> - {config.price}</span>
                    )}
                    {config.location && (
                      <span className="text-gray-300"> | {config.location}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CTA Button */}
            {currentOffer.cta_link && (
              <Link
                href={currentOffer.cta_link}
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
              >
                {currentOffer.cta_text || "Explore Now"}
                <ExternalLink className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Slide Indicators (Dots) */}
      {offers.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {offers.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 w-2 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
