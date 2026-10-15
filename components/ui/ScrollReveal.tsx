'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Progressive enhancement: content stays visible without JS or IntersectionObserver. */
export function ScrollReveal({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches || !('IntersectionObserver' in window)) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, index) => {
            const animation = entry.target.animate(
              [
                { opacity: 0.25, translate: '0 22px' },
                { opacity: 1, translate: '0 0' },
              ],
              { duration: 650, delay: Math.min(index, 3) * 65, easing: 'cubic-bezier(.22,1,.36,1)' },
            );
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
            observer.unobserve(entry.target);
          });
      },
      { threshold: 0.12 },
    );
    root.current?.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    const stop = () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
    media.addEventListener('change', stop);
    return () => {
      stop();
      media.removeEventListener('change', stop);
    };
  }, []);
  return <div ref={root}>{children}</div>;
}
