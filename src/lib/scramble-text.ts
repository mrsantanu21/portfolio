/**
 * Editorial Text Scramble & Character-Reveal Engine
 *
 * Designed specifically for subtle, restrained, editorial typography animations.
 *
 * Core guarantees:
 * 1. Semantic Integrity: The semantic DOM text is NEVER corrupted.
 *    Screen readers and crawlers ALWAYS see the clean, uncorrupted original text
 *    via an accessible wrapper, while the visual presentation runs in an aria-hidden container.
 * 2. Reduced Motion: When prefers-reduced-motion is active, animation is bypassed entirely
 *    and the exact final text is presented immediately.
 * 3. Bounded & Deterministic: Progressive left-to-right resolve with bounded duration (400-600ms).
 *    Always resolves 100% deterministically to the original text.
 * 4. Restrained Aesthetic: Clean alphanumeric glyph set without aggressive cyberpunk/glitch symbols.
 * 5. Lifecycle Safety: Full cleanup of requestAnimationFrame, observers, and timers on destroy.
 */

export interface ScrambleOptions {
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

// Restrained, subtle editorial character sets (clean letters and numbers, no aggressive noisy symbols)
const EDITORIAL_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const EDITORIAL_LOWER = 'abcdefghijkmnpqrstuvwxyz23456789';

export function getEditorialGlyph(
  targetChar: string,
  options: { preserveSpaces?: boolean; preserveCasing?: boolean; characterSet?: string } = {}
): string {
  const { preserveSpaces = true, preserveCasing = true, characterSet } = options;

  if (preserveSpaces && (targetChar === ' ' || targetChar === '\t' || targetChar === '\n')) {
    return targetChar;
  }

  if (characterSet && characterSet.length > 0) {
    return characterSet[Math.floor(Math.random() * characterSet.length)];
  }

  if (preserveCasing) {
    if (/[A-Z]/.test(targetChar)) {
      return EDITORIAL_UPPER[Math.floor(Math.random() * EDITORIAL_UPPER.length)];
    }
    if (/[a-z]/.test(targetChar)) {
      return EDITORIAL_LOWER[Math.floor(Math.random() * EDITORIAL_LOWER.length)];
    }
    if (/[0-9]/.test(targetChar)) {
      return EDITORIAL_UPPER[Math.floor(Math.random() * 10)];
    }
    return targetChar;
  }

  const all = EDITORIAL_UPPER + EDITORIAL_LOWER;
  return all[Math.floor(Math.random() * all.length)];
}

export class TextScrambler {
  private element: HTMLElement;
  private visualNode: HTMLElement;
  private originalText: string;
  private options: Required<ScrambleOptions>;
  private rafId: number | null = null;
  private delayTimer: number | null = null;
  private observer: IntersectionObserver | null = null;
  private isRunning = false;
  private isDestroyed = false;
  private hasAnimated = false;
  private reduceMotion = false;

  constructor(element: HTMLElement, options: ScrambleOptions = {}) {
    this.element = element;
    this.originalText = element.textContent?.trim() || '';

    // Bounded, restrained duration (~480ms for short strings like names)
    const len = this.originalText.length;
    const defaultDuration = Math.min(Math.max(380 + len * 12, 450), 620);

    this.options = {
      duration: options.duration ?? defaultDuration,
      delay: options.delay ?? 0,
      scrambleSpeed: options.scrambleSpeed ?? 42, // ms between glyph flutters
      trigger: options.trigger ?? 'load',
      characterSet: options.characterSet ?? '',
      preserveSpaces: options.preserveSpaces ?? true,
      preserveCasing: options.preserveCasing ?? true,
      once: options.once ?? true,
      onComplete: options.onComplete ?? (() => {}),
    };

    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Build accessible DOM structure:
    // 1. A visually-hidden span holding the pure, uncorrupted semantic text for screen readers & SEO
    // 2. An aria-hidden span where the visual character resolve occurs
    this.element.innerHTML = '';

    const srSpan = document.createElement('span');
    srSpan.className = 'sr-only';
    srSpan.textContent = this.originalText;
    this.element.appendChild(srSpan);

    this.visualNode = document.createElement('span');
    this.visualNode.className = 'scramble-display';
    this.visualNode.setAttribute('aria-hidden', 'true');
    this.visualNode.textContent = this.originalText;
    this.element.appendChild(this.visualNode);

    // If reduced motion is requested, do not run animation at all
    if (this.reduceMotion) {
      return;
    }

    this.setupTrigger();
  }

