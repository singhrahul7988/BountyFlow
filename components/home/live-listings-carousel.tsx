"use client";

import { useState } from "react";

import type { BountyCardData } from "@/lib/mock-data";
import { BountyCard } from "./bounty-card";

export function LiveListingsCarousel({ items }: { items: BountyCardData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleItems = Array.from({ length: Math.min(3, items.length) }, (_, offset) => {
    return items[(activeIndex + offset) % items.length];
  });

  function handlePrev() {
    setActiveIndex((currentIndex) => (currentIndex === 0 ? items.length - 1 : currentIndex - 1));
  }

  function handleNext() {
    setActiveIndex((currentIndex) => (currentIndex >= items.length - 1 ? 0 : currentIndex + 1));
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-4" data-reveal="zoom">
        <h2 className="bf-display text-[1.95rem] leading-none tracking-tightHeading sm:text-[2.8rem]">
          LIVE LISTINGS
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous bounties"
            className="flex h-10 w-10 items-center justify-center border border-outline/20 bg-transparent text-primary transition-colors duration-100 ease-linear hover:border-outline/50"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 5L8 12L15 19" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next bounties"
            className="flex h-10 w-10 items-center justify-center border border-outline/20 bg-transparent text-primary transition-colors duration-100 ease-linear hover:border-outline/50"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 5L16 12L9 19" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item, index) => (
          <div
            key={`${item.title}-${item.rewardPool}-${index}`}
            data-reveal="zoom"
            style={{ ["--reveal-order" as string]: index + 1 }}
          >
            <BountyCard {...item} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
