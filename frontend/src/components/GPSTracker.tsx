import { useEffect } from 'react';
import { Box, Paper, Typography, Alert, Avatar, Link } from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import { Link as RouterLink } from 'react-router-dom';
import { LatLngExpression, Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { GPSPosition } from '../types/gps.types';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const participantIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Host marker: gold pin with crown icon - more prominent and distinctive
const hostIcon = new DivIcon({
  className: 'host-marker',
  html: `
    <div style="
      position: relative;
      width: 36px;
      height: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        font-size: 20px;
        line-height: 1;
        color: #f5c518;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        margin-bottom: 2px;
      ">👑</div>
      <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png"
           alt=""
           style="width: 25px; height: 41px; margin: 0 auto; display: block;"
      />
    </div>
  `,
  iconSize: [36, 56],
  iconAnchor: [18, 56],
  popupAnchor: [1, -50],
});

// Host marker for "me" (current user) - larger and more special
const myHostIcon = new DivIcon({
  className: 'my-host-marker',
  html: `
    <div style="
      position: relative;
      width: 44px;
      height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        font-size: 26px;
        line-height: 1;
        color: #f5c518;
        text-shadow: 0 2px 4px rgba(0,0,0,0.6);
        margin-bottom: 2px;
      ">👑</div>
      <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png"
           alt=""
           style="width: 30px; height: 49px; margin: 0 auto; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));"
      />
    </div>
  `,
  iconSize: [44, 68],
  iconAnchor: [22, 68],
  popupAnchor: [1, -62],
});

export interface ParticipantLocation {
  userId: string;
  displayName: string;
  isHost: boolean;
  latitude: number;
  longitude: number;
  /** Timestamp when this location was last received (for stale filtering) */
  lastUpdate?: number;
  avatarUrl?: string | null;
  /** Speed in km/h */
  speedKmh?: number;
}

interface GPSTrackerProps {
  currentPosition: GPSPosition | null;
  positions: GPSPosition[];
  error: string | null;
  participantLocations?: ParticipantLocation[];
  /** When true, the current user's marker uses the host (crown) icon */
  isHost?: boolean;
  /** Current user id and avatar for "me" marker popup link */
  currentUserId?: string;
  currentUserAvatarUrl?: string | null;
  currentUserDisplayName?: string;
}

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Pace from speed km/h -> min/km (60/speed). Returns null if invalid.
function speedToPace(speedKmh: number): number | null {
  if (speedKmh == null || speedKmh <= 0 || !Number.isFinite(speedKmh)) return null;
  const pace = 60 / speedKmh;
  return Number.isFinite(pace) ? pace : null;
}

// Format relative time for "last updated"
function formatRelativeTime(timestamp: number, t: (key: string, opts?: { count?: number }) => string): string {
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 60) return t('secondsAgo', { count: sec });
  const min = Math.floor(sec / 60);
  if (min < 60) return t('minutesAgo', { count: min });
  const hr = Math.floor(min / 60);
  return t('hoursAgo', { count: hr });
}

