"use client";

import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface TestimonialsCarouselProps {
  testimonials: any[];
}

export default function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            💬 WHAT CLIENTS SAY
          </h2>
          <p className="text-gray-600">Real experiences from our customers</p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div
            key={currentIndex}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12 animate-fade-in"
          >
              {/* Quote Icon */}
              <div className="flex justify-center mb-4">
                <Quote className="w-12 h-12 text-blue-600 opacity-20" />
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-lg md:text-xl text-gray-700 text-center mb-6 leading-relaxed">
                "{currentTestimonial.testimonial_text || currentTestimonial.content || currentTestimonial.message}"
              </p>

              {/* Author */}
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">
                  {currentTestimonial.client_name || currentTestimonial.name || "Anonymous"}
                </p>
                {currentTestimonial.project_name && (
                  <p className="text-sm text-gray-600 mt-1">
                    Closed {currentTestimonial.project_name} in {currentTestimonial.days || "45"} days
                  </p>
                )}
              </div>
            </div>

          {/* Navigation Arrows */}
          <button
            onClick={() =>
              setCurrentIndex(
                (prev) => (prev - 1 + testimonials.length) % testimonials.length
              )
            }
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev + 1) % testimonials.length)
            }
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-blue-600 w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
