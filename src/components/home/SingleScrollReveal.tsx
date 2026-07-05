'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface SceneConfig {
  before: string;
  after:  string;
  tag:    string;
  title:  string;
  type:   'wipe' | 'fade';
}

interface Props {
  scene:   SceneConfig;
}

export function SingleScrollReveal({ scene }: Props) {
  const outerRef   = useRef<HTMLDivElement>(null);
  const stickyRef  = useRef<HTMLDivElement>(null);

  const beforeWrapRef = useRef<HTMLDivElement>(null);
  const wipeRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer  = outerRef.current;
    const sticky = stickyRef.current;
    if (!outer || !sticky) return;

    // Show initial states
    if (beforeWrapRef.current) beforeWrapRef.current.style.opacity = '1';

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger:       outer,
        start:         'top top',
        end:           'bottom bottom',
        pin:           sticky,
        pinSpacing:    false,
        scrub:         1.8, // Buttery smooth Apple-like inertia
        onUpdate: (self) => {
          // Progress 0→1 through this specific scene
          const progress = self.progress;
          const bWrap    = beforeWrapRef.current;
          const wipe     = wipeRef.current;

          if (bWrap) {
            if (scene.type === 'wipe') {
              // GPU accelerated wipe: crop from bottom up
              bWrap.style.clipPath = `inset(0 0 ${progress * 100}% 0)`;
              bWrap.style.opacity = '1';
            } else {
              // Fade: before fades out
              bWrap.style.clipPath = 'none';
              // Fade out from 10% to 90% of scroll progress
              const alpha = Math.max(0, Math.min(1, 1 - ((progress - 0.1) / 0.8)));
              bWrap.style.opacity = String(alpha);
            }
          }

          if (wipe) {
            if (scene.type === 'wipe') {
              const mid = progress > 0.03 && progress < 0.97;
              wipe.style.opacity = mid ? '1' : '0';
              wipe.style.transform = `translateY(-${progress * 100}vh)`;
            } else {
              wipe.style.opacity = '0';
            }
          }
        },
      });
    }, outerRef);

    return () => ctx.revert();
  }, [scene.type]);

  return (
    /* Outer container defines scroll duration. 100vh = 1 viewport height of scrolling */
    <div ref={outerRef} style={{ height: '150vh' }} className="relative z-[60] cursor-none" data-cursor="scroll">
      
      {/* Sticky viewport frame */}
      <div
        ref={stickyRef}
        className="relative h-screen w-full overflow-hidden"
        style={{
          top: 0,
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 5vh, black 95vh, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5vh, black 95vh, transparent 100%)',
        }}
      >
        <div className="absolute inset-0">
          {/* AFTER image — base layer */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scene.after}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* BEFORE image — wipes/fades away */}
          <div
            ref={beforeWrapRef}
            className="absolute inset-x-0 top-0 overflow-hidden"
            style={{ height: '100%', willChange: 'clip-path, opacity' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scene.before}
              alt=""
              className="absolute left-0 top-0 h-[100vh] w-[100vw] object-cover object-center"
            />
          </div>
        </div>

        {/* ── Wipe divider line (only visible if type === wipe) ── */}
        <div
          ref={wipeRef}
          className="pointer-events-none absolute inset-x-0 z-30"
          style={{ bottom: 0, opacity: 0, transition: 'opacity 200ms ease', willChange: 'transform, opacity' }}
        >
          <div className="h-px w-full bg-white/70" />
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#fff]">Before</span>
            <span className="h-3 w-px bg-white/30" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#fff]">After</span>
          </div>
        </div>

        {/* ── Strong bottom vignette for text legibility ── */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-80"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 40%, transparent 100%)',
          }}
        />

        {/* ── Scene label ── */}
        <div className="absolute bottom-16 left-8 z-30 sm:left-14">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#fff]/80"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
          >
            {scene.tag}
          </p>
          <h2
            className="text-3xl font-bold tracking-tight text-[#fff] sm:text-4xl md:text-5xl"
            style={{ textShadow: '0 2px 18px rgba(0,0,0,0.95)' }}
          >
            {scene.title}
          </h2>
        </div>

      </div>
    </div>
  );
}
