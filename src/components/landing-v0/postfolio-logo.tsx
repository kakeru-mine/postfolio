import Image from "next/image";
import { cn } from "@/components/landing-v0/utils";

export function PostfolioLogo({
  className,
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative size-10 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
        <Image
          src="/postfolio-icon.png"
          alt="Postfolio"
          fill
          sizes="40px"
          className="object-cover"
          priority
        />
      </div>
      <div className="leading-none">
        <span className="block text-lg font-bold tracking-tight text-current">Postfolio</span>
        {showTagline && (
          <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-current/60">
            SNS Research Box
          </span>
        )}
      </div>
    </div>
  );
}
