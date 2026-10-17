import { useEffect, useRef } from 'react';
import type { CanvasSize, Point2D, QpskSimConfig } from './types';
import { gaussianRandom, mapDibit } from './qpskMath';
import { drawConstellation, drawTimeDomain } from './qpskRenderer';

interface UseQpskAnimationProps {
  timeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  constCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: QpskSimConfig;
}

interface AnimationState {
  timeOffset: number;
  historyXY: Point2D[];
  noiseBuffer: Float32Array;
  timeSize: CanvasSize;
  constSize: CanvasSize;
  config: QpskSimConfig;
}

const NOISE_BUFFER_LEN = 1200;

function fillNoiseBuffer(buf: Float32Array): void {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = gaussianRandom();
  }
}

function syncCanvasSize(canvas: HTMLCanvasElement | null): CanvasSize {
  if (!canvas) return { w: 0, h: 0 };
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return { w: 0, h: 0 };

  const targetW = Math.round(rect.width * dpr);
  const targetH = Math.round(rect.height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

function updateHistoryPoints(
  historyXY: Point2D[],
  config: QpskSimConfig,
  cx: number,
  cy: number,
  radius: number,
): void {
  config.dibits.forEach((dibit) => {
    const { I, Q } = mapDibit(dibit);
    const noisyI = I * Math.SQRT1_2 + gaussianRandom() * config.noiseLevel;
    const noisyQ = Q * Math.SQRT1_2 + gaussianRandom() * config.noiseLevel;
    historyXY.push({
      x: cx + noisyI * radius,
      y: cy - noisyQ * radius,
    });
  });

  if (historyXY.length > 240) {
    historyXY.splice(0, historyXY.length - 240);
  }
}

function executeFrame(
  tCanvas: HTMLCanvasElement | null,
  cCanvas: HTMLCanvasElement | null,
  state: AnimationState,
): void {
  const { config, historyXY, noiseBuffer, timeSize, constSize } = state;

  if (config.running) {
    state.timeOffset += 0.03 * config.scrollSpeed;
    fillNoiseBuffer(noiseBuffer);
    if (constSize.w > 0 && constSize.h > 0) {
      const cx = constSize.w / 2;
      const cy = constSize.h / 2;
      const radius = Math.min(constSize.w, constSize.h) * 0.35;
      updateHistoryPoints(historyXY, config, cx, cy, radius);
    }
  }

  if (tCanvas && timeSize.w > 0 && timeSize.h > 0) {
    const tCtx = tCanvas.getContext('2d');
    if (tCtx) {
      drawTimeDomain(tCtx, timeSize.w, timeSize.h, config, state.timeOffset, noiseBuffer);
    }
  }

  if (cCanvas && constSize.w > 0 && constSize.h > 0) {
    const cCtx = cCanvas.getContext('2d');
    if (cCtx) {
      drawConstellation(cCtx, constSize.w, constSize.h, config, historyXY);
    }
  }
}

export function useQpskAnimation({
  timeCanvasRef,
  constCanvasRef,
  config,
}: UseQpskAnimationProps) {
  const animRef = useRef<AnimationState>({
    timeOffset: 0,
    historyXY: [],
    noiseBuffer: new Float32Array(NOISE_BUFFER_LEN),
    timeSize: { w: 0, h: 0 },
    constSize: { w: 0, h: 0 },
    config,
  });

  animRef.current.config = config;

  useEffect(() => {
    fillNoiseBuffer(animRef.current.noiseBuffer);
    let frameId = 0;

    const handleResize = () => {
      animRef.current.timeSize = syncCanvasSize(timeCanvasRef.current);
      animRef.current.constSize = syncCanvasSize(constCanvasRef.current);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    if (observer) {
      if (timeCanvasRef.current) observer.observe(timeCanvasRef.current);
      if (constCanvasRef.current) observer.observe(constCanvasRef.current);
    }

    const renderLoop = () => {
      executeFrame(timeCanvasRef.current, constCanvasRef.current, animRef.current);
      frameId = requestAnimationFrame(renderLoop);
    };
    frameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [timeCanvasRef, constCanvasRef]);
}
