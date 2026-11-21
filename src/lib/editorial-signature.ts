/**
 * Editorial Signature & Dynamic Footer Controller
 * Provides:
 * 1. Live dynamic IST clock (Intl.DateTimeFormat)
 * 2. Curtain reveal on scroll with staggered character emergence
 * 3. 60fps liquid magnetic character displacement on pointermove (fine pointers)
 * 4. Full accessibility and prefers-reduced-motion handling
 */

export interface EditorialSignatureOptions {
  containerId?: string;
  nameSelector?: string;
  timeSelector?: string;
}

export class EditorialSignature {
  private container: HTMLElement | null = null;
  private nameContainer: HTMLElement | null = null;
  private timeElement: HTMLElement | null = null;
  private charElements: HTMLElement[] = [];
  private clockInterval: number | null = null;
  private rafId: number | null = null;
  private observer: IntersectionObserver | null = null;

  private isFinePointer = false;
  private reduceMotion = false;
  private mouseX = -9999;
  private mouseY = -9999;
  private isHovering = false;

  // Spring/lerp state for each character
  private charStates: Array<{
    currentX: number;
    currentY: number;
    targetX: number;
    targetY: number;
    currentScale: number;
    targetScale: number;
  }> = [];

  constructor(options: EditorialSignatureOptions = {}) {
    const containerId = options.containerId ?? 'contact';
    this.container = document.getElementById(containerId) || document.getElementById('editorial-footer');
    if (!this.container) return;

    this.nameContainer = this.container.querySelector(options.nameSelector ?? '.signature-display-title');
    this.timeElement = this.container.querySelector(options.timeSelector ?? '[data-live-time]');

    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    this.initClock();
    this.initTypography();
    this.initReveal();
    if (!this.reduceMotion && this.isFinePointer) {
      this.initPointerTracking();
    }
  }

  /**
   * Real-time dynamic Indian Standard Time (IST) clock
   */
  private initClock() {
    if (!this.timeElement) return;

    const updateTime = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        const formatted = formatter.format(now);
        if (this.timeElement) {
          this.timeElement.textContent = `TIME (IST): ${formatted}`;
        }
      } catch {
        // Fallback if timeZone formatting fails
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        if (this.timeElement) {
          this.timeElement.textContent = `TIME (IST): ${hours}:${mins}:${secs}`;
        }
      }
    };

    updateTime();
    this.clockInterval = window.setInterval(updateTime, 1000);
  }

  /**
   * Split characters into overflow-hidden curtain masks
   */
  private initTypography() {
    if (!this.nameContainer) return;

    const words = this.nameContainer.querySelectorAll<HTMLElement>('.signature-word');
    if (!words.length) return;

    let charIndex = 0;
    this.charElements = [];
    this.charStates = [];

    words.forEach((word) => {
      const rawText = word.getAttribute('data-word') || word.textContent?.trim() || '';
      word.innerHTML = '';

      for (let i = 0; i < rawText.length; i++) {
        const char = rawText[i];
        const mask = document.createElement('span');
        mask.className = 'sig-char-mask';
        mask.setAttribute('aria-hidden', 'true');

        const inner = document.createElement('span');
        inner.className = 'sig-char-inner';
        inner.textContent = char;
        // Staggered reveal delay: 25ms per letter
        inner.style.transitionDelay = `${charIndex * 0.024}s`;

        mask.appendChild(inner);
        word.appendChild(mask);

        this.charElements.push(inner);
        this.charStates.push({
          currentX: 0,
          currentY: 0,
          targetX: 0,
          targetY: 0,
          currentScale: 1,
          targetScale: 1,
        });

        charIndex++;
      }
    });
  }

  /**
   * Trigger the curtain rise when section scrolls into viewport
   */
  private initReveal() {
    if (!this.container) return;

    if (this.reduceMotion) {
      this.container.classList.add('is-revealed');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.container?.classList.add('is-revealed');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -4% 0px' }
    );

    this.observer.observe(this.container);
  }

  /**
   * Subtle hover-reactive magnetic displacement (60fps lerp loop)
   */
  private initPointerTracking() {
    if (!this.nameContainer) return;

    const onPointerMove = (e: PointerEvent) => {
      this.isHovering = true;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      if (!this.rafId) {
        this.rafId = requestAnimationFrame(this.renderLoop);
      }
    };

    const onPointerLeave = () => {
      this.isHovering = false;
      this.mouseX = -9999;
      this.mouseY = -9999;
    };

    this.nameContainer.addEventListener('pointermove', onPointerMove, { passive: true });
    this.nameContainer.addEventListener('pointerleave', onPointerLeave, { passive: true });
  }

  /**
   * RequestAnimationFrame animation loop
   */
  private renderLoop = () => {
    let hasMotion = false;
    const lerp = 0.14;
    const maxRadius = 180; // Interaction radius in pixels
    const maxDisplacementY = 8; // Max px lift
    const maxDisplacementX = 4; // Max px lateral nudge

    for (let i = 0; i < this.charElements.length; i++) {
      const el = this.charElements[i];
      const state = this.charStates[i];

      if (this.isHovering && this.mouseX > -1000) {
        const rect = el.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const charCenterY = rect.top + rect.height / 2;

        const dx = this.mouseX - charCenterX;
        const dy = this.mouseY - charCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist < maxRadius) {
          const force = (1 - dist / maxRadius);
          // Gently lift character up and slightly away from cursor
          state.targetY = -Math.sin(force * Math.PI * 0.5) * maxDisplacementY;
          state.targetX = (dx / maxRadius) * maxDisplacementX * force;
          state.targetScale = 1 + force * 0.04;
        } else {
          state.targetX = 0;
          state.targetY = 0;
          state.targetScale = 1;
        }
      } else {
        state.targetX = 0;
        state.targetY = 0;
        state.targetScale = 1;
      }

      // Smooth lerp
      state.currentX += (state.targetX - state.currentX) * lerp;
      state.currentY += (state.targetY - state.currentY) * lerp;
      state.currentScale += (state.targetScale - state.currentScale) * lerp;

      // Apply GPU-friendly transform if changed significantly
      const diffX = Math.abs(state.targetX - state.currentX);
      const diffY = Math.abs(state.targetY - state.currentY);
      const diffScale = Math.abs(state.targetScale - state.currentScale);

      if (diffX > 0.01 || diffY > 0.01 || diffScale > 0.001) {
        hasMotion = true;
        el.style.transform = `translate3d(${state.currentX.toFixed(2)}px, ${state.currentY.toFixed(2)}px, 0) scale(${state.currentScale.toFixed(3)})`;
      } else if (state.targetX === 0 && state.targetY === 0 && state.targetScale === 1 && state.currentY !== 0) {
        state.currentX = 0;
        state.currentY = 0;
        state.currentScale = 1;
        el.style.transform = '';
      }
    }

    if (hasMotion || this.isHovering) {
      this.rafId = requestAnimationFrame(this.renderLoop);
    } else {
      this.rafId = null;
    }
  };

  /**
   * Cleanup method to avoid memory leaks
   */
  public destroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export function initEditorialSignature(options?: EditorialSignatureOptions): EditorialSignature {
  return new EditorialSignature(options);
}
