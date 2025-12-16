"use client";

export default function FooterSection() {
  return (
    <footer className="border-t border-border bg-background py-6 mt-10">
      <div className="container mx-auto flex flex-col gap-2 px-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} RE/MAX Westside Realty. All rights reserved.</p>
        <div className="flex flex-wrap gap-4">
          <a href="/privacy-policy" className="hover:text-foreground">
            Privacy Policy
          </a>
          <a href="/contact" className="hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}


