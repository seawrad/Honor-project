import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Skeleton } from '@mui/material';
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

const getWeatherDescKey = (code: number): string => {
  if (code === 0) return 'weatherClear'
  if (code === 1) return 'weatherMainlyClear'
  if (code === 2) return 'weatherPartlyCloudy'
  if (code === 3) return 'weatherOvercast'
  if ([45, 48].includes(code)) return 'weatherFog'
  if (code >= 51 && code <= 55) return 'weatherDrizzle'
  if ([56, 57].includes(code)) return 'weatherFreezingDrizzle'
  if (code === 61) return 'weatherLightRain'
  if (code === 63) return 'weatherRain'
  if (code === 65) return 'weatherHeavyRain'
  if ([66, 67].includes(code)) return 'weatherFreezingRain'
  if (code === 71) return 'weatherLightSnow'
  if ([73, 85].includes(code)) return 'weatherSnow'
  if ([75, 86].includes(code)) return 'weatherHeavySnow'
  if (code === 77) return 'weatherSnowGrains'
  if ([80, 81].includes(code)) return 'weatherShower'
  if (code === 82) return 'weatherHeavyShower'
  if ([95, 96, 99].includes(code)) return 'weatherThunderstorm'
  return 'weatherCloudy'
}

export const WeatherModule: React.FC = () => {
  const { t } = useTranslation();
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
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(0, 184, 212, 0.08)',
          border: '1px solid rgba(0, 184, 212, 0.2)',
          minWidth: { xs: '100%', sm: 200 },
        }}
      >
        <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={20} />
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
        {emoji} {t('todayWeather')}: {weather.temperature}°C｜{t(getWeatherDescKey(weather.weatherCode))}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        💨 {t('windSpeed')}: {weather.windSpeed} km/h — {weather.runSuitable ? t('suitableForRun') : t('notSuitableForRun')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        📍 {t('weatherLocation')}: {weather.location}
      </Typography>
    </Box>
  )
}
