"use client";

import React from 'react';

interface ImageBlockProps {
  alt: string;
  src?: string;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ alt, src }) => {
  const [failed, setFailed] = React.useState(false);
  const canShowImage = src && !failed;

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      {canShowImage ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-48 object-contain bg-white rounded-md"
          onError={() => setFailed(true)}
        />
      ) : (
        <svg
          viewBox="0 0 400 220"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-48 rounded-md"
          role="img"
          aria-label={alt}
        >
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="400" height="220" rx="8" fill="url(#g1)" />
          <rect x="16" y="16" width="368" height="24" rx="6" fill="#cbd5e1" />
          <circle cx="32" cy="28" r="5" fill="#ef4444" />
          <circle cx="50" cy="28" r="5" fill="#f59e0b" />
          <circle cx="68" cy="28" r="5" fill="#22c55e" />
          <rect x="16" y="48" width="72" height="156" rx="6" fill="#e5e7eb" />
          <rect x="24" y="60" width="56" height="14" rx="4" fill="#94a3b8" />
          <rect x="24" y="82" width="56" height="12" rx="4" fill="#cbd5e1" />
          <rect x="24" y="100" width="56" height="12" rx="4" fill="#cbd5e1" />
          <rect x="24" y="118" width="56" height="12" rx="4" fill="#cbd5e1" />
          <rect x="96" y="56" width="276" height="32" rx="6" fill="#e2e8f0" />
          <rect x="96" y="96" width="276" height="20" rx="4" fill="#cbd5e1" />
          <rect x="96" y="122" width="276" height="20" rx="4" fill="#cbd5e1" />
          <rect x="96" y="148" width="276" height="20" rx="4" fill="#cbd5e1" />
          <rect x="96" y="174" width="180" height="20" rx="4" fill="#38bdf8" opacity="0.7" />
          <text x="200" y="210" textAnchor="middle" fontSize="12" fill="#475569">
            {alt}
          </text>
        </svg>
      )}
      <p className="text-xs text-muted-foreground mt-2">{alt}</p>
    </div>
  );
};

export default ImageBlock;