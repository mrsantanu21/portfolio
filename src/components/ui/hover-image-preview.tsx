"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface HoverImagePreviewContextValue {
  showPreview: (src: string, alt?: string, event?: React.MouseEvent) => void;
  hidePreview: () => void;
  updateCoordinates: (clientX: number, clientY: number) => void;
}

export const HoverPreviewContext = React.createContext<HoverImagePreviewContextValue | null>(null);

export interface HoverImagePreviewProps {
  className?: string;
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
  lerpFactor?: number;
}

/**
 * Reusable Hover Image Preview Popover (React)
 * Renders a fixed floating preview container that lerps toward the cursor.
 */
export const HoverImagePreview: React.FC<HoverImagePreviewProps> = ({
  className = "",
  offsetX = 24,
  offsetY = 24,
  width = 280,
  height = 190,
  lerpFactor = 0.14,
}) => {
  const [imageState, setImageState] = useState<{ src: string; alt: string; visible: boolean }>({
    src: "",
    alt: "",
    visible: false,
  });

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const calculateTarget = useCallback(
    (clientX: number, clientY: number) => {
      let x = clientX + offsetX;
      let y = clientY + offsetY;

      if (typeof window !== "undefined") {
        if (x + width > window.innerWidth - 16) {
          x = clientX - width - offsetX;
        }
        if (y + height > window.innerHeight - 16) {
          y = clientY - height - offsetY;
        }
      }
      return { x, y };
    },
    [offsetX, offsetY, width, height]
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = () => {
      if (!popoverRef.current) return;

      if (prefersReducedMotion) {
        currentPos.current = targetPos.current;
      } else {
        currentPos.current.x += (targetPos.current.x - currentPos.current.x) * lerpFactor;
        currentPos.current.y += (targetPos.current.y - currentPos.current.y) * lerpFactor;
      }

      popoverRef.current.style.transform = `translate3d(${currentPos.current.x.toFixed(2)}px, ${currentPos.current.y.toFixed(2)}px, 0)`;

      const dist = Math.hypot(
        targetPos.current.x - currentPos.current.x,
        targetPos.current.y - currentPos.current.y
      );

      if (imageState.visible || dist > 0.5) {
        rafId.current = requestAnimationFrame(render);
      } else {
        rafId.current = null;
      }
    };

    if (imageState.visible && rafId.current === null) {
      rafId.current = requestAnimationFrame(render);
    }

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [imageState.visible, lerpFactor]);

  // Global mousemove tracker when active
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !imageState.visible) return;
      targetPos.current = calculateTarget(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [imageState.visible, calculateTarget]);

  return (
    <div
      ref={popoverRef}
      aria-hidden="true"
      className={`cursor-image-preview ${imageState.visible ? "is-active" : ""} ${className}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {imageState.src && (
        <img
          src={imageState.src}
          alt={imageState.alt}
          className="cursor-image-preview__image"
        />
      )}
    </div>
  );
};

export default HoverImagePreview;
