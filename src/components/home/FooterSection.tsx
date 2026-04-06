"use client";

import Link from "next/link";
import { MapPin, Facebook, Instagram, Youtube, Linkedin, Twitter } from "lucide-react";
import { useEffect, useState } from "react";

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/remaxwestsiderealty", label: "Facebook" },
  { icon: Instagram, href: "https://www.instagram.com/remax.westsiderealty/", label: "Instagram" },
  { icon: Youtube, href: "https://www.youtube.com/@REMAXWestsideRealty", label: "YouTube" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/remaxwestsiderealty", label: "LinkedIn" },
  { icon: Twitter, href: "https://x.com/remaxwestside", label: "X" },
];

interface RecentArticle {
  title: string;
  slug: string;
  category: string | null;
}

function LatestInsightsColumn() {
  const [articles, setArticles] = useState<RecentArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog/recent')
      .then((res) => res.json())
      .then(({ articles: data }: { articles: RecentArticle[] }) => {
        console.log('[Footer] articles:', data);
        if (data && data.length > 0) setArticles(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error('[Footer] fetch failed:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-luxury-gold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Latest Insights</h4>
      <ul className="space-y-3 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {loading
          ? [0, 1, 2].map((i) => (
              <li key={i} className="space-y-1">
                <div className="h-2.5 w-16 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
              </li>
            ))
          : articles.map((a) => (
              <li key={a.slug}>
                {a.category && (
                  <p className="text-[10px] uppercase tracking-widest text-luxury-gold/50 mb-0.5">
                    {a.category}
                  </p>
                )}
                <Link
                  href={`/blog/${a.slug}`}
                  className="text-white/55 hover:text-luxury-gold transition-colors leading-snug block overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  } as React.CSSProperties}
                >
                  {a.title}
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );
}

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-luxury-charcoal text-white/60 mt-10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>RE/MAX Westside Realty</h3>
            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Premier real estate advisory for Hyderabad, Goa & Dubai. Expert guidance for premium properties, investment opportunities & holiday homes.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-luxury-gold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Quick Links</h4>
            <ul className="space-y-2 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <li>
                <Link href="/" className="hover:text-luxury-gold transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-luxury-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-luxury-gold transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-luxury-gold transition-colors">
                  Articles &amp; Research
                </Link>
              </li>
            </ul>
          </div>

          {/* Properties */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-luxury-gold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Properties</h4>
            <ul className="space-y-2 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <li>
                <Link href="/hyderabad/buy" className="hover:text-luxury-gold transition-colors">
                  Hyderabad Properties
                </Link>
              </li>
              <li>
                <Link href="/goa/buy" className="hover:text-luxury-gold transition-colors">
                  Goa Properties
                </Link>
              </li>
              <li>
                <Link href="/dubai/buy" className="hover:text-luxury-gold transition-colors">
                  Dubai Properties
                </Link>
              </li>
              <li>
                <Link href="/developers" className="hover:text-luxury-gold transition-colors">
                  Developers
                </Link>
              </li>
            </ul>
          </div>

          {/* Latest Insights */}
          <LatestInsightsColumn />

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-luxury-gold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Contact Us</h4>
            <ul className="space-y-3 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-luxury-gold/70" />
                <span>415, 4th Floor, Kokapet Terminal<br />Kokapet, Hyderabad – 500075</span>
              </li>
              <li>
                <Link href="/contact" className="hover:text-luxury-gold transition-colors">
                  Get In Touch
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4 mt-6">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-luxury-gold flex items-center justify-center transition-colors"
                aria-label={social.label}
              >
                <Icon className="w-5 h-5 text-white/70" />
              </a>
            );
          })}
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-white/10 py-6 mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-white/35" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <p>© {currentYear} RE/MAX Westside Realty. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link href="/privacy-policy" className="hover:text-luxury-gold transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-luxury-gold transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
