"use client";

import React, { useState, useEffect } from "react";

export interface EditorialRowItem {
  id: string;
  number: string;
  category: string;
  title: string;
  primaryStack: string[];
  context: string;
  actionText: string;
  link: string;
}

export const defaultEditorialList: EditorialRowItem[] = [
  {
    id: "languages",
    number: "01",
    category: "SYS / RUNTIMES",
    title: "Languages & Runtimes",
    primaryStack: ["Python", "TypeScript", "JavaScript", "Java", "C/C++"],
    context:
      "Type-safe full-stack platforms, asynchronous microservices, algorithm design, and memory-efficient execution.",
    actionText: "EXPLORE ↗",
    link: "#skills",
  },
  {
    id: "frontend",
    number: "02",
    category: "CLIENT / INTERFACE",
    title: "Frontend Architecture",
    primaryStack: ["React 19", "Next.js", "Tailwind CSS", "Vite", "HTML5 Canvas 2D"],
    context:
      "Component-driven headless systems, interactive 2D canvas simulations, and responsive fluid typography scales.",
    actionText: "PROJECTS ↗",
    link: "#projects",
  },
  {
    id: "backend",
    number: "03",
    category: "SERVER / PROTOCOLS",
    title: "Backend & Distributed Systems",
    primaryStack: ["Node.js", "Express.js", "FastAPI", "RESTful APIs", "WebSockets"],
    context:
      "Event-driven endpoints, high-concurrency ticket reservations, real-time message streaming, and resilient middleware.",
    actionText: "PROJECTS ↗",
    link: "#projects",
  },
  {
    id: "ai-systems",
    number: "04",
    category: "AUTONOMY / INTELLIGENCE",
    title: "AI Agents & LLM Systems",
    primaryStack: ["Autonomous Agent Loops", "LangGraph", "Ollama", "ChromaDB", "Whisper STT", "RAG"],
    context:
      "Deterministic tool execution, multi-turn state graphs, vector retrieval over token corpora, and local offline inference.",
    actionText: "PROJECTS ↗",
    link: "#projects",
  },
  {
    id: "databases",
    number: "05",
    category: "STORAGE / CACHE",
    title: "Databases & Storage Engines",
    primaryStack: ["PostgreSQL", "Redis", "Prisma ORM", "SQLite", "Vector Databases"],
    context:
      "Normalized schema design, sub-45ms in-memory cache layers, connection pooling, and transactional ACID guarantees.",
    actionText: "EXPLORE ↗",
    link: "#skills",
  },
  {
    id: "devops",
    number: "06",
    category: "OPERATIONS / PIPELINE",
    title: "DevOps & Developer Tooling",
    primaryStack: ["Docker", "Git", "GitHub Actions", "Linux / Unix Shell", "Postman", "Antigravity"],
    context:
      "Reproducible container environments, automated linting/test workflows, API testing suites, and Unix shell automation.",
    actionText: "EXPLORE ↗",
    link: "#skills",
  },
  {
    id: "core-cs",
    number: "07",
    category: "FOUNDATIONS / THEORY",
    title: "Computer Science Foundations",
    primaryStack: ["Data Structures & Algorithms", "Operating Systems", "DBMS", "AST Parsing", "Reverse Engineering"],
    context:
      "Computational complexity, AST decompilation graphs, process scheduling, concurrency invariants, and binary analysis.",
    actionText: "PROOF ↗",
    link: "#education",
  },
];

export interface InteractiveRowListProps {
  items?: EditorialRowItem[];
  className?: string;
}

/**
 * Editorial Technical Stack Rows
 * Inspired by classic Swiss print design & architectural monographs:
 * - Bold, oversized print typography with clear numerical indexing (01-07)
 * - Spacious horizontal rows with generous whitespace
 * - Sharp horizontal dividers separating each discipline
 * - Subtle interactive hover states with sibling dimming
 * - Touch-safe and keyboard-accessible
 */
