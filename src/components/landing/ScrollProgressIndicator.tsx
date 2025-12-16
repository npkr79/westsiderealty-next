"use client";

import { useEffect, useState } from "react";

export default function ScrollProgressIndicator() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(value);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-40 h-1 bg-muted">
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}


