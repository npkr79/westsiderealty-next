"use client";
import { useState } from "react";

interface ConnectivityDetailsProps {
  content: string;
  isHtml: boolean;
}

export default function ConnectivityDetails({ content, isHtml }: ConnectivityDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-4">
      <div className={expanded ? "" : "line-clamp-4 overflow-hidden"}>
        {isHtml ? (
          <div
            className="text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
        )}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1 text-xs text-blue-600 underline cursor-pointer"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