export const InteractiveRowList: React.FC<InteractiveRowListProps> = ({
  items = defaultEditorialList,
  className = "",
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isFinePointer, setIsFinePointer] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
      setIsFinePointer(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  const handleMouseEnter = (index: number) => {
    if (isFinePointer) setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    if (isFinePointer) setHoveredIndex(null);
  };

  return (
    <div
      className={`w-full border-t border-b border-[var(--hairline)] ${className}`}
      onMouseLeave={handleMouseLeave}
      role="list"
      aria-label="Editorial Technical Inventory"
    >
      {items.map((item, index) => {
        const isHovered = hoveredIndex === index;
        const isAnyHovered = hoveredIndex !== null;

        return (
          <a
            key={item.id}
            href={item.link}
            role="listitem"
            onMouseEnter={() => handleMouseEnter(index)}
            onFocus={() => handleMouseEnter(index)}
            onBlur={handleMouseLeave}
            className={`group relative block w-full text-left transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
              index !== items.length - 1 ? "border-b border-[var(--hairline)]" : ""
            } ${
              isAnyHovered && !isHovered
                ? "opacity-35 grayscale-[0.2]"
                : "opacity-100"
            }`}
          >
            {/* Subtle row highlight backdrop */}
            <div
              className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
                isHovered
                  ? "bg-[var(--row-hover-bg)]"
                  : "bg-transparent"
              }`}
            />

            {/* Sharp active accent indicator on the left border */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-200 ${
                isHovered
                  ? "bg-[var(--ink)] scale-y-100"
                  : "bg-transparent scale-y-0"
              }`}
            />

            <div className="relative px-4 sm:px-8 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Numerical Index & Category Marker */}
              <div className="lg:col-span-2 flex flex-col gap-1.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-mono text-2xl sm:text-3xl font-semibold tracking-tight transition-all duration-200 ${
                      isHovered
                        ? "text-[var(--ink)] translate-x-1"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {item.number}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)] tracking-widest uppercase">
                    / 07
                  </span>
                </div>
                <span className="text-[9.5px] font-mono font-semibold tracking-widest uppercase text-[var(--muted)]">
                  {item.category}
                </span>
              </div>

              {/* Title Section (Bold Oversized Typography) */}
              <div className="lg:col-span-4 flex flex-col gap-2">
                <h3
                  className={`font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl lg:text-[26px] font-medium tracking-[-0.035em] leading-tight transition-all duration-200 ${
                    isHovered
                      ? "text-[var(--ink)] translate-x-1.5"
                      : "text-[var(--ink)]"
                  }`}
                >
                  {item.title}
                </h3>
              </div>

              {/* Content: Stack Pills & Editorial Context */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {/* Tech Pills */}
                <div className="flex flex-wrap gap-2">
                  {item.primaryStack.map((tech) => (
                    <span
                      key={tech}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-tight border transition-colors duration-200 ${
                        isHovered
                          ? "bg-[var(--paper)] text-[var(--ink)] border-[var(--ink)]"
                          : "bg-[var(--row-hover-bg)] text-[var(--ink)] border-[var(--hairline)]"
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Editorial Context Description */}
                <p className="text-xs sm:text-[13px] leading-relaxed text-[var(--ink-secondary)] max-w-xl m-0 font-['DM_Sans',sans-serif]">
                  {item.context}
                </p>
              </div>

              {/* Action Indicator */}
              <div className="lg:col-span-1 flex lg:justify-end items-center self-center lg:self-start pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider transition-all duration-200 ${
                    isHovered
                      ? "text-[var(--ink)] translate-x-1"
                      : "text-[var(--muted)]"
                  }`}
                >
                  <span className="hidden sm:inline lg:hidden">{item.actionText}</span>
                  <span className="text-sm transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1">
                    ↗
                  </span>
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default InteractiveRowList;
