"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-xl mb-4">Westside Realty</h3>
            <p className="text-sm mb-4">
              Your trusted real estate partner for premium properties in Hyderabad, Goa & Dubai.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/remaxwestsiderealty"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/remaxwestsiderealty"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-400 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/hyderabad/buy" className="hover:text-white transition-colors">
                  Buy Properties
                </Link>
              </li>
              <li>
                <Link href="/hyderabad/projects" className="hover:text-white transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/developers" className="hover:text-white transition-colors">
                  Developers
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/hyderabad/buy" className="hover:text-white transition-colors">
                  Resale Properties
                </Link>
              </li>
              <li>
                <Link href="/goa/buy" className="hover:text-white transition-colors">
                  Holiday Homes
                </Link>
              </li>
              <li>
                <Link href="/dubai" className="hover:text-white transition-colors">
                  Dubai Investments
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+919866085831" className="hover:text-white transition-colors">
                  +91-9866085831
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:npkr79@gmail.com" className="hover:text-white transition-colors">
                  npkr79@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1" />
                <span>Hyderabad, Telangana, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>
            © {new Date().getFullYear()} RE/MAX Westside Realty. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
