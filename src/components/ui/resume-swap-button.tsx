"use client";

import { AnimatedBorder } from "@/components/ui/animated-border";
import { RandomLetterSwap } from "@/registry/default/motion/random-letter-swap";

export default function ResumeSwapButton() {
  return (
    <AnimatedBorder
      duration={5}
      color="var(--accent)"
      width={1.5}
      className="rounded-full shadow-sm hover:scale-[1.02] transition-transform duration-200"
      contentClassName="bg-[var(--pill-bg)] backdrop-blur-md"
    >
      <a
        href="/resume.pdf"
        download="Santanu_Dey_Resume.pdf"
        target="_blank"
        rel="noreferrer"
        className="pill resume-swap-pill group !border-0 !bg-transparent !shadow-none"
        aria-label="Download Santanu Dey Resume"
      >
        <RandomLetterSwap
          label="Download Resume"
          reverse={false}
          staggerDuration={0.02}
          transition={{ duration: 0.55, type: "spring" }}
        />
        <span className="pill-arrow transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true">↓</span>
      </a>
    </AnimatedBorder>
  );
}
