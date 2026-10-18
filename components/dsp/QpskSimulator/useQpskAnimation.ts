import { useEffect, useRef } from 'react';
import type { CanvasSize, QpskSimConfig } from './types';
import { drawConstellation, drawTimeDomain } from './qpskRenderer';
import { constellationSamples, createSimulationState, stepSimulation } from './qpskSimulation';

interface UseQpskAnimationProps {
  timeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  constCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: QpskSimConfig;
}

function syncCanvasSize(canvas: HTMLCanvasElement | null): CanvasSize {
  if (!canvas) return { w: 0, h: 0 };
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return { w: 0, h: 0 };
  const targetW = Math.round(rect.width * dpr);
  const targetH = Math.round(rect.height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

function startAnimation(
  timeCanvas: HTMLCanvasElement | null, constCanvas: HTMLCanvasElement | null,
  configRef: React.RefObject<QpskSimConfig>,
): () => void {
  const state = createSimulationState();
  let timeSize: CanvasSize;
  let constSize: CanvasSize;
  let frameId = 0;
  let lastTime: number | undefined;
  const resize = () => {
    timeSize = syncCanvasSize(timeCanvas);
    constSize = syncCanvasSize(constCanvas);
  };
  const render = (now: number) => {
    const config = configRef.current;
    stepSimulation(state, config, lastTime === undefined ? 0 : (now - lastTime) / 1000);
    lastTime = now;
    const timeCtx = timeCanvas?.getContext('2d');
    const constCtx = constCanvas?.getContext('2d');
    if (timeCtx && timeSize.w > 0) {
      drawTimeDomain(timeCtx, timeSize.w, timeSize.h, config, state.timeOffset);
    }
    if (constCtx && constSize.w > 0) {
      const samples = constellationSamples(state.noise, config.dibits, config.noiseLevel);
      drawConstellation(constCtx, constSize.w, constSize.h, config, samples);
    }
    frameId = requestAnimationFrame(render);
  };
  resize();
  const observer = new ResizeObserver(resize);
  if (timeCanvas) observer.observe(timeCanvas);
  if (constCanvas) observer.observe(constCanvas);
  window.addEventListener('resize', resize);
  frameId = requestAnimationFrame(render);
  return () => {
    cancelAnimationFrame(frameId);
    observer.disconnect();
    window.removeEventListener('resize', resize);
  };
}

export function useQpskAnimation({ timeCanvasRef, constCanvasRef, config }: UseQpskAnimationProps) {
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => startAnimation(timeCanvasRef.current, constCanvasRef.current, configRef),
    [timeCanvasRef, constCanvasRef]);
}
