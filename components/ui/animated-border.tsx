"use client";

import React, { useMemo, useState, useEffect, useRef, type ComponentProps, type Ref } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedBorderProps extends ComponentProps<"div"> {
  duration?: number;
  color?: string;
  width?: number;
  contentClassName?: string;
}

export function AnimatedBorder({
  duration = 6,
  color = "var(--accent)",
  width = 1.5,
  className,
  contentClassName,
  style,
  children,
  ...props
}: AnimatedBorderProps) {
  const [inView, setInView] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: "80px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      data-slot="animated-border"
      className={cn("relative isolate overflow-hidden rounded-full border border-transparent", className)}
      style={{ padding: width, ...style }}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="animated-border-light"
        className="pointer-events-none absolute top-1/2 left-1/2 -mt-[150%] -ml-[150%] aspect-square w-[300%] animate-spin motion-reduce:animate-none will-change-transform"
        style={{
          animationDuration: `${duration}s`,
          animationPlayState: inView ? "running" : "paused",
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 300deg, ${color} 360deg)`,
        }}
      />
      <div
        data-slot="animated-border-content"
        className={cn("relative h-full w-full rounded-[inherit] bg-background text-foreground transition-colors", contentClassName)}
      >
        {children}
      </div>
    </div>
  );
}

export default AnimatedBorder;
