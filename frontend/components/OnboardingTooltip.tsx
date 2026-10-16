"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

export interface TooltipStep {
  targetId: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  emoji?: string;
}

interface OnboardingTooltipProps {
  steps: TooltipStep[];
  storageKey?: string;
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function OnboardingTooltip({
  steps,
  storageKey = "onboarding_seen",
  forceOpen,
  onClose,
}: OnboardingTooltipProps) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [side, setSide] = useState<"top" | "bottom" | "left" | "right">("bottom");

  // Show only for first-time visitors or if forceOpen is triggered
  useEffect(() => {
    if (forceOpen) {
      setCurrent(0);
      setVisible(true);
      return;
    }
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [storageKey, forceOpen]);

  const positionCallout = useCallback(() => {
    const step = steps[current];
    if (!step) return;
    const el = document.getElementById(step.targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });

      if (step.position) {
        setSide(step.position);
      } else {
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setSide(spaceBelow > 220 ? "bottom" : spaceAbove > 220 ? "top" : "bottom");
      }
    }, 350);
  }, [current, steps]);

  useEffect(() => {
    if (!visible) return;
    positionCallout();
  }, [current, visible, positionCallout]);

  useEffect(() => {
    if (!visible) return;
    const handleResize = () => positionCallout();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [visible, positionCallout]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, "1");
    if (onClose) onClose();
  };

  const goNext = () => {
    if (current < steps.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      dismiss();
    }
  };

  const goPrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  if (!visible || coords.width === 0) return null;

  const step = steps[current];
  const GAP = 14;
  let boxStyle: React.CSSProperties = {};
  let arrowStyle: React.CSSProperties = {};
  let arrowBorder = "";

  const centerX = coords.left + coords.width / 2;
  const centerY = coords.top + coords.height / 2;

  // Keep tooltip on screen horizontally
  const idealLeft = Math.max(16, Math.min(centerX - 160, window.innerWidth - 340));

  if (side === "bottom") {
    boxStyle = {
      top: coords.top + coords.height + GAP,
      left: idealLeft,
    };
    arrowStyle = { top: -8, left: `${Math.max(20, Math.min(centerX - idealLeft, 290))}px` };
    arrowBorder = "border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800";
  } else if (side === "top") {
    boxStyle = {
      top: coords.top - GAP,
      left: idealLeft,
      transform: "translateY(-100%)",
    };
    arrowStyle = { bottom: -8, left: `${Math.max(20, Math.min(centerX - idealLeft, 290))}px` };
    arrowBorder = "border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800";
  } else if (side === "right") {
    boxStyle = {
      top: centerY - 60,
      left: coords.left + coords.width + GAP,
    };
    arrowStyle = { top: "50%", left: -8, transform: "translateY(-50%)" };
    arrowBorder = "border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-white dark:border-r-gray-800";
  } else {
    boxStyle = {
      top: centerY - 60,
      left: coords.left - GAP,
      transform: "translateX(-100%)",
    };
    arrowStyle = { top: "50%", right: -8, transform: "translateY(-50%)" };
    arrowBorder = "border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-white dark:border-l-gray-800";
  }

  return (
    <>
      {/* Background dimmer backdrop */}
      <div
        onClick={dismiss}
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[999] backdrop-blur-[1px] transition-opacity"
      />

      {/* Target element spotlight ring */}
      <div
        className="absolute z-[1000] pointer-events-none transition-all duration-300 rounded-2xl ring-4 ring-cyan-500 ring-offset-4 ring-offset-transparent shadow-[0_0_25px_rgba(6,182,212,0.6)] animate-pulse"
        style={{
          top: coords.top - 4,
          left: coords.left - 4,
          width: coords.width + 8,
          height: coords.height + 8,
        }}
      />

      {/* Tooltip Popover Box */}
      <div
        className="absolute z-[1001] w-84 max-w-[calc(100vw-32px)] transition-all duration-300"
        style={boxStyle}
      >
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-cyan-400 dark:border-cyan-500 overflow-hidden text-gray-800 dark:text-gray-100">
          <div className={`absolute w-0 h-0 ${arrowBorder}`} style={arrowStyle} />

          {/* Top subtle gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />

          <div className="p-4 sm:p-5">
            {/* Header: step counter + close button */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300">
                <Sparkles size={11} />
                Step {current + 1} of {steps.length}
              </span>
              <button
                onClick={dismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Skip tour"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title & Emoji */}
            <div className="flex items-center gap-2 mb-1.5">
              {step.emoji && <span className="text-xl">{step.emoji}</span>}
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {step.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Actions: Skip, Back, Next */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={dismiss}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {current > 0 && (
                  <button
                    onClick={goPrev}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <ChevronLeft size={13} /> Back
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md transition"
                >
                  {current < steps.length - 1 ? (
                    <>Next <ChevronRight size={13} /></>
                  ) : (
                    "Got it! ?"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
