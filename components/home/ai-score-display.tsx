"use client";

import { useEffect, useRef, useState } from "react";

import type { AnalyzerMetric } from "@/lib/mock-data";

function animateNumber(target: number, duration: number, onUpdate: (value: number) => void) {
  const start = performance.now();

  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    onUpdate(Number((target * progress).toFixed(1)));
    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  }

  window.requestAnimationFrame(tick);
}

export function AIScoreDisplay({
  score,
  subScores,
  reasoning,
  recommendedPct,
  animate = false,
  title,
  subtitle
}: {
  score: number;
  subScores: AnalyzerMetric[];
  reasoning: string;
  recommendedPct: number;
  animate?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(!animate);
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const formattedScore = displayScore === 0 ? "0" : displayScore.toFixed(1);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          animateNumber(score, 900, setDisplayScore);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [animate, score]);

  return (
    <div ref={ref} className="space-y-5">
      {title ? (
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="bf-label text-[0.64rem] text-primary">{title}</span>
            {subtitle ? <p className="bf-label">{subtitle}</p> : null}
          </div>
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M11.5 1.5L4.5 11H9L8 18.5L15.5 8.5H11L11.5 1.5Z" />
          </svg>
        </div>
      ) : null}

      <div className="flex items-end gap-3">
        <span className="bf-data text-5xl text-primary">{formattedScore}</span>
        <span className="bf-data text-xl text-muted">/ 10</span>
      </div>

      <div className="space-y-3">
        {subScores.map((metric, index) => (
          <div key={metric.label} className="space-y-2" style={{ transitionDelay: `${index * 100}ms` }}>
            <div className="flex items-center justify-between gap-4">
              <span className="bf-label text-[0.64rem] text-foreground">{metric.label}</span>
              <span className="bf-data text-[0.78rem] text-foreground">{Math.round(metric.value * 100)}%</span>
            </div>
            <div className="h-[5px] bg-background">
              <div
                className="h-full bg-primary-gradient transition-all duration-700 ease-out"
                style={{ width: isVisible ? `${metric.value * 100}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5 bg-background p-4">
        <span className="bf-label text-[0.64rem] text-primary">ANALYZING SUBMISSION...</span>
        <p className="text-[0.84rem] leading-7 text-foreground">{reasoning}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="bf-label text-[0.64rem]">RECOMMENDED PAYOUT</span>
        <span className="bf-data text-[1.05rem] text-primary">{recommendedPct}%</span>
      </div>
    </div>
  );
}
