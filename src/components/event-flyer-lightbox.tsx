import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.25;
const WHEEL_FACTOR = 0.0015;
/** Ignore backdrop-close / click-zoom if pointer moved more than this (px). */
const MOVE_CLOSE_THRESHOLD = 8;

type EventFlyerThumbProps = {
  src: string;
  title: string;
  className?: string;
  imgClassName?: string;
};

/**
 * Clickable event flyer preview. Opens a full-screen zoomable lightbox.
 * Use only when the event has an imageUrl (e.g. /uploads/events/...).
 * Crops anchor to top (object-top) so the flyer header stays visible (HOPE-12).
 */
export function EventFlyerThumb({
  src,
  title,
  className,
  imgClassName,
}: EventFlyerThumbProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "group relative block w-full cursor-zoom-in overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        }
        aria-label={`View flyer: ${title}`}
      >
        <img
          src={src}
          alt=""
          className={
            imgClassName ??
            "aspect-[21/9] w-full object-cover object-top transition duration-200 group-hover:brightness-95 sm:aspect-[3/1]"
          }
          loading="lazy"
          decoding="async"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gold-light shadow-md backdrop-blur-sm">
          <ZoomIn className="size-3.5" aria-hidden />
          View flyer
        </span>
      </button>
      {open ? (
        <EventFlyerLightbox
          src={src}
          title={title}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

type LightboxProps = {
  src: string;
  title: string;
  onClose: () => void;
};

function EventFlyerLightbox({ src, title, onClose }: LightboxProps) {
  const labelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null,
  );
  /**
   * Tracks the active pointer gesture for backdrop-close gating.
   * After pan-when-zoomed, the flyer translates under the cursor so the
   * synthetic click often lands on the dark stage — that must not close.
   */
  const gesture = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
    /** True only when pointerdown landed on the dark stage (not the flyer). */
    onBackdrop: boolean;
  } | null>(null);
  /** Sticky: last gesture was a drag/pinch — suppress the following click. */
  const suppressClickRef = useRef(false);

  const scaleRef = useRef(scale);
  const txRef = useRef(tx);
  const tyRef = useRef(ty);
  scaleRef.current = scale;
  txRef.current = tx;
  tyRef.current = ty;

  const clampScale = (n: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));

  const resetPanIfNeeded = useCallback((nextScale: number) => {
    if (nextScale <= MIN_SCALE) {
      setTx(0);
      setTy(0);
    }
  }, []);

  const zoomBy = useCallback(
    (delta: number) => {
      setScale((s) => {
        const next = clampScale(s + delta);
        resetPanIfNeeded(next);
        return next;
      });
    },
    [resetPanIfNeeded],
  );

  const zoomTo = useCallback(
    (next: number) => {
      const clamped = clampScale(next);
      setScale(clamped);
      resetPanIfNeeded(clamped);
    },
    [resetPanIfNeeded],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * WHEEL_FACTOR * scaleRef.current;
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scaleRef.current + delta),
      );
      setScale(next);
      if (next <= MIN_SCALE) {
        setTx(0);
        setTy(0);
      }
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  const markMovedIfNeeded = (clientX: number, clientY: number) => {
    const g = gesture.current;
    if (!g || g.moved) return;
    if (Math.hypot(clientX - g.startX, clientY - g.startY) > MOVE_CLOSE_THRESHOLD) {
      g.moved = true;
      suppressClickRef.current = true;
    }
  };

  const beginPointer = (
    e: ReactPointerEvent,
    opts: { onBackdrop: boolean; captureEl: HTMLElement },
  ) => {
    if ((e.target as HTMLElement).closest("[data-lightbox-chrome]")) return;

    suppressClickRef.current = false;
    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      onBackdrop: opts.onBackdrop,
    };

    opts.captureEl.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { dist, scale: scaleRef.current };
      dragStart.current = null;
      suppressClickRef.current = true;
      if (gesture.current) gesture.current.moved = true;
    } else if (pointers.current.size === 1 && scaleRef.current > MIN_SCALE) {
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: txRef.current,
        ty: tyRef.current,
      };
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    markMovedIfNeeded(e.clientX, e.clientY);

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStart.current.dist > 0) {
        const ratio = dist / pinchStart.current.dist;
        zoomTo(pinchStart.current.scale * ratio);
      }
      return;
    }

    if (dragStart.current && scaleRef.current > MIN_SCALE) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTx(dragStart.current.tx + dx);
      setTy(dragStart.current.ty + dy);
    }
  };

  const endPointer = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
    if (pointers.current.size === 1 && scaleRef.current > MIN_SCALE) {
      const remaining = [...pointers.current.entries()][0];
      if (remaining) {
        dragStart.current = {
          x: remaining[1].x,
          y: remaining[1].y,
          tx: txRef.current,
          ty: tyRef.current,
        };
      }
    }
  };

  /**
   * Close only on a real backdrop tap: down+up on the dark stage with
   * movement under MOVE_CLOSE_THRESHOLD. Never close after a pan drag
   * or a gesture that started on the flyer image.
   */
  const onBackdropClick = (e: ReactMouseEvent) => {
    if (e.target !== e.currentTarget) return;

    const g = gesture.current;
    const suppress =
      suppressClickRef.current ||
      Boolean(g?.moved) ||
      Boolean(g && !g.onBackdrop);

    gesture.current = null;
    suppressClickRef.current = false;

    if (suppress) return;
    onClose();
  };

  const onStagePointerDown = (e: ReactPointerEvent) => {
    // Image handlers stopPropagation — this only runs for dark-stage hits.
    if (e.target !== e.currentTarget) return;
    beginPointer(e, { onBackdrop: true, captureEl: e.currentTarget });
  };

  const onImagePointerDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    const stage = stageRef.current;
    if (!stage) return;
    beginPointer(e, { onBackdrop: false, captureEl: stage });
  };

  const onImagePointerMove = (e: ReactPointerEvent) => {
    e.stopPropagation();
    onPointerMove(e);
  };

  const onImagePointerUp = (e: ReactPointerEvent) => {
    e.stopPropagation();
    endPointer(e);
  };

  const onDialogKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Tab") {
      const root = e.currentTarget;
      const focusables = root.querySelectorAll<HTMLElement>(
        "button:not([disabled])",
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const canZoomOut = scale > MIN_SCALE + 0.01;
  const canZoomIn = scale < MAX_SCALE - 0.01;
  const panning = scale > MIN_SCALE;

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      aria-label={`Event flyer: ${title}`}
      className="fixed inset-0 z-[100] flex flex-col bg-navy/95 text-cream"
      onKeyDown={onDialogKeyDown}
    >
      <p id={labelId} className="sr-only">
        Event flyer: {title}
      </p>

      <div
        data-lightbox-chrome
        className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-gold/20 bg-navy/90 px-3 py-3 sm:px-5"
      >
        <p className="min-w-0 truncate font-display text-sm font-semibold text-gold-light sm:text-base">
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            data-lightbox-chrome
            onClick={() => zoomBy(-ZOOM_STEP)}
            disabled={!canZoomOut}
            className="inline-flex size-10 items-center justify-center rounded-full border border-gold/40 bg-navy text-gold-light transition hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            data-lightbox-chrome
            onClick={() => zoomBy(ZOOM_STEP)}
            disabled={!canZoomIn}
            className="inline-flex size-10 items-center justify-center rounded-full border border-gold/40 bg-navy text-gold-light transition hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-5" aria-hidden />
          </button>
          <button
            ref={closeRef}
            type="button"
            data-lightbox-chrome
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full border border-gold/40 bg-navy text-gold-light transition hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Close flyer"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative z-10 flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden"
        onClick={onBackdropClick}
        onPointerDown={onStagePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <img
          data-lightbox-image
          src={src}
          alt={`Flyer for ${title}`}
          draggable={false}
          className={`max-h-[min(92vh,900px)] max-w-[min(96vw,1100px)] select-none object-contain shadow-[var(--shadow-elevated)] ${
            panning ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
          style={{
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
          onPointerDown={onImagePointerDown}
          onPointerMove={onImagePointerMove}
          onPointerUp={onImagePointerUp}
          onPointerCancel={onImagePointerUp}
          onClick={(e) => {
            e.stopPropagation();
            if (suppressClickRef.current || gesture.current?.moved) {
              suppressClickRef.current = false;
              gesture.current = null;
              return;
            }
            gesture.current = null;
            if (scale <= MIN_SCALE) zoomBy(ZOOM_STEP);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (scale > MIN_SCALE) {
              zoomTo(MIN_SCALE);
            } else {
              zoomTo(2);
            }
          }}
        />
      </div>

      <p className="relative z-20 shrink-0 px-4 py-2 text-center text-[0.7rem] text-cream/60 sm:text-xs">
        Scroll or use +/− to zoom · drag to pan · Esc or backdrop to close
      </p>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