// Popup content when clicking a participant marker
function ParticipantPopupContent({
  participant,
  currentPosition,
}: {
  participant: ParticipantLocation;
  currentPosition: GPSPosition | null;
}) {
  const { t } = useTranslation();
  const roleKey = participant.isHost ? 'roleHost' : 'roleParticipant';
  const lastUpdatedText = participant.lastUpdate
    ? t('lastUpdated') + ': ' + formatRelativeTime(participant.lastUpdate, t)
    : null;
  const distanceKm =
    currentPosition
      ? haversineKm(
          currentPosition.latitude,
          currentPosition.longitude,
          participant.latitude,
          participant.longitude
        )
      : null;
  const paceMinPerKm = speedToPace(participant.speedKmh ?? 0);

  return (
    <Box component="div" sx={{ minWidth: 180 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar
          src={participant.avatarUrl || undefined}
          sx={{ width: 36, height: 36 }}
        >
          {!participant.avatarUrl && participant.displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {participant.isHost && '👑 '}{participant.displayName}
          </Typography>
          <Link
            component={RouterLink}
            to={`/users/${participant.userId}`}
            variant="body2"
            color="primary"
            underline="hover"
          >
            {t('viewProfile')}
          </Link>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {t('role')}: {t(roleKey)}
      </Typography>
      {distanceKm != null && (
        <Typography variant="caption" color="text.secondary" display="block">
          {t('distanceFromYou')}: {distanceKm.toFixed(2)} {t('kmShort')}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" display="block">
        {t('pace')}: {paceMinPerKm != null && paceMinPerKm > 0
          ? `${paceMinPerKm.toFixed(1)} ${t('paceUnit')}`
          : t('paceNA')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {t('latitude')}: {participant.latitude.toFixed(5)}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {t('longitude')}: {participant.longitude.toFixed(5)}
      </Typography>
      {lastUpdatedText && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {lastUpdatedText}
        </Typography>
      )}
    </Box>
  );
}

// Component to update map center when position changes
function MapUpdater({ position }: { position: GPSPosition | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom());
    }
  }, [position, map]);

  return null;
}

export const GPSTracker: React.FC<GPSTrackerProps> = ({
  currentPosition,
  positions,
  error,
  participantLocations = [],
  isHost = false,
  currentUserId,
  currentUserAvatarUrl,
  currentUserDisplayName,
}) => {
  const { t } = useTranslation();
  const defaultCenter: LatLngExpression = [22.3193, 114.1694]; // Hong Kong
  const center: LatLngExpression = currentPosition
    ? [currentPosition.latitude, currentPosition.longitude]
    : defaultCenter;

  const polylinePositions: LatLngExpression[] = positions.map((pos) => [
    pos.latitude,
    pos.longitude,
  ]);

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {t('livePositionTracking')}
      </Typography>
      {participantLocations.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          ⭐ {t('creator')} · ● {t('participants')}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: { xs: 'min(400px, 45vh)', sm: 400 }, minHeight: 280, width: '100%', position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater position={currentPosition} />

          {currentPosition && (
            <Marker
              position={[currentPosition.latitude, currentPosition.longitude]}
              icon={isHost ? myHostIcon : undefined}
            >
              {(isHost || (currentUserId && currentUserDisplayName)) && (
                <>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Avatar
                        src={currentUserAvatarUrl || undefined}
                        sx={{ width: 20, height: 20 }}
                      >
                        {!currentUserAvatarUrl && (currentUserDisplayName || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <span>{isHost ? `👑 ${t('creatorYou')}` : currentUserDisplayName}</span>
                    </Box>
                  </Tooltip>
                  <Popup>
                    <Box component="div" sx={{ minWidth: 180 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar
                          src={currentUserAvatarUrl || undefined}
                          sx={{ width: 36, height: 36 }}
                        >
                          {!currentUserAvatarUrl && (currentUserDisplayName || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {isHost ? `👑 ${t('creatorYou')}` : currentUserDisplayName}
                          </Typography>
                          {currentUserId && (
                            <Link
                              component={RouterLink}
                              to={`/users/${currentUserId}`}
                              variant="body2"
                              color="primary"
                              underline="hover"
                            >
                              {t('viewProfile')}
                            </Link>
                          )}
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('role')}: {isHost ? t('roleHost') : t('roleParticipant')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('latitude')}: {currentPosition.latitude.toFixed(5)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('longitude')}: {currentPosition.longitude.toFixed(5)}
                      </Typography>
                    </Box>
                  </Popup>
                </>
              )}
            </Marker>
          )}

          {participantLocations.map((p) => (
            <Marker
              key={p.userId}
              position={[p.latitude, p.longitude]}
              icon={p.isHost ? hostIcon : participantIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar
                    src={p.avatarUrl || undefined}
                    sx={{ width: 20, height: 20 }}
                  >
                    {!p.avatarUrl && p.displayName.charAt(0).toUpperCase()}
                  </Avatar>
                  <span>{p.isHost && '👑 '}{p.displayName}</span>
                </Box>
              </Tooltip>
              <Popup>
                <ParticipantPopupContent participant={p} currentPosition={currentPosition} />
              </Popup>
            </Marker>
          ))}

          {polylinePositions.length > 1 && (
            <Polyline positions={polylinePositions} color="blue" weight={3} />
          )}
        </MapContainer>
      </Box>

      {currentPosition && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            緯度: {currentPosition.latitude.toFixed(6)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            經度: {currentPosition.longitude.toFixed(6)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            精確度: {currentPosition.accuracy.toFixed(2)} 公尺
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