  private setupTrigger() {
    if (this.reduceMotion) return;

    switch (this.options.trigger) {
      case 'load':
        if (this.options.delay > 0) {
          this.delayTimer = window.setTimeout(() => this.play(), this.options.delay);
        } else {
          this.play();
        }
        break;

      case 'hover':
        this.element.addEventListener('mouseenter', () => {
          if (!this.isRunning) {
            this.play();
          }
        });
        break;

      case 'manual':
        break;

      case 'viewport':
      default:
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (this.options.once && this.hasAnimated) return;

                if (this.options.delay > 0) {
                  this.delayTimer = window.setTimeout(() => this.play(), this.options.delay);
                } else {
                  this.play();
                }

                if (this.options.once && this.observer) {
                  this.observer.unobserve(entry.target);
                  this.observer.disconnect();
                  this.observer = null;
                }
              }
            });
          },
          { threshold: 0.15 }
        );
        this.observer.observe(this.element);
        break;
    }
  }

  public play() {
    if (this.isDestroyed || !this.originalText) return;

    if (this.reduceMotion) {
      this.resolveImmediately();
      return;
    }

    if (this.isRunning && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.isRunning = true;
    this.hasAnimated = true;

    const chars = this.originalText.split('');
    const totalLen = chars.length;
    const startTime = performance.now();
    const duration = this.options.duration;
    let lastGlitchTime = 0;
    const glitchInterval = this.options.scrambleSpeed;

    // Compact flutter window for a smooth, restrained sweep (2-3 characters)
    const windowSize = Math.max(Math.min(Math.floor(totalLen * 0.2), 3), 2);

    // Buffer initialized with current text
    const displayBuffer = [...chars];

    const frame = (now: number) => {
      if (this.isDestroyed) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Sweep progress mapped to global character index
      const targetIndex = Math.floor(progress * (totalLen + windowSize));
      const shouldFlutter = now - lastGlitchTime >= glitchInterval;
      if (shouldFlutter) {
        lastGlitchTime = now;
      }

      for (let i = 0; i < totalLen; i++) {
        const trueChar = chars[i];

        if (trueChar === ' ' || trueChar === '\t' || trueChar === '\n') {
          displayBuffer[i] = trueChar;
          continue;
        }

        if (i < targetIndex - windowSize) {
          // Locked permanently to original character
          displayBuffer[i] = trueChar;
        } else if (i <= targetIndex) {
          // Inside active resolution window: flutter lightly
          if (shouldFlutter) {
            displayBuffer[i] = getEditorialGlyph(trueChar, {
              preserveSpaces: this.options.preserveSpaces,
              preserveCasing: this.options.preserveCasing,
              characterSet: this.options.characterSet,
            });
          }
        } else {
          // Ahead of the sweep window: retain true char or brief flutter
          if (progress === 0 || shouldFlutter) {
            displayBuffer[i] = getEditorialGlyph(trueChar, {
              preserveSpaces: this.options.preserveSpaces,
              preserveCasing: this.options.preserveCasing,
              characterSet: this.options.characterSet,
            });
          }
        }
      }

      this.visualNode.textContent = displayBuffer.join('');

      if (progress < 1) {
        this.rafId = requestAnimationFrame(frame);
      } else {
        // Guarantee 100% exact match at finish
        this.resolveImmediately();
        this.isRunning = false;
        this.options.onComplete();
      }
    };

    this.rafId = requestAnimationFrame(frame);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public resolveImmediately() {
    if (this.visualNode) {
      this.visualNode.textContent = this.originalText;
    }
    this.isRunning = false;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.resolveImmediately();
  }
}

/**
 * Scan DOM for elements marked specifically for name scramble reveal.
 */
export function initNameScrambleElements(selector = '[data-scramble-name]'): TextScrambler[] {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  const scramblers: TextScrambler[] = [];

  elements.forEach((el) => {
    const delay = el.dataset.scrambleDelay ? Number(el.dataset.scrambleDelay) : 120;
    const trigger = (el.dataset.scrambleTrigger as ScrambleOptions['trigger']) || 'load';
    const duration = el.dataset.scrambleDuration ? Number(el.dataset.scrambleDuration) : 520;

    const scrambler = new TextScrambler(el, {
      delay,
      trigger,
      duration,
      once: true,
    });
    scramblers.push(scrambler);
  });

  return scramblers;
}
