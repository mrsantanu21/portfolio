/**
 * Reusable Cursor-Tracking Image Preview Popover
 * Vanilla TypeScript/JavaScript module
 */

export interface HoverImagePreviewOptions {
  triggerSelector?: string;
  containerId?: string;
  offsetX?: number;
  offsetY?: number;
  lerpFactor?: number; // 0.1 to 0.25 for buttery smooth tracking
  className?: string;
}

export class HoverImagePreview {
  private container: HTMLDivElement | null = null;
  private imgElement: HTMLImageElement | null = null;
  private triggerSelector: string;
  private offsetX: number;
  private offsetY: number;
  private lerpFactor: number;
  private className: string;

  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;

  private isVisible = false;
  private rafId: number | null = null;
  private popoverWidth = 280;
  private popoverHeight = 190;
  private isDestroyed = false;

  constructor(options: HoverImagePreviewOptions = {}) {
    this.triggerSelector = options.triggerSelector ?? '[data-preview-src]';
    this.offsetX = options.offsetX ?? 24;
    this.offsetY = options.offsetY ?? 24;
    this.lerpFactor = options.lerpFactor ?? 0.14;
    this.className = options.className ?? 'cursor-image-preview';

    this.initDOM(options.containerId ?? 'cursor-image-preview-root');
    this.bindEvents();
  }

  private initDOM(containerId: string) {
    if (typeof document === 'undefined') return;

    let existing = document.getElementById(containerId) as HTMLDivElement | null;
    if (!existing) {
      existing = document.createElement('div');
      existing.id = containerId;
      existing.className = this.className;
      existing.setAttribute('aria-hidden', 'true');

      const img = document.createElement('img');
      img.className = `${this.className}__image`;
      img.alt = 'Preview';

      existing.appendChild(img);
      document.body.appendChild(existing);
    }

    this.container = existing;
    this.imgElement = existing.querySelector('img');
  }

  private bindEvents() {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (isTouchDevice) return;

    // Track cursor coordinates globally
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !this.isVisible) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Smart boundary detection: flip if overflowing screen edge
      let desiredX = e.clientX + this.offsetX;
      let desiredY = e.clientY + this.offsetY;

      if (desiredX + this.popoverWidth > viewportWidth - 16) {
        desiredX = e.clientX - this.popoverWidth - this.offsetX;
      }

      if (desiredY + this.popoverHeight > viewportHeight - 16) {
        desiredY = e.clientY - this.popoverHeight - this.offsetY;
      }

      this.targetX = desiredX;
      this.targetY = desiredY;

      if (prefersReducedMotion) {
        this.currentX = this.targetX;
        this.currentY = this.targetY;
        this.updatePosition();
      }
    };

    // Event delegation for text links
    const onPointerEnter = (e: Event) => {
      const target = (e.target as HTMLElement).closest(this.triggerSelector) as HTMLElement | null;
      if (!target || !this.container || !this.imgElement) return;

      const src = target.getAttribute('data-preview-src');
      if (!src) return;

      const alt = target.getAttribute('data-preview-alt') || 'Preview';
      this.imgElement.src = src;
      this.imgElement.alt = alt;

      // Measure dimensions
      const rect = this.container.getBoundingClientRect();
      if (rect.width > 0) this.popoverWidth = rect.width;
      if (rect.height > 0) this.popoverHeight = rect.height;

      // Initialize position directly at mouse if first open
      if (!this.isVisible) {
        const mouseEvt = e as MouseEvent;
        this.targetX = mouseEvt.clientX + this.offsetX;
        this.targetY = mouseEvt.clientY + this.offsetY;
        this.currentX = this.targetX;
        this.currentY = this.targetY;
        this.updatePosition();
      }

      this.isVisible = true;
      this.container.classList.add('is-active');
      this.startLoop();
    };

    const onPointerLeave = (e: Event) => {
      const target = (e.target as HTMLElement).closest(this.triggerSelector);
      if (!target || !this.container) return;

      this.isVisible = false;
      this.container.classList.remove('is-active');
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseover', onPointerEnter, { passive: true });
    document.addEventListener('mouseout', onPointerLeave, { passive: true });
  }

  private startLoop() {
    if (this.rafId !== null) return;

    const render = () => {
      if (this.isDestroyed) return;

      // Smooth lerp (linear interpolation)
      this.currentX += (this.targetX - this.currentX) * this.lerpFactor;
      this.currentY += (this.targetY - this.currentY) * this.lerpFactor;

      this.updatePosition();

      // Continue animating while visible or moving towards resting point
      const dist = Math.hypot(this.targetX - this.currentX, this.targetY - this.currentY);
      if (this.isVisible || dist > 0.5) {
        this.rafId = requestAnimationFrame(render);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(render);
  }

  private updatePosition() {
    if (!this.container) return;
    this.container.style.transform = `translate3d(${this.currentX.toFixed(2)}px, ${this.currentY.toFixed(2)}px, 0)`;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
