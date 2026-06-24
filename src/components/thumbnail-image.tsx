"use client";

import { useState } from "react";

const PROXY_HOSTS = [
  /\.fbcdn\.net$/,
  /\.cdninstagram\.com$/,
  /\.instagram\.com$/,
  /\.threads\.net$/,
];

function needsProxy(url: string) {
  try {
    return PROXY_HOSTS.some((p) => p.test(new URL(url).hostname));
  } catch {
    return false;
  }
}

function proxyUrl(url: string) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export function ThumbnailImage({
  src,
  alt = "",
  className,
  fallback,
}: {
  src: string;
  alt?: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const resolvedSrc = needsProxy(src) ? proxyUrl(src) : src;
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
