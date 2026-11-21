"use client";

import React, { useState } from "react";
import { motion, type Transition } from "framer-motion";

export interface RandomLetterSwapProps {
  label: string;
  reverse?: boolean;
  staggerDuration?: number;
  transition?: Transition;
  className?: string;
}

export function RandomLetterSwap({
  label,
  reverse = false,
  staggerDuration = 0.02,
  transition = { duration: 0.65, type: "spring" },
  className = "",
}: RandomLetterSwapProps) {
  const [isHovered, setIsHovered] = useState(false);

  const letters = Array.from(label);

  const containerVariants = {
    initial: {},
    hover: {
      transition: {
        staggerChildren: staggerDuration,
        staggerDirection: reverse ? -1 : 1,
      },
    },
  };

  const letterVariants = {
    initial: {
      y: 0,
      opacity: 1,
    },
    hover: {
      y: reverse ? ["0%", "100%", "-100%", "0%"] : ["0%", "-100%", "100%", "0%"],
      opacity: [1, 0, 0, 1],
      transition: transition,
    },
  };

  return (
    <motion.span
      className={`inline-flex overflow-hidden cursor-pointer select-none ${className}`}
      initial="initial"
      animate={isHovered ? "hover" : "initial"}
      variants={containerVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="inline-flex">
        {letters.map((char, idx) => (
          <span key={idx} className="relative inline-block overflow-hidden">
            <motion.span
              className="inline-block"
              variants={letterVariants}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          </span>
        ))}
      </span>
    </motion.span>
  );
}

export default RandomLetterSwap;
