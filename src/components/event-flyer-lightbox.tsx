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
/** 1x fit uses this fraction of the (full-viewport) stage: ~95vw x ~95vh. */
const FIT_FRACTION = 0.95;
/**
 * Side gutter (px) the floating chrome needs (title pill left, button cluster
 * right). If the 95% fit leaves narrower gutters, the fit also keeps clear of
 * the top chrome band (and an equal bottom band for the hint) instead.
 */
const CHROME_GUTTER_MIN = 160;

type Size = { w: number; h: number };

/**
 * 1x layout size: object-contain fit of the natural image into ~95% of the
 * stage (the stage is the whole viewport), no fixed px cap, and never above
 * natural size (no upscaling). `chromeH` is the measured top-chrome height.
 */
function fitSize(natural: Size, stage: Size, chromeH: number): Size {
  if (natural.w <= 0 || natural.h <= 0 || stage.w <= 0 || stage.h <= 0) {
    return { w: 0, h: 0 };
  }
  const contain = (maxW: number, maxH: number): Size => {
    if (maxW <= 0 || maxH <= 0) return { w: 0, h: 0 };
    // Cap at 1: never upscale a small flyer at 1x (zoom may still go past natural).
    const k = Math.min(1, maxW / natural.w, maxH / natural.h);
    return { w: natural.w * k, h: natural.h * k };
  };
  const full = contain(stage.w * FIT_FRACTION, stage.h * FIT_FRACTION);
  if ((stage.w - full.w) / 2 >= CHROME_GUTTER_MIN) return full;
  // Narrow side gutters (portrait / phone): stay between the chrome bands.
  return contain(
    stage.w * FIT_FRACTION,
    Math.min(stage.h * FIT_FRACTION, stage.h - 2 * chromeH),
  );
}

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
  /** Natural image size and stage size → 1x fit (layout) size. */
  const [natural, setNatural] = useState<Size | null>(null);
  const [stageSize, setStageSize] = useState<Size | null>(null);
  const [chromeH, setChromeH] = useState(64);
  const chromeRef = useRef<HTMLDivElement>(null);
  const base =
    natural && stageSize
      ? fitSize(natural, stageSize, chromeH)
      : { w: 0, h: 0 };
  /** Side gutter at 1x; when wide enough the title pill lives in it. */
  const gutter = stageSize ? (stageSize.w - base.w) / 2 : 0;
  const titleInGutter = base.w > 0 && gutter >= CHROME_GUTTER_MIN;
  const sized = base.w > 0 && base.h > 0;

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{
    dist: number;
    scale: number;
    /** Pinch center relative to stage center at pinch start. */
    cx: number;
    cy: number;
    tx: number;
    ty: number;
  } | null>(null);
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
  /** Scale before the first click of a (possible) double-click. */
  const preClickScaleRef = useRef(MIN_SCALE);

  const scaleRef = useRef(scale);
  const txRef = useRef(tx);
  const tyRef = useRef(ty);
  scaleRef.current = scale;
  txRef.current = tx;
  tyRef.current = ty;
  const baseRef = useRef(base);
  baseRef.current = base;

  const clampScale = (n: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));

  /** Keep the zoomed image covering the stage (no panning into the void). */
  const clampPan = useCallback((nextScale: number, x: number, y: number) => {
    const stage = stageRef.current;
    const b = baseRef.current;
    if (!stage || nextScale <= MIN_SCALE || b.w <= 0) return { x: 0, y: 0 };
    const limX = Math.max(0, (b.w * nextScale - stage.clientWidth) / 2);
    const limY = Math.max(0, (b.h * nextScale - stage.clientHeight) / 2);
    return {
      x: Math.min(limX, Math.max(-limX, x)),
      y: Math.min(limY, Math.max(-limY, y)),
    };
  }, []);

  /** Point (client coords) → offset from the stage center. */
  const toStageCenter = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const r = stage.getBoundingClientRect();
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  }, []);

  /**
   * Zoom so the image point under `focal` (offset from stage center)
   * stays under it. Omit focal to zoom around the stage center.
   */
  const applyZoom = useCallback(
    (
      next: number,
      focal?: { x: number; y: number },
      from?: { scale: number; tx: number; ty: number },
    ) => {
      const s0 = from?.scale ?? scaleRef.current;
      const tx0 = from?.tx ?? txRef.current;
      const ty0 = from?.ty ?? tyRef.current;
      const s1 = clampScale(next);
      const f = focal ?? { x: 0, y: 0 };
      const k = s1 / s0;
      const pan = clampPan(s1, f.x - (f.x - tx0) * k, f.y - (f.y - ty0) * k);
      scaleRef.current = s1;
      txRef.current = pan.x;
      tyRef.current = pan.y;
      setScale(s1);
      setTx(pan.x);
      setTy(pan.y);
    },
    [clampPan],
  );

  const zoomBy = useCallback(
    (delta: number) => applyZoom(scaleRef.current + delta),
    [applyZoom],
  );

  const zoomTo = useCallback(
    (next: number, focal?: { x: number; y: number }) => applyZoom(next, focal),
    [applyZoom],
  );

  /** Track stage size (1x fit depends on it); re-clamp pan on resize. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      setStageSize({ w: el.clientWidth, h: el.clientHeight });
      if (chromeRef.current) setChromeH(chromeRef.current.offsetHeight);
    };
    measure();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const pan = clampPan(scaleRef.current, txRef.current, tyRef.current);
    if (pan.x !== txRef.current) setTx(pan.x);
    if (pan.y !== tyRef.current) setTy(pan.y);
  }, [base.w, base.h, clampPan]);

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
      applyZoom(
        scaleRef.current + delta,
        toStageCenter(e.clientX, e.clientY),
      );
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [applyZoom, toStageCenter]);

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
      const c = toStageCenter(
        (pts[0].x + pts[1].x) / 2,
        (pts[0].y + pts[1].y) / 2,
      );
      pinchStart.current = {
        dist,
        scale: scaleRef.current,
        cx: c.x,
        cy: c.y,
        tx: txRef.current,
        ty: tyRef.current,
      };
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
      const p = pinchStart.current;
      if (p.dist > 0) {
        // Zoom toward the pinch center; moving the center also pans.
        const c = toStageCenter(
          (pts[0].x + pts[1].x) / 2,
          (pts[0].y + pts[1].y) / 2,
        );
        const s1 = clampScale(p.scale * (dist / p.dist));
        const k = s1 / p.scale;
        const pan = clampPan(s1, c.x - (p.cx - p.tx) * k, c.y - (p.cy - p.ty) * k);
        scaleRef.current = s1;
        txRef.current = pan.x;
        tyRef.current = pan.y;
        setScale(s1);
        setTx(pan.x);
        setTy(pan.y);
      }
      return;
    }

    if (dragStart.current && scaleRef.current > MIN_SCALE) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const pan = clampPan(
        scaleRef.current,
        dragStart.current.tx + dx,
        dragStart.current.ty + dy,
      );
      txRef.current = pan.x;
      tyRef.current = pan.y;
      setTx(pan.x);
      setTy(pan.y);
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

  const onStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Image handlers stopPropagation — this only runs for dark-stage hits.
    if (e.target !== e.currentTarget) return;
    beginPointer(e, { onBackdrop: true, captureEl: e.currentTarget });
  };

  const onImagePointerDown = (e: ReactPointerEvent<HTMLImageElement>) => {
    e.stopPropagation();
    // Capture on the image itself (not the stage): the pointer stays bound to
    // the flyer while panning, and click/dblclick still target the image so
    // click-zoom and double-click zoom fire (capturing on the stage retargeted
    // them to the stage in Chromium). A drag released over the dark stage
    // therefore never produces a backdrop click.
    beginPointer(e, { onBackdrop: false, captureEl: e.currentTarget });
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
      className="fixed inset-0 z-[100] bg-navy/95 text-cream"
      onKeyDown={onDialogKeyDown}
    >
      <p id={labelId} className="sr-only">
        Event flyer: {title}
      </p>

      {/*
        Floating chrome over the full-viewport stage (no opaque band, so the
        ~95vh flyer isn't covered). The bar itself is click-through; only the
        title pill and buttons take pointer events.
      */}
      <div
        ref={chromeRef}
        data-lightbox-chrome
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-3 py-3 sm:px-5"
      >
        <p
          className="pointer-events-auto min-w-0 truncate rounded-full bg-navy/85 px-3 py-1.5 font-display text-sm font-semibold text-gold-light shadow-md backdrop-blur-sm sm:text-base"
          style={titleInGutter ? { maxWidth: `${Math.max(0, gutter - 32)}px` } : undefined}
        >
          {title}
        </p>
        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
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
        className="absolute inset-0 z-10 flex touch-none items-center justify-center overflow-hidden"
        onClick={onBackdropClick}
        onPointerDown={onStagePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {/*
          Sharp zoom: no CSS scaling transform or layer hint (Chromium rasterizes the
          layer at 1x and upscales → blurry). Zoom sets the real layout
          width/height (1x fit × scale) so the full-res src is decoded and
          rasterized at the zoomed size; pan is translate-only.
        */}
        <img
          data-lightbox-image
          src={src}
          alt={`Flyer for ${title}`}
          draggable={false}
          decoding="async"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              setNatural({ w: img.naturalWidth, h: img.naturalHeight });
            }
          }}
          ref={(img) => {
            // Cached images may finish before React attaches onLoad.
            if (img && img.complete && img.naturalWidth > 0 && !natural) {
              setNatural({ w: img.naturalWidth, h: img.naturalHeight });
            }
          }}
          className={`shrink-0 select-none object-contain shadow-[var(--shadow-elevated)] ${
            sized ? "max-h-none max-w-none" : "max-h-[95vh] max-w-[95vw]"
          } ${panning ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
          style={
            sized
              ? {
                  width: `${base.w * scale}px`,
                  height: `${base.h * scale}px`,
                  transform: tx || ty ? `translate(${tx}px, ${ty}px)` : undefined,
                }
              : undefined
          }
          onPointerDown={onImagePointerDown}
          onPointerMove={onImagePointerMove}
          onPointerUp={onImagePointerUp}
          onPointerCancel={onImagePointerUp}
          onClick={(e) => {
            e.stopPropagation();
            // Only the first click of a double-click records the pre-zoom scale.
            if (e.detail <= 1) preClickScaleRef.current = scale;
            if (suppressClickRef.current || gesture.current?.moved) {
              suppressClickRef.current = false;
              gesture.current = null;
              return;
            }
            gesture.current = null;
            if (scale <= MIN_SCALE) {
              zoomTo(scale + ZOOM_STEP, toStageCenter(e.clientX, e.clientY));
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            // Decide on the scale before the dblclick's first click, which
            // already stepped 1x → 1.25x.
            if (preClickScaleRef.current > MIN_SCALE) {
              zoomTo(MIN_SCALE);
            } else {
              zoomTo(2, toStageCenter(e.clientX, e.clientY));
            }
          }}
        />
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 py-2 text-center text-[0.7rem] text-cream/60 sm:text-xs">
        Scroll or use +/− to zoom · drag to pan · Esc or backdrop to close
      </p>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
