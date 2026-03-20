import type { RoughLocation } from '@/lib/dream-types';

const MAPBOX_TYPES = 'district,place,locality,region,country';
const COORDINATE_GRID = 0.25;

export function coarsenCoordinate(value: number) {
  return Math.round(value / COORDINATE_GRID) * COORDINATE_GRID;
}

export function coarsenLocation(location: RoughLocation): RoughLocation {
  return {
    label: location.label,
    lat: Number(coarsenCoordinate(location.lat).toFixed(4)),
    lng: Number(coarsenCoordinate(location.lng).toFixed(4)),
  };
}

type MapboxFeature = {
  text?: string;
  place_name?: string;
  place_type?: string[];
  center?: [number, number];
};

function pickPreferredLocationFeature(features: MapboxFeature[]) {
  const hasType = (feature: MapboxFeature, type: string) => feature.place_type?.includes(type);
  return (
    features.find((feature) => hasType(feature, 'place')) ||
    features.find((feature) => hasType(feature, 'locality')) ||
    features.find((feature) => hasType(feature, 'district')) ||
    features.find((feature) => hasType(feature, 'region')) ||
    features.find((feature) => hasType(feature, 'country')) ||
    features[0]
  );
}

function getShortLocationLabel(feature?: MapboxFeature, fallback?: string) {
  if (!feature) return fallback || 'Unknown area';

  if (feature.text) return feature.text;

  if (feature.place_name) {
    const [firstPart] = feature.place_name.split(',');
    return firstPart?.trim() || fallback || 'Unknown area';
  }

  return fallback || 'Unknown area';
}

export async function reverseGeocodeToRoughLocation(lat: number, lng: number): Promise<RoughLocation> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    return coarsenLocation({
      label: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      lat,
      lng,
    });
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=${MAPBOX_TYPES}&access_token=${token}`
  );

  if (!response.ok) {
    throw new Error('Failed to reverse geocode location');
  }

  const data = await response.json();
  const feature = data.features?.length
    ? pickPreferredLocationFeature(data.features as MapboxFeature[])
    : undefined;

  if (!feature) {
    return coarsenLocation({
      label: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      lat,
      lng,
    });
  }

  const [featureLng, featureLat] = Array.isArray(feature.center)
    ? feature.center
    : [lng, lat];

  return coarsenLocation({
    label: getShortLocationLabel(feature, `${lat.toFixed(2)}, ${lng.toFixed(2)}`),
    lat: featureLat,
    lng: featureLng,
  });
}
