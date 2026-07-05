'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Fix for default Leaflet marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  ward?: string;
}

interface GPSPickerProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  defaultCenter?: [number, number]; // [lat, lng]
}

// Sub-component to handle map clicks
function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void }) {
  const markerRef = useRef<L.Marker>(null);
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition],
  );

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

export default function GPSPicker({ 
  value, 
  onChange, 
  defaultCenter = [51.505, -0.09] // Default to London or specific civic region
}: GPSPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    value ? new L.LatLng(value.lat, value.lng) : null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressPreview, setAddressPreview] = useState<string>(value?.address || '');
  const [geoError, setGeoError] = useState<string | null>(null);

  // Reverse geocode when position changes
  useEffect(() => {
    if (!position) return;

    let isMounted = true;
    const fetchAddress = async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'CivicFix-App'
            }
          }
        );
        const data = await res.json();
        
        if (isMounted && data && data.display_name) {
          setAddressPreview(data.display_name);
          onChange({
            lat: position.lat,
            lng: position.lng,
            address: data.display_name,
            ward: data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || ''
          });
        } else {
          // Fallback if no address found
          onChange({ lat: position.lat, lng: position.lng });
        }
      } catch (err) {
        console.error("Reverse geocoding failed", err);
        if (isMounted) {
          onChange({ lat: position.lat, lng: position.lng });
        }
      } finally {
        if (isMounted) setIsGeocoding(false);
      }
    };

    const timeoutId = setTimeout(fetchAddress, 500); // debounce
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [position, onChange]);

  const handleUseMyLocation = useCallback(() => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition(new L.LatLng(latitude, longitude));
      },
      (err) => {
        setGeoError("Location access denied. Please click on the map or enter manually.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  return (
    <div className="w-full space-y-3">
      {/* Map Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary font-medium">
          Drag the pin or click the map to set the exact location.
        </p>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border border-border bg-card text-text-primary transition-colors hover:bg-surface hover:text-primary"
        >
          <Navigation className="w-3.5 h-3.5" />
          Use My Location
        </button>
      </div>

      {geoError && (
        <p className="text-sm font-medium p-2 rounded border" style={{ color: 'var(--status-critical)', borderColor: 'var(--status-critical)' }}>
          {geoError}
        </p>
      )}

      {/* Map Container */}
      <div className="rounded-xl overflow-hidden border border-border shadow-sm z-0 relative">
        <MapContainer 
          center={position || defaultCenter} 
          zoom={15} 
          scrollWheelZoom={false}
          className="w-full h-[300px] md:h-[400px] z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>

      {/* Address Preview */}
      <div className="flex items-start gap-3 p-3 bg-surface border border-border rounded">
        <div className="mt-0.5 text-text-secondary">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">
            {addressPreview || (position ? "Fetching address..." : "No location selected")}
          </p>
          {position && (
            <p className="text-xs text-text-secondary mt-0.5 font-mono">
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          )}
        </div>
        {isGeocoding && (
          <Loader2 className="w-4 h-4 animate-spin mt-0.5 text-text-secondary" />
        )}
      </div>
    </div>
  );
}
