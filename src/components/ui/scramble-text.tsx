import React, { useEffect, useRef, useMemo } from 'react';
import { TextScrambler, ScrambleOptions } from '@/lib/scramble-text';

export interface ScrambleTextProps extends React.HTMLAttributes<HTMLElement> {
  children?: string;
  text?: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  delay?: number;
  scrambleSpeed?: number;
  trigger?: 'viewport' | 'load' | 'hover' | 'manual';
  characterSet?: string;
  preserveSpaces?: boolean;
  preserveCasing?: boolean;
  once?: boolean;
  onComplete?: () => void;
}

/**
 * ScrambleText
 *
 * High-performance, accessible text scramble / character-reveal component.
 * Guaranteed:
 * - Semantic text in .sr-only is always 100% pure and accessible.
 * - Visual scramble only occurs in an aria-hidden presentation node.
 * - Respects prefers-reduced-motion.
 * - Deterministic, bounded lifecycle.
 */
export const ScrambleText: React.FC<ScrambleTextProps> = ({
  children,
  text,
  as: Component = 'span',
  className = '',
  duration,
  delay = 0,
  scrambleSpeed = 42,
  trigger = 'load',
  characterSet,
  preserveSpaces = true,
  preserveCasing = true,
  once = true,
  onComplete,
  ...restProps
}) => {
  const content = useMemo(() => text ?? children ?? '', [text, children]);
  const containerRef = useRef<HTMLElement | null>(null);
  const scramblerRef = useRef<TextScrambler | null>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    scramblerRef.current = new TextScrambler(containerRef.current, {
      duration,
      delay,
      scrambleSpeed,
      trigger,
      characterSet,
      preserveSpaces,
      preserveCasing,
      once,
      onComplete,
    });

    return () => {
      scramblerRef.current?.destroy();
      scramblerRef.current = null;
    };
  }, [content, duration, delay, scrambleSpeed, trigger, characterSet, preserveSpaces, preserveCasing, once, onComplete]);

  return (
    <Component
      ref={containerRef}
      className={`scramble-text ${className}`.trim()}
      {...restProps}
    >
      <span className="sr-only">{content}</span>
      <span aria-hidden="true" className="scramble-display">{content}</span>
    </Component>
  );
};

export default ScrambleText;
