"use client";

import { useEffect, useState } from "react";

import { AIScoreDisplay } from "./ai-score-display";
import { TerminalSelect } from "@/components/ui/terminal-select";
import {
  emptyExploitAnalysis,
  samplePayloads,
  vulnerabilityOptions,
  type ExploitAnalysisResult,
  type VulnerabilityType
} from "@/lib/exploit-analysis";

export function AnalyzerDemo() {
  const [runCount, setRunCount] = useState(0);
  const [typedReasoning, setTypedReasoning] = useState("");
  const [vulnerabilityType, setVulnerabilityType] = useState<VulnerabilityType>("REENTRANCY_ATTACK");
  const [payload, setPayload] = useState("");
  const [analysis, setAnalysis] = useState<ExploitAnalysisResult>(emptyExploitAnalysis);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (runCount === 0) {
      return;
    }

    setTypedReasoning("");
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setTypedReasoning(analysis.reasoning.slice(0, index));
      if (index >= analysis.reasoning.length) {
        window.clearInterval(interval);
      }
    }, 16);

    return () => window.clearInterval(interval);
  }, [analysis, runCount]);

  async function handleAnalyze() {
    if (!payload.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/analyze-exploit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vulnerabilityType,
          payload
        })
      });

      const data = (await response.json().catch(() => null)) as
        | (ExploitAnalysisResult & { error?: string })
        | null;

      if (!response.ok || !data) {
        setError(data?.error || "AI analysis failed. Check the Gemini configuration and try again.");
        setAnalysis(emptyExploitAnalysis);
        setTypedReasoning("");
        setRunCount(0);
        return;
      }

      setAnalysis(data);
      setRunCount((count) => count + 1);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "AI analysis failed. Check the Gemini configuration and try again."
      );
      setAnalysis(emptyExploitAnalysis);
      setTypedReasoning("");
      setRunCount(0);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="bf-panel grid gap-0 overflow-hidden lg:grid-cols-[1.02fr_0.98fr]" data-reveal="zoom">
      <div className="space-y-4.5 p-4.5 md:p-5" data-reveal="left" style={{ ["--reveal-order" as string]: 0 }}>
        <div className="space-y-2">
          <h2 className="bf-display text-[1.55rem] leading-none tracking-tightHeading sm:text-[1.9rem]">
            TEST YOUR
            <span className="block bg-primary-gradient bg-clip-text text-transparent">
              EXPLOIT LOGIC
            </span>
          </h2>
          <p className="max-w-lg text-[0.78rem] leading-6 text-muted sm:text-[0.84rem]">
            Run a simulated agent pass against a candidate exploit path before you submit.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label className="bf-label">VULNERABILITY TYPE</label>
              <button
                type="button"
                onClick={() => setPayload(samplePayloads[vulnerabilityType])}
                className="bf-button-tertiary text-[0.54rem]"
              >
                LOAD SAMPLE
              </button>
            </div>
            <TerminalSelect
              value={vulnerabilityType}
              onChange={(value) => setVulnerabilityType(value as VulnerabilityType)}
              options={vulnerabilityOptions}
              ariaLabel="Vulnerability type"
            />
          </div>

          <div className="space-y-2">
            <span className="bf-label">POC PAYLOAD (SOLIDITY)</span>
            <textarea
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              className="bf-terminal-input min-h-[9.5rem] resize-y text-[0.68rem] leading-6 text-muted caret-primary"
              placeholder="Write your payload here"
              spellCheck={false}
              aria-label="POC payload"
            />
          </div>

          {error ? <p className="text-[0.7rem] leading-6 text-error">{error}</p> : null}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!payload.trim() || isAnalyzing}
            className="bf-button-primary w-full justify-center px-4.5 py-2.25 text-[0.64rem]"
          >
            {isAnalyzing ? "RUNNING AI ANALYSIS..." : "RUN AI ANALYSIS"}
          </button>
        </div>
      </div>

      <div
        className="border-l border-outline-variant/20 bg-surface-high p-4.5 md:p-5"
        data-reveal="right"
        style={{ ["--reveal-order" as string]: 1 }}
      >
        <AIScoreDisplay
          key={runCount}
          score={analysis.score}
          subScores={analysis.subScores}
          reasoning={
            runCount > 0
              ? typedReasoning
              : analysis.reasoning
          }
          recommendedPct={analysis.recommendedPct}
          animate={runCount > 0}
          title="AI ANALYSIS TRIAGE"
          subtitle="LIKELIHOOD OF CRITICAL SEVERITY"
        />
      </div>
    </div>
  );
}
