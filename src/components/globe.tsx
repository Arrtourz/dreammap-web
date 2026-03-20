'use client';

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export type GlobeTheme =
  | 'satellite-streets-v12'
  | 'satellite-v9'
  | 'streets-v12'
  | 'outdoors-v12'
  | 'light-v11'
  | 'dark-v11'
  | 'navigation-day-v1'
  | 'navigation-night-v1';

const MIN_ZOOM = 1.35;
const MAX_ZOOM = 6;
const DEFAULT_ZOOM = 1.6;
const DEFAULT_SPIN_LAT = 39;
const HIDDEN_LAYER_PATTERNS = [
  'road',
  'street',
  'path',
  'highway',
  'transit',
  'airport',
  'rail',
  'poi',
  'building',
  'house-number',
  'settlement-subdivision',
];
const ALLOWED_SYMBOL_PATTERNS = [
  'country-label',
  'state-label',
  'settlement',
  'place',
  'city',
  'locality',
  'region',
  'water',
];

export interface GlobeMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  excerpt?: string;
}

interface GlobeProps {
  onLocationClick: (location: { name: string; lat: number; lng: number }) => void;
  onMarkerClick?: (marker: GlobeMarker) => void;
  markers?: GlobeMarker[];
  theme?: GlobeTheme;
  initialCenter?: [number, number];
  initialZoom?: number;
  marker?: { lat: number; lng: number };
  disableInteraction?: boolean;
  interactionHint?: string;
}

export interface GlobeRef {
  selectRandomLocation: () => void;
  focusLocation: (lng: number, lat: number, zoom?: number) => void;
}

export function getRandomGlobeCenter(): [number, number] {
  const lng = Math.random() * 360 - 180;
  return [Number(lng.toFixed(4)), DEFAULT_SPIN_LAT];
}

type MapboxFeature = {
  text?: string;
  place_name?: string;
  place_type?: string[];
  center?: [number, number];
};

function pickPreferredFeature(features: MapboxFeature[], zoom: number) {
  const hasType = (feature: MapboxFeature, type: string) => feature.place_type?.includes(type);
  const findByTypes = (types: string[]) => features.find((feature) => types.some((type) => hasType(feature, type)));

  if (zoom < 5) {
    return findByTypes(['place', 'locality', 'district', 'region', 'country']) || features[0];
  }

  if (zoom < 7) {
    return findByTypes(['place', 'locality', 'district', 'region', 'country']) || features[0];
  }

  return findByTypes(['place', 'locality', 'district', 'region', 'country']) || features[0];
}

async function resolveRoughLocation(
  mapboxToken: string,
  lng: number,
  lat: number,
  zoom: number
) {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country,region,place,locality,district&access_token=${mapboxToken}`
  );
  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    return {
      name: `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
      lat,
      lng,
    };
  }

  const selectedFeature = pickPreferredFeature(data.features as MapboxFeature[], zoom);

  const center = Array.isArray(selectedFeature.center) ? selectedFeature.center : [lng, lat];
  const locationName =
    selectedFeature.text ||
    selectedFeature.place_name?.split(',')[0]?.trim() ||
    `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`;

  return {
    name: locationName,
    lat: center[1],
    lng: center[0],
  };
}

function simplifyDreammapStyle(map: mapboxgl.Map) {
  const style = map.getStyle();
  if (!style?.layers) return;

  style.layers.forEach((layer) => {
    const id = layer.id.toLowerCase();
    const isLineLayer = layer.type === 'line';
    const isSymbolLayer = layer.type === 'symbol';
    const keepSymbol = ALLOWED_SYMBOL_PATTERNS.some((pattern) => id.includes(pattern));
    const shouldHideByPattern = HIDDEN_LAYER_PATTERNS.some((pattern) => id.includes(pattern));
    const shouldHide = shouldHideByPattern || isLineLayer || (isSymbolLayer && !keepSymbol);

    if (!shouldHide) return;

    try {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    } catch {
      // Ignore layers that do not expose layout visibility.
    }
  });
}

