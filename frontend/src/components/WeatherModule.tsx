import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { weatherService, WeatherData } from '../services/weather.service';

const getWeatherEmoji = (code: number): string => {
  if (code === 0) return '☀️'
  if (code === 1) return '🌤'
  if ([2, 3].includes(code)) return '☁️'
  if ([45, 48].includes(code)) return '🌫'
  if (code >= 51 && code <= 67) return '🌧'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 86) return '🌦'
  if ([95, 96, 99].includes(code)) return '⛈'
  return '🌤'
}

export const WeatherModule: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false
    weatherService.getCurrentWeather().then((data) => {
      if (!cancelled) {
        setWeather(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (!weather) {
    return null
  }

  const emoji = getWeatherEmoji(weather.weatherCode)

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(0, 184, 212, 0.08)',
        border: '1px solid rgba(0, 184, 212, 0.2)',
        minWidth: { xs: '100%', sm: 200 },
      }}
    >
      <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
        {emoji} 今日天氣：{weather.temperature}°C｜{weather.weatherDesc}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        💨 風速：{weather.windSpeed} km/h — {weather.runSuitable ? '適合跑步' : '不太適合跑步'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        📍 地區：{weather.location}
      </Typography>
    </Box>
  )
}
