"use client";

import React, { useEffect, useRef } from "react";

export interface InteractiveDotGridProps {
  className?: string;
  spacing?: number;
  dotRadius?: number;
  dotColor?: string;
  darkDotColor?: string;
}

export const InteractiveDotGrid: React.FC<InteractiveDotGridProps> = ({
  className = "interactive-dot-grid",
  spacing = 50,
  dotRadius = 1,
  dotColor = "rgb(50 50 50 / 0.35)",
  darkDotColor = "rgb(255 255 255 / 0.25)",
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

    let mouseX = -9999;
    let mouseY = -9999;
    let isHovering = false;

    let isPressed = false;
    let pressStrength = 0;
    let pressStartTime = 0;
    let releaseStartTime = 0;
    let pressStartStrength = 0;
    let releaseStartStrength = 0;
    const PRESS_DURATION = 250;
    const RELEASE_DURATION = 600;

    let rafId: number | null = null;
    let isDirty = true;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const easeOut = (t: number) => {
      const p = Math.max(0, Math.min(1, t));
      return 1 - Math.pow(1 - p, 3);
    };

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

    const render = (currentTime: number) => {
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

      const isDark = document.documentElement.classList.contains("dark");
      const activeColor = isDark ? darkDotColor : dotColor;

      if (isDirty || isPressAnimating || isHovering) {
        ctx.clearRect(0, 0, width, height);

        const scrollOffset = -(window.scrollY % spacing);

        ctx.beginPath();

        const INFLUENCE_RADIUS = 300;
        const PRESS_RADIUS = 375;
        const MAX_DISPLACEMENT = 12.5;

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

              if (dist < INFLUENCE_RADIUS && dist > 0.001) {
                const t = 1 - dist / INFLUENCE_RADIUS;
                const smoothstep = t * t * (3 - 2 * t);
                const disp = smoothstep * MAX_DISPLACEMENT;

                finalX += (dx / dist) * disp;
                finalY += (dy / dist) * disp;
              }

              if (pressStrength > 0.001 && dist < PRESS_RADIUS && dist > 0.001) {
                const normDist = dist / PRESS_RADIUS;
                const wave = Math.sin(normDist * Math.PI * 2) * (1 - normDist);
                const pressDisp = wave * pressStrength * 8.5;

                finalX += (dx / dist) * pressDisp;
                finalY += (dy / dist) * pressDisp;
              }
            }

            ctx.moveTo(finalX + dotRadius, finalY);
            ctx.arc(finalX, finalY, dotRadius, 0, Math.PI * 2);
          }
        }

        ctx.fillStyle = activeColor;
        ctx.fill();

        if (!isPressAnimating && !isHovering) {
          isDirty = false;
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

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
