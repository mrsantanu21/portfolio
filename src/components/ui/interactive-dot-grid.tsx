"use client";

import React, { useEffect, useRef } from "react";

export interface InteractiveDotGridProps {
  className?: string;
  spacing?: number;
  dotRadius?: number;
  dotColor?: string;
  darkDotColor?: string;
}

/**
 * InteractiveDotGrid
 * High-performance HTML5 Canvas 2D interactive dot-grid background
 * inspired by Lucas Lima (https://www.lucaslima.design/about).
 *
 * Features:
 * - Single-path batched rendering for silky 60-120fps performance
 * - Smoothstep (t * t * (3 - 2 * t)) cursor repulsion falloff within 300px
 * - Maximum displacement of ~12.5px
 * - Animated pointer press / release wave deformation within 375px
 * - Dynamic scroll offset calculation: -(window.scrollY % 50)
 * - DevicePixelRatio scaling with context.setTransform
 * - Zero React state updates on pointermove (uses refs & local variables)
 * - Automatic pause/sleep when idle or tab hidden
 * - Full prefers-reduced-motion and touch device accessibility
 */
export const InteractiveDotGrid: React.FC<InteractiveDotGridProps> = ({
  className = "interactive-dot-grid",
  spacing = 50,
  dotRadius = 1,
  dotColor = "rgba(17, 17, 16, 0.15)",
  darkDotColor = "rgba(255, 255, 255, 0.12)",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouchOnly = !window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

    // Interaction variables (kept in refs/closure, no React state re-renders)
    let mouseX = -9999;
    let mouseY = -9999;
    let isHovering = false;

    // Pointer press animation state
    let isPressed = false;
    let pressStrength = 0; // 0 to 1
    let pressStartTime = 0;
    let releaseStartTime = 0;
    let pressStartStrength = 0;
    let releaseStartStrength = 0;
    const PRESS_DURATION = 250; // ms
    const RELEASE_DURATION = 600; // ms

    // Rendering control
    let rafId: number | null = null;
    let isDirty = true;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Ease-out cubic interpolation
    const easeOut = (t: number) => {
      const p = Math.max(0, Math.min(1, t));
      return 1 - Math.pow(1 - p, 3);
    };

    // Resize canvas with DPR support
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      isDirty = true;
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    // Pointer event listeners (only mouse)
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      isHovering = true;
      isDirty = true;
    };

    const handlePointerLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      isHovering = false;
      if (isPressed) {
        isPressed = false;
        releaseStartTime = performance.now();
        releaseStartStrength = pressStrength;
      }
      isDirty = true;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      isPressed = true;
      pressStartTime = performance.now();
      pressStartStrength = pressStrength;
      isDirty = true;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      isPressed = false;
      releaseStartTime = performance.now();
      releaseStartStrength = pressStrength;
      isDirty = true;
    };

    const handleScroll = () => {
      isDirty = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    if (!isTouchOnly && !prefersReducedMotion) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("pointerleave", handlePointerLeave, { passive: true });
      window.addEventListener("pointerdown", handlePointerDown, { passive: true });
      window.addEventListener("pointerup", handlePointerUp, { passive: true });
    }

    // Main render loop using requestAnimationFrame
    const render = (currentTime: number) => {
      // Animate press / release strength
      let isPressAnimating = false;
      if (isPressed) {
        const elapsed = currentTime - pressStartTime;
        const progress = Math.min(1, elapsed / PRESS_DURATION);
        pressStrength =
          pressStartStrength + (1 - pressStartStrength) * easeOut(progress);
        if (progress < 1) {
          isPressAnimating = true;
          isDirty = true;
        }
      } else if (pressStrength > 0) {
        const elapsed = currentTime - releaseStartTime;
        const progress = Math.min(1, elapsed / RELEASE_DURATION);
        pressStrength =
          releaseStartStrength * (1 - easeOut(progress));
        if (progress < 1) {
          isPressAnimating = true;
          isDirty = true;
        } else {
          pressStrength = 0;
        }
      }

      // Check theme color
      const isDark = document.documentElement.classList.contains("dark");
      const activeColor = isDark ? darkDotColor : dotColor;

      // Draw only when frame is dirty or animating
      if (isDirty || isPressAnimating || isHovering) {
        ctx.clearRect(0, 0, width, height);

        // Calculate vertical grid offset matching reference: -(scrollY % 50)
        const scrollOffset = -(window.scrollY % spacing);

        ctx.beginPath();

        const INFLUENCE_RADIUS = 300;
        const PRESS_RADIUS = 375;
        const MAX_DISPLACEMENT = 12.5;

        // Iterate through grid points
        for (let x = 0; x <= width + spacing; x += spacing) {
          for (
            let y = scrollOffset;
            y <= height + spacing;
            y += spacing
          ) {
            let finalX = x;
            let finalY = y;

            if (!prefersReducedMotion && !isTouchOnly && isHovering) {
              const dx = x - mouseX;
              const dy = y - mouseY;
              const dist = Math.hypot(dx, dy);

              // 1. Cursor Hover Repulsion (within 300px)
              if (dist < INFLUENCE_RADIUS && dist > 0.001) {
                // Smoothstep falloff: t * t * (3 - 2 * t) where t = 1 - (dist / radius)
                const t = 1 - dist / INFLUENCE_RADIUS;
                const smoothstep = t * t * (3 - 2 * t);
                const disp = smoothstep * MAX_DISPLACEMENT;

                finalX += (dx / dist) * disp;
                finalY += (dy / dist) * disp;
              }

              // 2. Pointer Press Wave Deformation (within 375px)
              if (pressStrength > 0.001 && dist < PRESS_RADIUS && dist > 0.001) {
                const normDist = dist / PRESS_RADIUS;
                // Wave impulse: gentle radial oscillation pulling inward/outward
                const wave = Math.sin(normDist * Math.PI * 2) * (1 - normDist);
                const pressDisp = wave * pressStrength * 8.5;

                finalX += (dx / dist) * pressDisp;
                finalY += (dy / dist) * pressDisp;
              }
            }

            // Batch all circular dots into one continuous path
            ctx.moveTo(finalX + dotRadius, finalY);
            ctx.arc(finalX, finalY, dotRadius, 0, Math.PI * 2);
          }
        }

        ctx.fillStyle = activeColor;
        ctx.fill();

        // If not actively animating press or hovering, mark clean to save battery
        if (!isPressAnimating && !isHovering) {
          isDirty = false;
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    // Pause RAF loop when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        isDirty = true;
        rafId = requestAnimationFrame(render);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup every listener and frame on unmount
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [spacing, dotRadius, dotColor, darkDotColor]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

export default InteractiveDotGrid;
