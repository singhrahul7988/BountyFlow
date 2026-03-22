import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-8 w-8 text-primary"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 8H38V30L24 40L10 30V8Z"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path d="M15 31L33 13" stroke="currentColor" strokeWidth="3" />
        <path d="M18 13H33V18" stroke="currentColor" strokeWidth="3" />
      </svg>
      <span className="bf-display text-2xl font-bold tracking-tightHeading text-primary">
        BOUNTYFLOW
      </span>
    </div>
  );
}
