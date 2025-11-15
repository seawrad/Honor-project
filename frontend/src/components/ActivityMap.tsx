import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '../types/activity.types';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ActivityMapProps {
  location: Location;
  height?: number | string;
}

export const ActivityMap = ({ location, height = 400 }: ActivityMapProps) => {
  return (
    <Box sx={{ height, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.latitude, location.longitude]}>
          <Popup>{location.address}</Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
};
