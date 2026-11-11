"use client";

import React, { useEffect, useState } from "react";
import { useTourStore } from "@/hooks/use-tour-store";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const TourOverlay = () => {
  const { isOpen, steps, currentStep, nextStep, prevStep, closeTour } =
    useTourStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[currentStep];

  // Update target rect when step changes or window resizes
  useEffect(() => {
    if (!isOpen || !step) return;

    const updateRect = () => {
      const element = document.getElementById(step.targetId);
      if (element) {
        // Scroll element into view if needed
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
        setTargetRect(element.getBoundingClientRect());
      } else {
        // Warning: Element not found
        console.warn(`Tour target element #${step.targetId} not found`);
        setTargetRect(null);
      }
    };

    updateRect();
    // Allow a small delay for any layout shifts or scrolling
    const timeout = setTimeout(updateRect, 100);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true); // Capture scroll events

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      clearTimeout(timeout);
    };
  }, [isOpen, currentStep, step]);

  if (!isOpen || !step) return null;

  // Calculate Popover Position
  const getPopoverStyle = () => {
    if (!targetRect || typeof window === "undefined")
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

    const gap = 12;
    const placement = step.placement || "bottom";
    const boxWidth = 400; // Fixed width from w-[400px]
    const boxHeight = 250; // Estimated max height (increased for safety)
    const padding = 16; // Safety margin from screen edge

    let top = 0;
    let left = 0;
    let transform = "";

    // Window dimensions (client-side only)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    switch (placement) {
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2;
        transform = "translateX(-50%)";

        // Clamp Horizontal
        const minCenterX = boxWidth / 2 + padding;
        const maxCenterX = viewportWidth - boxWidth / 2 - padding;
        left = Math.max(minCenterX, Math.min(left, maxCenterX));

        // Auto-flip to top if not enough space below
        if (top + boxHeight > viewportHeight - padding) {
          top = targetRect.top - gap;
          transform = "translate(-50%, -100%)";
        }
        break;

      case "top":
        top = targetRect.top - gap;
        left = targetRect.left + targetRect.width / 2;
        transform = "translate(-50%, -100%)";

        // Clamp Horizontal
        const minCenterXTop = boxWidth / 2 + padding;
        const maxCenterXTop = viewportWidth - boxWidth / 2 - padding;
        left = Math.max(minCenterXTop, Math.min(left, maxCenterXTop));
        break;

      case "left":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - gap;
        transform = "translate(-100%, -50%)";

        // Clamp Vertical for Left/Right placement
        const minCenterY = boxHeight / 2 + padding;
        const maxCenterY = viewportHeight - boxHeight / 2 - padding;
        top = Math.max(minCenterY, Math.min(top, maxCenterY));

        // Horizontal Clamp / Flip
        if (left - boxWidth < padding) {
          // Flip to right
          left = targetRect.right + gap;
          transform = "translate(0, -50%)";
        }
        break;

      case "right":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + gap;
        transform = "translate(0, -50%)";

        // Clamp Vertical for Left/Right placement
        const minCenterYRight = boxHeight / 2 + padding;
        const maxCenterYRight = viewportHeight - boxHeight / 2 - padding;
        top = Math.max(minCenterYRight, Math.min(top, maxCenterYRight));

        // Horizontal Clamp / Flip
        if (left + boxWidth > viewportWidth - padding) {
          // Flip to left
          left = targetRect.left - gap;
          transform = "translate(-100%, -50%)";
        }
        break;
    }

    return { top, left, transform };
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none transition-opacity duration-300 ease-in-out opacity-100">
      {/* Highlighting Cutout Layer */}
      {targetRect && (
        <div
          className="absolute rounded-lg border-2 border-indigo-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none transition-all duration-300 ease-in-out"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tutorial Box */}
      <div
        className="absolute w-full h-full pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute bg-white rounded-xl shadow-2xl p-5 w-[400px] max-w-[90vw] border border-slate-200 transition-all duration-300 ease-out tour-overlay-container"
          style={getPopoverStyle() as any}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
                Bước {currentStep + 1}/{steps.length}
              </span>
              <h3 className="text-lg font-bold text-slate-800 mt-2">
                {step.title}
              </h3>
            </div>
            <button
              onClick={closeTour}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <p className="text-slate-600 text-sm mb-6 leading-relaxed whitespace-pre-line">
            {step.description}
          </p>

          {/* Footer / Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeTour}
              className="text-slate-500 hover:text-slate-700"
            >
              Bỏ qua
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Tiếp theo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={closeTour}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Hoàn thành
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
