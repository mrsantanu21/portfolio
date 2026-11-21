"use client";

import { AnimatedBorder } from "@/components/ui/animated-border";

export default function AvailabilityBadge() {
  return (
    <AnimatedBorder
      duration={4.5}
      color="#46a758"
      width={1.2}
      className="rounded-full"
      contentClassName="bg-[var(--pill-bg)] backdrop-blur-md"
    >
      <a
        href="#contact"
        className="pill availability-pill !border-0 !bg-transparent !shadow-none gap-2 px-3.5"
        aria-label="Open to work — jump to contact"
      >
        <span className="status-dot" aria-hidden="true"></span>
        <span>Open to work</span>
      </a>
    </AnimatedBorder>
  );
}
