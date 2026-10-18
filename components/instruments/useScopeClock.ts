'use client';

import { useEffect, useRef, useState } from 'react';

/** Visual animation time, not acquisition time. Paused parameter edits still redraw. */
export function useScopeClock() {
  const ref = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const respectPreference = () => { if (preference.matches) setRunning(false); };
    respectPreference();
    preference.addEventListener('change', respectPreference);
    return () => preference.removeEventListener('change', respectPreference);
  }, []);
  useEffect(() => {
    if (!running) return;
    let frame = 0, previous = 0, lastDraw = 0, visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (ref.current) observer.observe(ref.current);
    const animate = (now: number) => {
      if (!visible || document.hidden) { previous = now; lastDraw = now; }
      if (now - lastDraw >= 1000 / 30) {
        const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
        setSeconds((time) => time + delta);
        previous = now;
        lastDraw = now;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [running]);
  return { ref, seconds, running, toggle: () => setRunning((value) => !value) };
}
