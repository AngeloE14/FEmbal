// ===== CERTIFICATE MODULE =====
// Firma digital propia con Pointer Events. El canvas trabaja a devicePixelRatio
// para que la firma se vea nítida en preview y PDF, y exporta PNG transparente.

import { memo, useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type SignaturePadProps = {
  onSignatureChange: (signatureDataUrl: string) => void;
};

type Point = {
  x: number;
  y: number;
};

const getCanvasPoint = (canvas: HTMLCanvasElement, event: ReactPointerEvent<HTMLCanvasElement>): Point => {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

const getContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('No se pudo inicializar el área de firma.');
  }

  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#111111';

  return context;
};

const exportTrimmedTransparentPng = (canvas: HTMLCanvasElement) => {
  const context = getContext(canvas);
  const { height, width } = canvas;
  const pixels = context.getImageData(0, 0, width, height);
  const data = pixels.data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return '';
  }

  const padding = Math.ceil((window.devicePixelRatio || 1) * 10);
  const exportX = Math.max(0, minX - padding);
  const exportY = Math.max(0, minY - padding);
  const exportWidth = Math.min(width - exportX, maxX - minX + padding * 2);
  const exportHeight = Math.min(height - exportY, maxY - minY + padding * 2);
  const output = document.createElement('canvas');

  output.width = exportWidth;
  output.height = exportHeight;
  output
    .getContext('2d')
    ?.drawImage(canvas, exportX, exportY, exportWidth, exportHeight, 0, 0, exportWidth, exportHeight);

  return output.toDataURL('image/png');
};

export const SignaturePad = memo(function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const onSignatureChangeRef = useRef(onSignatureChange);

  useEffect(() => {
    onSignatureChangeRef.current = onSignatureChange;
  }, [onSignatureChange]);

  const syncCanvasResolution = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const previousSignature = hasInkRef.current ? exportTrimmedTransparentPng(canvas) : '';
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));

    const context = getContext(canvas);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineWidth = 2.15;

    if (previousSignature) {
      const image = new Image();
      image.onload = () => {
        const targetWidth = Math.min(rect.width * 0.82, image.width / ratio);
        const targetHeight = (image.height / image.width) * targetWidth;
        context.drawImage(image, 20, rect.height - targetHeight - 20, targetWidth, targetHeight);
        onSignatureChangeRef.current(exportTrimmedTransparentPng(canvas));
      };
      image.src = previousSignature;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    syncCanvasResolution();
    const resizeObserver = new ResizeObserver(syncCanvasResolution);
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [syncCanvasResolution]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    hasInkRef.current = true;
    lastPointRef.current = getCanvasPoint(canvas, event);

    const context = getContext(canvas);
    context.beginPath();
    context.arc(lastPointRef.current.x, lastPointRef.current.y, 1.08, 0, Math.PI * 2);
    context.fillStyle = '#111111';
    context.fill();
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas || !isDrawingRef.current || !lastPointRef.current) {
      return;
    }

    event.preventDefault();
    const nextPoint = getCanvasPoint(canvas, event);
    const context = getContext(canvas);

    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
    lastPointRef.current = nextPoint;
  }, []);

  const stopDrawing = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
    onSignatureChangeRef.current(hasInkRef.current ? exportTrimmedTransparentPng(canvas) : '');
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    getContext(canvas).clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
    lastPointRef.current = null;
    onSignatureChangeRef.current('');
  }, []);

  return (
    <div className="certificate-signature-field">
      <div className="certificate-signature-canvas-wrap">
        <canvas
          ref={canvasRef}
          aria-label="Área de firma digital"
          className="certificate-signature-canvas"
          onPointerCancel={stopDrawing}
          onPointerDown={handlePointerDown}
          onPointerLeave={stopDrawing}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
        />
      </div>
      <button className="certificate-secondary-action" type="button" onClick={handleClear}>
        Limpiar firma
      </button>
    </div>
  );
});
