'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const text = textRef.current;
    if (!cursor || !text) return;

    // Use GSAP quickTo for highly performant following
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });

    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);

      // Check if hovering an element with data-cursor="scroll"
      const target = e.target as HTMLElement;
      const scrollTarget = target.closest('[data-cursor="scroll"]');

      if (scrollTarget && !isVisible) {
        isVisible = true;
        gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 });
      } else if (!scrollTarget && isVisible) {
        isVisible = false;
        gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.3 });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[100] flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 opacity-0 transform scale-0"
    >
      <span ref={textRef} className="text-[11px] font-black uppercase tracking-widest text-white">
        Scroll
      </span>
    </div>
  );
}
