"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background mt-10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">RE/MAX Westside Realty</h3>
            <p className="text-sm text-muted-foreground">
              Premier real estate advisory for Hyderabad, Goa & Dubai. Expert guidance for resale properties, investment opportunities & holiday homes.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-foreground transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Market Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Properties */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-foreground">Properties</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/hyderabad/buy" className="hover:text-foreground transition-colors">
                  Hyderabad Properties
                </Link>
              </li>
              <li>
                <Link href="/goa/buy" className="hover:text-foreground transition-colors">
                  Goa Properties
                </Link>
              </li>
              <li>
                <Link href="/dubai/buy" className="hover:text-foreground transition-colors">
                  Dubai Properties
                </Link>
              </li>
              <li>
                <Link href="/developers" className="hover:text-foreground transition-colors">
                  Developers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-foreground">Contact Us</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>415, 4th Floor, Kokapet Terminal<br />Kokapet, Hyderabad – 500075</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+919866085831" className="hover:text-foreground transition-colors">
                  +91 9866085831
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:info@westsiderealty.in" className="hover:text-foreground transition-colors">
                  info@westsiderealty.in
                </a>
              </li>
            </ul>
            <div className="flex gap-4 pt-2">
              <a
                href="https://www.facebook.com/remaxwestsiderealty"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/remaxwestsiderealty"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} RE/MAX Westside Realty. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


