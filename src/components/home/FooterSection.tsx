"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Linkedin, Twitter } from "lucide-react";

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/remaxwestsiderealty", label: "Facebook" },
  { icon: Instagram, href: "https://www.instagram.com/remax.westsiderealty/", label: "Instagram" },
  { icon: Youtube, href: "https://www.youtube.com/@REMAXWestsideRealty", label: "YouTube" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/remaxwestsiderealty", label: "LinkedIn" },
  { icon: Twitter, href: "https://x.com/remaxwestside", label: "X" },
];

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">RE/MAX Westside Realty</h3>
            <p className="text-sm text-slate-400">
              Premier real estate advisory for Hyderabad, Goa & Dubai. Expert guidance for premium properties, investment opportunities & holiday homes.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Market Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Properties */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-white">Properties</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/hyderabad/buy" className="hover:text-white transition-colors">
                  Hyderabad Properties
                </Link>
              </li>
              <li>
                <Link href="/goa/buy" className="hover:text-white transition-colors">
                  Goa Properties
                </Link>
              </li>
              <li>
                <Link href="/dubai/buy" className="hover:text-white transition-colors">
                  Dubai Properties
                </Link>
              </li>
              <li>
                <Link href="/developers" className="hover:text-white transition-colors">
                  Developers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-white">Contact Us</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-300" />
                <span>415, 4th Floor, Kokapet Terminal<br />Kokapet, Hyderabad – 500075</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-slate-300" />
                <a href="tel:+919866085831" className="hover:text-white transition-colors">
                  +91 9866085831
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-slate-300" />
                <a href="mailto:info@westsiderealty.in" className="hover:text-white transition-colors">
                  info@westsiderealty.in
                </a>
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
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary flex items-center justify-center transition-colors"
                aria-label={social.label}
              >
                <Icon className="w-5 h-5 text-slate-300" />
              </a>
            );
          })}
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-slate-800 py-6 mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-slate-500">
            <p>© {currentYear} RE/MAX Westside Realty. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link href="/privacy-policy" className="hover:text-slate-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-slate-400 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


