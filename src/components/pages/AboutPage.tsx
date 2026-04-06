"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Award,
  Users,
  MapPin,
  TrendingUp,
  Shield,
  Handshake,
  Phone,
  Star,
  Clock,
} from "lucide-react";
import { convertYouTubeToEmbed } from "@/utils/urlConverters";
import TestimonialsSection from "@/components/home/TestimonialsSection";

interface AboutPageProps {
  testimonials?: any[];
}

const values = [
  {
    icon: Handshake,
    title: "Integrity",
    description: "We uphold the highest ethical standards in all our dealings.",
  },
  {
    icon: Shield,
    title: "Trust",
    description: "Building lasting relationships based on transparency and reliability.",
  },
  {
    icon: TrendingUp,
    title: "Excellence",
    description: "Commitment to providing exceptional service and expertise.",
  },
];

const achievements = [
  { icon: Award, title: "Global Network", value: "140,000+", sub: "agents worldwide" },
  { icon: MapPin, title: "Offices Worldwide", value: "9,000+", sub: "offices globally" },
  { icon: Star, title: "Years in Business", value: "53", sub: "years of expertise" },
];

const officeHighlights = [
  {
    icon: MapPin,
    title: "Prime Location",
    desc: "Easily accessible from all major areas",
  },
  {
    icon: Clock,
    title: "Open 6 Days a Week",
    desc: "Monday to Saturday, 9 AM to 7 PM",
  },
  {
    icon: Handshake,
    title: "Expert Assistance",
    desc: "Personalized guidance for all your needs",
  },
];

const aboutImage =
  "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/service-images//remax-office.jpg";

export default function AboutPage({ testimonials = [] }: AboutPageProps) {
  const videoUrl = convertYouTubeToEmbed("https://www.youtube.com/watch?v=ZOfoEr-D04k");

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-luxury-charcoal py-28 px-4 overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,166,70,0.08)_0%,_transparent_60%)]" />
        <div className="relative container mx-auto text-center max-w-3xl">
          <p
            className="text-luxury-gold text-xs uppercase tracking-[0.25em] mb-5"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Our Story
          </p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Hyderabad's Premium Real Estate Advisors
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Over a decade of integrity, trust, and results — across Hyderabad, Goa & Dubai.
          </p>
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-luxury-gold text-xs uppercase tracking-[0.25em] mb-4">
                Who We Are
              </p>
              <h2
                className="text-3xl md:text-4xl font-semibold text-luxury-charcoal mb-6 leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Built on a Decade of Trusted Guidance
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                RE/MAX Westside Realty was founded with a vision to redefine the real estate experience.
                With over 10 years of experience, we've grown to become a trusted name in Hyderabad,
                Goa, and Dubai. Our commitment to integrity, trust, and excellence drives everything we do.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We believe in building lasting relationships with our clients, guiding them through
                every step of their property journey. Whether you're buying, selling, or investing,
                we're here to provide expert advice and personalized service.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg aspect-video bg-gray-100">
              <iframe
                title="History of RE/MAX"
                src={videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Achievements ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-luxury-charcoal">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-luxury-gold text-xs uppercase tracking-[0.25em] mb-4">
              By the Numbers
            </p>
            <h2
              className="text-3xl md:text-4xl font-semibold text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              A Track Record That Speaks
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievements.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="text-center p-8 rounded-xl border border-white/10 bg-white/5">
                  <Icon className="h-8 w-8 text-luxury-gold mx-auto mb-5" />
                  <p
                    className="text-5xl font-semibold text-white mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {a.value}
                  </p>
                  <p className="text-luxury-gold text-sm font-medium mb-1">{a.title}</p>
                  <p className="text-white/40 text-sm">{a.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Core Values ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-luxury-cream">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-luxury-gold text-xs uppercase tracking-[0.25em] mb-4">
              How We Work
            </p>
            <h2
              className="text-3xl md:text-4xl font-semibold text-luxury-charcoal mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Our Core Values
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Guiding principles that shape every interaction with our clients.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-full bg-luxury-charcoal flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-6 w-6 text-luxury-gold" />
                  </div>
                  <h3
                    className="text-xl font-semibold text-luxury-charcoal mb-3"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      {testimonials && testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}

      {/* ── Visit Our Office ──────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-luxury-gold text-xs uppercase tracking-[0.25em] mb-4">
              Find Us
            </p>
            <h2
              className="text-3xl md:text-4xl font-semibold text-luxury-charcoal mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Visit Our Office
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Located in the heart of Kokapet, Hyderabad — easily accessible from all major areas.
            </p>
          </div>

          {/* Office Image */}
          <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
            <Image
              src={aboutImage}
              alt="RE/MAX Westside Realty team at our Kokapet office in Hyderabad"
              width={1200}
              height={600}
              className="w-full h-auto object-cover"
              priority
            />
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden shadow-sm mb-12">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3574.5406493313703!2d78.3269774748044!3d17.385123602871065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6869ea289d44d3d%3A0x7ee055e9306884d4!2sRE%2FMAX%20Westside%20Realty!5e1!3m2!1sen!2sin!4v1766248713985!5m2!1sen!2sin"
              width="100%"
              height="420"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="RE/MAX Westside Realty Office Location"
            />
          </div>

          {/* Office highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {officeHighlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full border border-luxury-gold/40 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-luxury-gold" />
                  </div>
                  <h3
                    className="text-lg font-semibold text-luxury-charcoal mb-1"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {h.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{h.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-luxury-charcoal relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(201,166,70,0.08)_0%,_transparent_60%)]" />
        <div className="relative container mx-auto text-center max-w-2xl">
          <p className="text-luxury-gold text-xs uppercase tracking-[0.25em] mb-4">
            Get Started
          </p>
          <h2
            className="text-3xl md:text-4xl font-semibold text-white mb-5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Ready to Start Your Property Journey?
          </h2>
          <p className="text-white/55 mb-10 leading-relaxed">
            Contact us today for expert advice and personalized service across Hyderabad, Goa & Dubai.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-luxury-gold hover:bg-luxury-gold-dark text-white font-medium rounded-lg transition-colors luxury-cta"
          >
            <Phone className="h-4 w-4" />
            Schedule a Consultation
          </Link>
        </div>
      </section>

    </div>
  );
}
