'use client';

import React, { useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface Hotspot {
  ward: string;
  total: number;
  criticalCount: number;
  highCount: number;
  unresolvedCount: number;
  hotspotScore: number;
}

interface HotspotMapProps {
  hotspots: Hotspot[];
  loading?: boolean;
}

// Determine color based on dominant severity
function getColor(h: Hotspot): string {
  if (h.criticalCount > 0) return '#ef4444';     // red
  if (h.highCount > 0)     return '#f97316';     // orange
  return '#eab308';                               // yellow
}

// Map score (0-∞) to circle radius (12-40px)
function getRadius(score: number, maxScore: number): number {
  if (maxScore === 0) return 16;
  return 12 + Math.round((score / maxScore) * 28);
}

// Fake ward → coordinates lookup — in a real system this would come from a geocoding service
// or be stored on the ward documents. We spread them around Nigeria for demo purposes.
const DEMO_COORDS: Record<string, [number, number]> = {
  'Ward 1': [6.455027, 3.384082],
  'Ward 2': [6.461927, 3.390982],
  'Ward 3': [6.448127, 3.377182],
  'Ward 4': [6.468827, 3.397882],
  'Ward 5': [6.442227, 3.371282],
  'Ward 6': [6.475727, 3.404782],
  'Ward 7': [6.435327, 3.364382],
  'Ward 8': [6.482627, 3.411682],
  'Ward 9': [6.428427, 3.357482],
  'Ward 10': [6.489527, 3.418582],
  'default': [6.5244, 3.3792],
};

export default function HotspotMap({ hotspots, loading }: HotspotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const L = require('leaflet');
    require('leaflet/dist/leaflet.css');

    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [6.5244, 3.3792],
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !hotspots.length) return;
    const L = require('leaflet');

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const maxScore = Math.max(...hotspots.map(h => h.hotspotScore), 1);

    hotspots.forEach((h, i) => {
      const coords = DEMO_COORDS[h.ward] || [
        DEMO_COORDS.default[0] + (Math.random() - 0.5) * 0.05,
        DEMO_COORDS.default[1] + (Math.random() - 0.5) * 0.05,
      ];
      const color = getColor(h);
      const radius = getRadius(h.hotspotScore, maxScore);

      const circle = L.circleMarker(coords, {
        radius,
        fillColor: color,
        fillOpacity: 0.45,
        color,
        weight: 2,
        opacity: 0.8,
      }).addTo(mapInstance.current);

      circle.bindPopup(`
        <div style="font-family:system-ui;padding:4px 0">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px">${h.ward}</div>
          <table style="border-collapse:collapse;font-size:12px;color:#334155">
            <tr><td style="padding:1px 12px 1px 0;color:#64748b">Total Reports</td><td style="font-weight:600">${h.total}</td></tr>
            <tr><td style="padding:1px 12px 1px 0;color:#64748b">Unresolved</td><td style="font-weight:600;color:#dc2626">${h.unresolvedCount}</td></tr>
            <tr><td style="padding:1px 12px 1px 0;color:#64748b">Critical</td><td style="font-weight:600">${h.criticalCount}</td></tr>
            <tr><td style="padding:1px 12px 1px 0;color:#64748b">Hotspot Score</td><td style="font-weight:600">${h.hotspotScore.toFixed(1)}</td></tr>
          </table>
        </div>
      `, { maxWidth: 220 });

      markersRef.current.push(circle);
    });
  }, [hotspots]);

  if (loading) {
    return <Skeleton className="w-full h-[400px] rounded-b-xl" />;
  }

  return (
    <div ref={mapRef} className="w-full h-[400px] rounded-b-xl z-0" />
  );
}
