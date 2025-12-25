"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect from /admin/scraper to /admin/scraping
export default function ScraperRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/scraping');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to scraper page...</p>
    </div>
  );
}

