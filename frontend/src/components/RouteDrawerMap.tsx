import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents } from 'react-leaflet';
import { Box, Button, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { Location } from '../types/activity.types';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const StartIcon = L.divIcon({
  html: '<div style="background:#4caf50;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">起</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const EndIcon = L.divIcon({
  html: '<div style="background:#f44336;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">終</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

L.Marker.prototype.options.icon = DefaultIcon;

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Fetch road-following route from OSRM (walking profile for running) */
async function fetchRoadRoute(
  waypoints: [number, number][]
): Promise<{ path: [number, number][]; distanceKm: number } | null> {
  if (waypoints.length < 2) return null;
  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/walking/${coords}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const coordsArray = route.geometry?.coordinates as [number, number][] | undefined;
    if (!coordsArray?.length) return null;
    const path: [number, number][] = coordsArray.map(([lng, lat]) => [lat, lng]);
    const distanceKm = (route.distance || 0) / 1000;
    return { path, distanceKm: Math.round(distanceKm * 10) / 10 };
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'RunCrew/1.0',
        },
      }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

export interface RouteDrawerResult {
  location: Location;
  endLocation: Location;
  waypoints: [number, number][];
  routePath?: [number, number][];
  distance: number;
  route: string;
}

interface RouteDrawerMapProps {
  value: RouteDrawerResult | null;
  onChange: (result: RouteDrawerResult | null) => void;
  error?: boolean;
  helperText?: string;
}

const MapClickHandler = ({
  onAddPoint,
}: {
  onAddPoint: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click: (e) => {
      onAddPoint(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const RouteDrawerMap: React.FC<RouteDrawerMapProps> = ({
  value,
  onChange,
  error,
  helperText,
}) => {
  const { t } = useTranslation();
  const [waypoints, setWaypoints] = useState<[number, number][]>(
    value?.waypoints || []
  );
  const [routePath, setRoutePath] = useState<[number, number][]>(
    value?.routePath || []
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    if (value?.waypoints && value.waypoints.length > 0) {
      setWaypoints(value.waypoints);
      setRoutePath(value.routePath || value.waypoints);
    } else if (!value) {
      setWaypoints([]);
      setRoutePath([]);
    }
  }, [value?.waypoints, value?.routePath, value]);

  const totalDistance = useCallback((points: [number, number][]) => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += haversineDistanceKm(
        points[i][0],
        points[i][1],
        points[i + 1][0],
        points[i + 1][1]
      );
    }
    return Math.round(total * 10) / 10;
  }, []);

  const updateRouteWithRoadPath = useCallback(
    (
      newPoints: [number, number][],
      path: [number, number][],
      distanceKm: number,
      startAddr: string,
      endAddr: string
    ) => {
      const first = newPoints[0];
      const last = newPoints[newPoints.length - 1];
      const routeDesc = `自訂路線（沿道路，${newPoints.length} 個點）`;
      onChange({
        location: {
          latitude: first[0],
          longitude: first[1],
          address: startAddr,
        },
        endLocation: {
          latitude: last[0],
          longitude: last[1],
          address: endAddr,
        },
        waypoints: newPoints,
        routePath: path,
        distance: distanceKm,
        route: routeDesc,
      });
    },
    [onChange]
  );

  const handleAddPoint = useCallback(
    (lat: number, lng: number) => {
      const newPoints: [number, number][] = [...waypoints, [lat, lng]];
      setWaypoints(newPoints);

      if (newPoints.length >= 2) {
        setIsRouting(true);
        fetchRoadRoute(newPoints)
          .then((roadRoute) => {
            const dist = roadRoute
              ? roadRoute.distanceKm
              : totalDistance(newPoints);
            const path = roadRoute?.path || newPoints;
            setRoutePath(path);

            setIsGeocoding(true);
            Promise.all([
              reverseGeocode(newPoints[0][0], newPoints[0][1]),
              reverseGeocode(newPoints[newPoints.length - 1][0], newPoints[newPoints.length - 1][1]),
            ])
              .then(([startAddr, endAddr]) => {
                updateRouteWithRoadPath(
                  newPoints,
                  path,
                  dist,
                  startAddr,
                  endAddr
                );
              })
              .catch(() => {
                updateRouteWithRoadPath(
                  newPoints,
                  path,
                  dist,
                  `${newPoints[0][0].toFixed(6)}, ${newPoints[0][1].toFixed(6)}`,
                  `${newPoints[newPoints.length - 1][0].toFixed(6)}, ${newPoints[newPoints.length - 1][1].toFixed(6)}`
                );
              })
              .finally(() => setIsGeocoding(false));
          })
          .catch(() => {
            const dist = totalDistance(newPoints);
            setRoutePath(newPoints);
            updateRouteWithRoadPath(
              newPoints,
              newPoints,
              dist,
              `${newPoints[0][0].toFixed(6)}, ${newPoints[0][1].toFixed(6)}`,
              `${newPoints[newPoints.length - 1][0].toFixed(6)}, ${newPoints[newPoints.length - 1][1].toFixed(6)}`
            );
          })
          .finally(() => setIsRouting(false));
      } else {
        setRoutePath([]);
        onChange(null);
      }
    },
    [waypoints, onChange, totalDistance, updateRouteWithRoadPath]
  );

  const handleUndo = useCallback(() => {
    if (waypoints.length === 0) return;
    const newPoints = waypoints.slice(0, -1);
    setWaypoints(newPoints);

    if (newPoints.length >= 2) {
      setIsRouting(true);
      fetchRoadRoute(newPoints)
        .then((roadRoute) => {
          const dist = roadRoute
            ? roadRoute.distanceKm
            : totalDistance(newPoints);
          const path = roadRoute?.path || newPoints;
          setRoutePath(path);
          const first = newPoints[0];
          const last = newPoints[newPoints.length - 1];
          onChange({
            location: {
              latitude: first[0],
              longitude: first[1],
              address: value?.location.address || `${first[0].toFixed(6)}, ${first[1].toFixed(6)}`,
            },
            endLocation: {
              latitude: last[0],
              longitude: last[1],
              address: value?.endLocation.address || `${last[0].toFixed(6)}, ${last[1].toFixed(6)}`,
            },
            waypoints: newPoints,
            routePath: path,
            distance: dist,
            route: `自訂路線（沿道路，${newPoints.length} 個點）`,
          });
        })
        .catch(() => {
          const dist = totalDistance(newPoints);
          setRoutePath(newPoints);
          const first = newPoints[0];
          const last = newPoints[newPoints.length - 1];
          onChange({
            location: {
              latitude: first[0],
              longitude: first[1],
              address: value?.location.address || `${first[0].toFixed(6)}, ${first[1].toFixed(6)}`,
            },
            endLocation: {
              latitude: last[0],
              longitude: last[1],
              address: value?.endLocation.address || `${last[0].toFixed(6)}, ${last[1].toFixed(6)}`,
            },
            waypoints: newPoints,
            routePath: newPoints,
            distance: dist,
            route: `自訂路線（${newPoints.length} 個點）`,
          });
        })
        .finally(() => setIsRouting(false));
    } else {
      setRoutePath([]);
      onChange(null);
    }
  }, [waypoints, value, onChange, totalDistance]);

  const handleClear = useCallback(() => {
    setWaypoints([]);
    setRoutePath([]);
    onChange(null);
  }, [onChange]);

  const displayDistanceKm =
    value?.distance ?? (waypoints.length >= 2 ? totalDistance(waypoints) : 0);

  const center: [number, number] =
    waypoints.length > 0
      ? waypoints[Math.floor(waypoints.length / 2)]
      : [22.3193, 114.1694]; // Hong Kong

  return (
    <Box>
      <Typography
        variant="body2"
        color={error ? 'error' : 'text.secondary'}
        sx={{ mb: 1 }}
      >
        {helperText || t('clickMapToDraw')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleUndo}
          disabled={waypoints.length === 0 || isGeocoding || isRouting}
        >
          {t('undoLast')}
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          onClick={handleClear}
          disabled={waypoints.length === 0 || isGeocoding || isRouting}
        >
          {t('clearRoute')}
        </Button>
        {waypoints.length >= 2 && (
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>
            {t('pointsAndDistance', { count: waypoints.length, distance: displayDistanceKm })}
            {isRouting && ` · ${t('calculatingRoute')}`}
          </Typography>
        )}
      </Box>
      <Box sx={{ height: { xs: 'min(400px, 45vh)', sm: 400 }, minHeight: 280, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onAddPoint={handleAddPoint} />
          {(routePath.length > 1 ? routePath : waypoints).length > 1 && (
            <Polyline
              positions={routePath.length > 1 ? routePath : waypoints}
              color="#1976d2"
              weight={4}
              opacity={0.8}
            />
          )}
          {waypoints.map((pos, i) => (
            <Marker
              key={i}
              position={pos}
              icon={
                i === 0
                  ? StartIcon
                  : i === waypoints.length - 1
                  ? EndIcon
                  : DefaultIcon
              }
            />
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
};
