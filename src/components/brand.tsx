import { cn } from "@/lib/utils";

/**
 * Koru brand mark — an unfurling spiral (the koru of new growth),
 * drawn as a clean continuous stroke. Reads as a tide swirl.
 */

export function KoruMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <path
        d="M38 24c0-7.7-6.3-14-14-14S10 16.3 10 24s6.3 14 14 14c5.2 0 9.7-2.8 12.1-7.1"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M38 24c0-4.6-3.7-8.3-8.3-8.3S21.4 19.4 21.4 24s3.7 8.3 8.3 8.3c3 0 5.7-1.6 7.1-4.1"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-accent"
      />
      <circle cx="24" cy="24" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Brand({
  className,
  markClassName,
  titleClassName,
  subtitleClassName,
}: {
  className?: string;
  markClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KoruMark className={cn("h-7 w-7", markClassName)} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-lg font-medium tracking-tight", titleClassName)}>Koru</span>
        <span className={cn("label-mono mt-0.5 text-[9px] text-muted-foreground", subtitleClassName)}>
          Funding OS · Fiji
        </span>
      </span>
    </span>
  );
}
