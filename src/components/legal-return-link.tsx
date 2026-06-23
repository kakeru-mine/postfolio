"use client";

import Link from "next/link";

export function LegalReturnLink({
  href,
  children,
  className,
  onClick,
}: {
  href: "/terms" | "/privacy";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        sessionStorage.setItem(
          "postfolio_legal_return_to",
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        );
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
