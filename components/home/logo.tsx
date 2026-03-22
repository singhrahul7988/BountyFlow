import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className={cn(compact ? "h-6 w-6" : "h-7 w-7", "text-primary")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 8H38V30L24 40L10 30V8Z"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M15 31L31 15M22 15H33V26"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
      <span
        className={cn(
          compact ? "text-[1.35rem]" : "text-[1.7rem]",
          "bf-display font-bold tracking-tightHeading text-primary"
        )}
      >
        BOUNTYFLOW
      </span>
    </div>
  );
}
