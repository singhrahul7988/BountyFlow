"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type TerminalSelectOption = {
  label: string;
  value: string;
};

type TerminalSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: TerminalSelectOption[];
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
};

export function TerminalSelect({
  value,
  onChange,
  options,
  className,
  buttonClassName,
  ariaLabel
}: TerminalSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    Math.max(
      0,
      options.findIndex((option) => option.value === value)
    )
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  useEffect(() => {
    setActiveIndex(
      Math.max(
        0,
        options.findIndex((option) => option.value === value)
      )
    );
  }, [options, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  function commitSelection(nextIndex: number) {
    const option = options[nextIndex];

    if (!option) {
      return;
    }

    setActiveIndex(nextIndex);
    onChange(option.value);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() =>
          setIsOpen((currentState) => {
            const nextState = !currentState;
            if (nextState) {
              setActiveIndex(
                Math.max(
                  0,
                  options.findIndex((option) => option.value === value)
                )
              );
            }
            return nextState;
          })
        }
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!isOpen) {
              setIsOpen(true);
              return;
            }

            const direction = event.key === "ArrowDown" ? 1 : -1;
            const nextIndex = (activeIndex + direction + options.length) % options.length;
            setActiveIndex(nextIndex);
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();

            if (isOpen) {
              commitSelection(activeIndex);
            } else {
              setIsOpen(true);
            }
          }
        }}
        className={cn(
          "bf-terminal-input flex items-center justify-between gap-4 text-left",
          buttonClassName
        )}
      >
        <span>{selectedOption?.label}</span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={cn(
            "h-3 w-3 shrink-0 text-muted transition-transform duration-100 ease-linear",
            isOpen ? "rotate-180" : ""
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M2 4.5L6 8L10 4.5" />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          aria-activedescendant={`${listboxId}-${activeIndex}`}
          className="absolute left-0 right-0 z-30 mt-1 border border-outline/25 bg-surface-low shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
        >
          <ul className="max-h-64 overflow-auto py-1">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <li key={option.value} id={`${listboxId}-${index}`} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => commitSelection(index)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-3 text-left font-mono text-sm uppercase tracking-label transition-colors duration-100 ease-linear",
                      isActive
                        ? "bg-primary-gradient text-on-primary"
                        : isSelected
                          ? "bg-surface-high text-primary"
                          : "text-foreground hover:bg-surface-high"
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <span className="bf-label text-current">SELECTED</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
