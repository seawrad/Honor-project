import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Box, TextField, Button } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
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

interface LocationPickerProps {
  value: Location | null;
  onChange: (location: Location) => void;
  error?: boolean;
  helperText?: string;
}

const MapClickHandler = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const LocationPicker = ({ value, onChange, error, helperText }: LocationPickerProps) => {
  const { t } = useTranslation();
  const [address, setAddress] = useState(value?.address || '');
  const [position, setPosition] = useState<[number, number]>(
    value ? [value.latitude, value.longitude] : [22.3193, 114.1694] // Default to Hong Kong
  );

  useEffect(() => {
    if (value) {
      setAddress(value.address);
      setPosition([value.latitude, value.longitude]);
    }
  }, [value]);

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onChange({
      latitude: lat,
      longitude: lng,
      address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (value) {
      onChange({
        ...value,
        address: newAddress,
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPosition([lat, lng]);
          onChange({
            latitude: lat,
            longitude: lng,
            address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Box>
      <TextField
        label={t('address')}
        value={address}
        onChange={(e) => handleAddressChange(e.target.value)}
        fullWidth
        error={error}
        helperText={helperText || t('clickMapOrEnterAddress')}
        sx={{ mb: 2 }}
      />
      <Button
        variant="outlined"
        onClick={handleUseCurrentLocation}
        fullWidth
        sx={{ mb: 2 }}
      >
        {t('useCurrentLocation')}
      </Button>
      <Box sx={{ height: { xs: 'min(400px, 45vh)', sm: 400 }, minHeight: 280, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />
          {value && <Marker position={position} />}
        </MapContainer>
      </Box>
    </Box>
  );
};
