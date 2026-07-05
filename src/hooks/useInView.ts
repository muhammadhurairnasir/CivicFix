'use client';

import { useEffect, useRef } from 'react';

/**
 * Lightweight IntersectionObserver hook.
 * Adds `in-view` class to every element with `civic-animate`
 * found inside the container ref, once it scrolls into view.
 *
 * Usage: attach `ref` to the section wrapper.
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  threshold = 0.12,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const targets = container.querySelectorAll<HTMLElement>('.civic-animate');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold },
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

/**
 * Hook for animating SLA bars when they scroll into view.
 * Adds `.in-view` to `.sla-bar` elements and sets `--sla-width`.
 */
export function useSLABars<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const bars = container.querySelectorAll<HTMLElement>('.sla-bar');
    if (!bars.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bars.forEach((bar) => {
              bar.classList.add('in-view');
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * Hook that adds `.in-view` to `.stat-value` children with a stagger.
 */
export function useStatReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const values = container.querySelectorAll<HTMLElement>('.stat-value');
    if (!values.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            values.forEach((el, i) => {
              setTimeout(() => {
                el.classList.add('in-view');

                const targetAttr = el.getAttribute('data-target');
                if (targetAttr) {
                  const targetVal = parseFloat(targetAttr);
                  const suffix = el.getAttribute('data-suffix') || '';
                  const prefix = el.getAttribute('data-prefix') || '';
                  const duration = 2000;
                  const start = performance.now();

                  const step = (now: number) => {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
                    const current = Math.floor(ease * targetVal);

                    el.innerText = prefix + current.toLocaleString() + suffix;

                    if (progress < 1) {
                      requestAnimationFrame(step);
                    } else {
                      el.innerText = prefix + targetVal.toLocaleString() + suffix;
                    }
                  };
                  requestAnimationFrame(step);
                }
              }, i * 80);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * Adds `.navbar-scrolled` class to the element when window scrolls past 10px.
 */
export function useNavbarScroll<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      el.classList.toggle('navbar-scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return ref;
}
