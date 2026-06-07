// ===== CERTIFICATE MODULE =====
// Firma digital con renderizado fluido mediante coalesced events y caching del contexto 2D.

import { memo, useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useI18n } from '../../hooks/useI18n';

type SignaturePadProps = {
  onSignatureChange: (signatureDataUrl: string) => void;
};

type Point = {
  x: number;
  y: number;
};

const getCanvasPoint = (canvas: HTMLCanvasElement, clientX: number, clientY: number): Point => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

const setupContext = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) throw new Error('No se pudo inicializar el área de firma.');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111111';
  ctx.fillStyle = '#111111';
  return ctx;
};

const exportTrimmedTransparentPng = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return '';
  const { height, width } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height);
  const data = pixels.data;
  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) return '';

  const pad = Math.ceil((window.devicePixelRatio || 1) * 10);
  const ex = Math.max(0, minX - pad);
  const ey = Math.max(0, minY - pad);
  const ew = Math.min(width - ex, maxX - minX + pad * 2);
  const eh = Math.min(height - ey, maxY - minY + pad * 2);
  const out = document.createElement('canvas');
  out.width = ew;
  out.height = eh;
  out.getContext('2d')?.drawImage(canvas, ex, ey, ew, eh, 0, 0, ew, eh);
  return out.toDataURL('image/png');
};

export const SignaturePad = memo(function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const hasPointerCaptureRef = useRef(false);
  const rafRef = useRef(0);
  const pendingPointsRef = useRef<Point[]>([]);
  const onSignatureChangeRef = useRef(onSignatureChange);

  useEffect(() => {
    onSignatureChangeRef.current = onSignatureChange;
  }, [onSignatureChange]);

  const renderPendingPoints = useCallback(() => {
    const pts = pendingPointsRef.current;
    pendingPointsRef.current = [];
    const ctx = ctxRef.current;
    if (!ctx || pts.length === 0) return;

    const last = lastPointRef.current;
    if (!last) {
      // Primer punto → dibujar un punto
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, 1.08, 0, Math.PI * 2);
      ctx.fill();
      lastPointRef.current = pts[0];
      for (let i = 1; i < pts.length; i++) {
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        lastPointRef.current = pts[i];
      }
    } else {
      for (let i = 0; i < pts.length; i++) {
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        lastPointRef.current = pts[i];
        last.x = pts[i].x;
        last.y = pts[i].y;
      }
    }
  }, []);

  const queuePoint = useCallback((pt: Point) => {
    pendingPointsRef.current.push(pt);
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        renderPendingPoints();
      });
    }
  }, [renderPendingPoints]);

  const syncCanvasResolution = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const previousSignature = hasInkRef.current ? exportTrimmedTransparentPng(canvas) : '';
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));

    const ctx = setupContext(canvas);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.15;
    ctxRef.current = ctx;

    if (previousSignature) {
      const img = new Image();
      img.onload = () => {
        const tw = Math.min(rect.width * 0.82, img.width / ratio);
        const th = (img.height / img.width) * tw;
        ctx.drawImage(img, 20, rect.height - th - 20, tw, th);
        onSignatureChangeRef.current(exportTrimmedTransparentPng(canvas));
      };
      img.src = previousSignature;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    syncCanvasResolution();
    const ro = new ResizeObserver(syncCanvasResolution);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [syncCanvasResolution]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);
    hasPointerCaptureRef.current = true;
    isDrawingRef.current = true;
    hasInkRef.current = true;
    lastPointRef.current = null;
    pendingPointsRef.current = [];
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }

    const pt = getCanvasPoint(canvas, event.clientX, event.clientY);
    queuePoint(pt);
  }, [queuePoint]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Usar coalesced events si están disponibles (Chrome/Edge)
    const nativeEvent = (event as unknown as { nativeEvent: PointerEvent }).nativeEvent;
    if (nativeEvent && typeof nativeEvent.getCoalescedEvents === 'function') {
      const coalesced = nativeEvent.getCoalescedEvents();
      for (let i = 0; i < coalesced.length; i++) {
        const ce = coalesced[i];
        queuePoint(getCanvasPoint(canvas, ce.clientX, ce.clientY));
      }
    } else {
      queuePoint(getCanvasPoint(canvas, event.clientX, event.clientY));
    }
  }, [queuePoint]);

  const stopDrawing = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (hasPointerCaptureRef.current) {
      canvas.releasePointerCapture(event.pointerId);
      hasPointerCaptureRef.current = false;
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
    // Asegurar que los puntos pendientes se rendericen antes de exportar
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      renderPendingPoints();
    }
    onSignatureChangeRef.current(hasInkRef.current ? exportTrimmedTransparentPng(canvas) : '');
  }, [renderPendingPoints]);

  const handleClear = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
    lastPointRef.current = null;
    pendingPointsRef.current = [];
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    onSignatureChangeRef.current('');
  }, []);

  return (
    <div className="certificate-signature-field">
      <div className="certificate-signature-canvas-wrap">
        <canvas
          ref={canvasRef}
          aria-label={t('certificate.form.signature.area')}
          className="certificate-signature-canvas"
          onPointerCancel={stopDrawing}
          onPointerDown={handlePointerDown}
          onPointerLeave={stopDrawing}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
        />
      </div>
      <button className="certificate-secondary-action certificate-secondary-action--clear" type="button" onClick={handleClear}>
        {t('certificate.form.signature.clear')}
      </button>
    </div>
  );
});