if (typeof window !== 'undefined') {
  const handleError = (event: ErrorEvent) => {
    if (event.error?.name === 'AbortError' || event.message?.includes('aborted')) {
      event.preventDefault();
    }
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason?.name === 'AbortError' || reason?.message?.includes('aborted')) {
      event.preventDefault();
    }
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
}

export const Globe = forwardRef<GlobeRef, GlobeProps>(function Globe(
  {
    onLocationClick,
    onMarkerClick,
    markers = [],
    theme = 'navigation-day-v1',
    initialCenter,
    initialZoom,
    marker,
    disableInteraction = false,
    interactionHint = 'Click the globe to choose a rough area',
  },
  ref
) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const singleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dreamMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const styleSimplifiedRef = useRef(false);
  const contextMenuCleanupRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearDreamMarkers = () => {
    dreamMarkersRef.current.forEach((existingMarker) => existingMarker.remove());
    dreamMarkersRef.current = [];
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      setError('Mapbox access token is not configured');
      setIsLoading(false);
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: `mapbox://styles/mapbox/${theme}`,
        center: initialCenter || getRandomGlobeCenter(),
        zoom: initialZoom || DEFAULT_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        projection: 'globe' as any,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        logoPosition: 'bottom-right' as any,
      });

      mapRef.current = map;
      styleSimplifiedRef.current = false;
      map.scrollZoom.enable();
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();

      map.on('load', () => {
        map.setFog({
          color: 'rgb(240, 237, 228)',
          'high-color': 'rgb(13, 54, 87)',
          'horizon-blend': 0.08,
          'space-color': 'rgb(242, 236, 224)',
          'star-intensity': 0,
        } as any);
        setIsLoading(false);

        if (marker) {
          const el = document.createElement('div');
          el.className = 'location-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '9999px';
          el.style.background = 'rgba(239, 68, 68, 0.95)';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';

          singleMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([marker.lng, marker.lat])
            .addTo(map);
        }

        let userInteracting = false;
        let spinEnabled = !marker;
        const secondsPerRevolution = 180;
        const maxSpinZoom = 5.2;
        const slowSpinZoom = 3.6;

        function spinGlobe() {
          const zoom = map.getZoom();
          if (spinEnabled && !userInteracting && zoom < maxSpinZoom && !marker) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
              const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
              distancePerSecond *= zoomDif;
            }

            const center = map.getCenter();
            center.lng -= distancePerSecond / 60;
            map.easeTo({ center, duration: 1000 / 60, easing: (n) => n });
          }
        }

        const pauseSpin = () => {
          userInteracting = true;
          spinEnabled = false;
        };

        const pauseSpinAndStop = () => {
          pauseSpin();
          map.stop();
        };

        const resumeSpin = () => {
          userInteracting = false;
          setTimeout(() => {
            if (!userInteracting) {
              spinEnabled = true;
            }
          }, 3000);
        };

        map.on('mousedown', pauseSpinAndStop);
        map.on('mouseup', resumeSpin);
        map.on('dragend', resumeSpin);
        map.on('pitchend', resumeSpin);
        map.on('rotateend', resumeSpin);
        map.on('zoomstart', pauseSpin);
        map.on('zoomend', resumeSpin);
        map.on('touchstart', pauseSpinAndStop);
        map.on('touchend', resumeSpin);

        spinGlobe();
        setInterval(spinGlobe, 1000 / 60);
      });

      map.on('idle', () => {
        if (styleSimplifiedRef.current) return;
        styleSimplifiedRef.current = true;
        simplifyDreammapStyle(map);
      });

      const canvas = map.getCanvas();
      const stopRightMouse = (event: MouseEvent) => {
        if (event.button !== 2) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      };

      const handleRightMouseUp = async (event: MouseEvent) => {
        if (event.button !== 2) return;
        stopRightMouse(event);

        if (disableInteraction || !mapRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const point = new mapboxgl.Point(event.clientX - rect.left, event.clientY - rect.top);
        const lngLat = mapRef.current.unproject(point);
        const { lng, lat } = lngLat;
        const zoom = mapRef.current.getZoom();

        try {
          const location = await resolveRoughLocation(mapboxToken, lng, lat, zoom);
          onLocationClick(location);
        } catch {
          onLocationClick({
            name: `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
            lat,
            lng,
          });
        }
      };

      canvas.addEventListener('mousedown', stopRightMouse, true);
      canvas.addEventListener('mouseup', handleRightMouseUp, true);
      canvas.addEventListener('contextmenu', stopRightMouse, true);
      contextMenuCleanupRef.current = () => {
        canvas.removeEventListener('mousedown', stopRightMouse, true);
        canvas.removeEventListener('mouseup', handleRightMouseUp, true);
        canvas.removeEventListener('contextmenu', stopRightMouse, true);
      };

      if (!disableInteraction) {
        map.on('click', () => {
          // Left click is browse-only. Right click on the canvas adds a rough location.
        });
      }

      map.on('mouseenter', () => {
        map.getCanvas().style.cursor = disableInteraction ? '' : 'pointer';
      });

      map.on('mouseleave', () => {
        map.getCanvas().style.cursor = '';
      });
    } catch {
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    return () => {
      if (contextMenuCleanupRef.current) {
        contextMenuCleanupRef.current();
        contextMenuCleanupRef.current = null;
      }
      clearDreamMarkers();
      if (singleMarkerRef.current) {
        singleMarkerRef.current.remove();
        singleMarkerRef.current = null;
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // Ignore Mapbox aborts during cleanup.
        }
        mapRef.current = null;
      }
    };
  }, [disableInteraction, initialCenter, initialZoom, marker, onLocationClick, theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    clearDreamMarkers();

    markers.forEach((markerEntry) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'dreammap-marker';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '9999px';
      el.style.border = '2px solid rgba(255,255,255,0.95)';
      el.style.background = 'rgba(244,63,94,0.95)';
      el.style.boxShadow = '0 6px 18px rgba(15,23,42,0.35)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
      }).setHTML(
        `<div style="max-width:220px">
          <div style="font-weight:600;font-size:12px;margin-bottom:4px">${markerEntry.label}</div>
          <div style="font-size:11px;line-height:1.45;color:#475569">${markerEntry.excerpt || ''}</div>
        </div>`
      );

      el.addEventListener('mouseenter', () => {
        popup.setLngLat([markerEntry.lng, markerEntry.lat]).addTo(map);
      });
      el.addEventListener('mouseleave', () => {
        popup.remove();
      });
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        onMarkerClick?.(markerEntry);
      });

      const dreamMarker = new mapboxgl.Marker(el)
        .setLngLat([markerEntry.lng, markerEntry.lat])
        .addTo(map);

      dreamMarkersRef.current.push(dreamMarker);
    });
  }, [isLoading, markers, onMarkerClick]);

  useImperativeHandle(ref, () => ({
    selectRandomLocation: async () => {
      if (!mapRef.current) return;

      const map = mapRef.current;
      const lat = Math.random() * 180 - 90;
      const lng = Math.random() * 360 - 180;

      map.easeTo({
        center: [lng, lat],
        zoom: 3,
        duration: 2000,
        easing: (t) => t * (2 - t),
      });
    },
    focusLocation: (lng: number, lat: number, zoom = 4.8) => {
      if (!mapRef.current) return;

      mapRef.current.easeTo({
        center: [lng, lat],
        zoom: Math.min(zoom, MAX_ZOOM),
        duration: 1600,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    },
  }));

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-destructive">Map Error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading globe...</p>
          </div>
        </div>
      ) : null}

      <div ref={mapContainerRef} className="h-full w-full" />

      {!disableInteraction ? (
        <div className="absolute bottom-4 left-4 rounded-lg bg-background/90 px-4 py-2 shadow-lg backdrop-blur-sm">
          <p className="text-sm font-medium">{interactionHint}</p>
          <p className="mt-1 text-xs text-muted-foreground">Right-click adds a rough location. Zoom stops at a broad city view.</p>
        </div>
      ) : null}
    </div>
  );
});
