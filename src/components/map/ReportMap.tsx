'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, LocateFixed, Layers } from 'lucide-react';
import Link from 'next/link';

// Custom CSS icons based on severity
const createSeverityIcon = (severity: string, isCluster = false, count = 1) => {
  // Marker colours map to locked status tokens (hex values used directly in innerHTML)
  let bgHex = '#4A9970'; // --status-resolved (low severity)
  if (severity === 'medium')  bgHex = '#C47A4A'; // --status-pending
  if (severity === 'high')    bgHex = '#C47A4A'; // --status-pending (nearest token; no orange token exists)
  if (severity === 'critical') bgHex = '#E53E3E'; // --status-critical

  const size = isCluster ? 40 : 28;
  const ringSize = isCluster ? 48 : 36;
  const innerText = isCluster ? count.toString() : '';

  const html = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${ringSize}px;height:${ringSize}px;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:${bgHex};opacity:0.25;"></div>
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;background:${bgHex};border-radius:9999px;border:2px solid #FDFCFA;color:#FDFCFA;font-weight:700;font-size:12px;">
        ${innerText}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [ringSize, ringSize],
    iconAnchor: [ringSize / 2, ringSize / 2],
    popupAnchor: [0, -size / 2],
  });
};

function MapEvents({ setBoundsAndZoom }: { setBoundsAndZoom: (b: any, z: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      setBoundsAndZoom(
        {
          swLat: b.getSouthWest().lat,
          swLng: b.getSouthWest().lng,
          neLat: b.getNorthEast().lat,
          neLng: b.getNorthEast().lng,
        },
        map.getZoom()
      );
    },
  });

  // Trigger once on mount
  useEffect(() => {
    const b = map.getBounds();
    setBoundsAndZoom(
      {
        swLat: b.getSouthWest().lat,
        swLng: b.getSouthWest().lng,
        neLat: b.getNorthEast().lat,
        neLng: b.getNorthEast().lng,
      },
      map.getZoom()
    );
  }, [map, setBoundsAndZoom]);

  return null;
}

export default function ReportMap() {
  const [mapParams, setMapParams] = useState<any>(null);
  const [mapData, setMapData] = useState<{ type: string; data: any[] }>({ type: 'markers', data: [] });
  const [isHeatmap, setIsHeatmap] = useState(false);

  // Fetch map data when bounds change
  useEffect(() => {
    if (!mapParams) return;
    const { bounds, zoom } = mapParams;
    
    // Safety check - if map is totally zoomed out, avoid querying entire earth if needed
    // But backend handles zoom grouping
    const url = `/api/reports/clusters?swLat=${bounds.swLat}&swLng=${bounds.swLng}&neLat=${bounds.neLat}&neLng=${bounds.neLng}&zoom=${zoom}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMapData(data);
        }
      })
      .catch(err => console.error("Map fetch error:", err));
  }, [mapParams]);

  const handleBoundsChange = useCallback((bounds: any, zoom: number) => {
    setMapParams({ bounds, zoom });
  }, []);

  return (
    <div className="relative w-full h-full bg-surface z-0 rounded border border-border overflow-hidden">
      <MapContainer
        center={[37.7749, -122.4194]} // Default fallback
        zoom={12}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
        />
        <MapEvents setBoundsAndZoom={handleBoundsChange} />

        {!isHeatmap && mapData.type === 'clusters' && (
          // Backend grouped clusters
          mapData.data.map((c: any, i: number) => (
            <Marker 
              key={i} 
              position={[c.lat, c.lng]} 
              icon={createSeverityIcon(c.severity, true, c.count)}
            />
          ))
        )}

        {!isHeatmap && mapData.type === 'markers' && (
          <MarkerClusterGroup 
            chunkedLoading 
            maxClusterRadius={40}
            showCoverageOnHover={false}
          >
            {mapData.data.map((m: any) => (
              <Marker 
                key={m.id} 
                position={[m.lat, m.lng]} 
                icon={createSeverityIcon(m.severity)}
              >
                <Popup className="custom-popup rounded-xl">
                  <div className="p-1">
                    <div className="flex gap-2 items-center mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}>
                        {m.type?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-text-secondary uppercase font-mono">{m.status}</span>
                    </div>
                    <h3 className="font-display font-semibold text-[var(--text-primary)] text-sm mb-2">{m.title}</h3>
                    <Link href={`/track/${m.id}`} className="text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                      View Report &rarr;
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}

        {isHeatmap && mapData.data.map((item: any, i: number) => {
          const count = item.count || 1;
          const radius = mapData.type === 'clusters' ? count * 15 : 20;
          return (
            <Circle
              key={i}
              center={[item.lat, item.lng]}
              radius={radius}
              pathOptions={{
                fillColor: item.severity === 'critical' ? 'var(--status-critical)' : item.severity === 'high' ? 'var(--status-pending)' : 'var(--status-active)',
                fillOpacity: 0.4,
                stroke: false
              }}
            />
          );
        })}

        <MapControls isHeatmap={isHeatmap} setIsHeatmap={setIsHeatmap} />
      </MapContainer>
    </div>
  );
}

function MapControls({ isHeatmap, setIsHeatmap }: { isHeatmap: boolean, setIsHeatmap: (v: boolean) => void }) {
  const map = useMap();

  const handleLocate = () => {
    map.locate().on("locationfound", function (e) {
      map.flyTo(e.latlng, map.getZoom());
    });
  };

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
      <button 
        onClick={() => setIsHeatmap(!isHeatmap)}
        className={`flex items-center justify-center w-10 h-10 rounded bg-surface border border-border transition-colors ${isHeatmap ? 'text-primary border-primary' : 'text-text-secondary hover:bg-card'}`}
        title="Toggle Heatmap"
      >
        <Layers className="w-5 h-5" />
      </button>
      <button 
        onClick={handleLocate}
        className="flex items-center justify-center w-10 h-10 rounded bg-surface border border-border transition-colors hover:bg-card text-text-secondary"
        title="My Location"
      >
        <LocateFixed className="w-5 h-5" />
      </button>
    </div>
  );
}
