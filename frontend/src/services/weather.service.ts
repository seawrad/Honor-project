/**
 * Weather service using Open-Meteo API (free, no API key)
 */
const API_URL = 'https://api.open-meteo.com/v1/forecast'

const HONG_KONG = { latitude: 22.3193, longitude: 114.1694 }

const WEATHER_CODE_ZH: Record<number, string> = {
  0: '晴朗', 1: '少雲', 2: '多雲', 3: '陰天', 45: '霧', 48: '霧',
  51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨', 56: '凍毛毛雨', 57: '凍毛毛雨',
  61: '小雨', 63: '雨', 65: '大雨', 66: '凍雨', 67: '凍雨',
  71: '小雪', 73: '雪', 75: '大雪', 77: '米雪',
  80: '驟雨', 81: '驟雨', 82: '大驟雨', 85: '雪', 86: '大雪',
  95: '雷暴', 96: '雷暴', 99: '雷暴',
}

export interface WeatherData {
  temperature: number
  weatherCode: number
  weatherDesc: string
  windSpeed: number
  runSuitable: boolean
  location: string
}

function getWeatherDesc(code: number): string {
  return WEATHER_CODE_ZH[code] ?? '多雲'
}

function isRunSuitable(windSpeedKmh: number, code: number): boolean {
  if (windSpeedKmh > 30) return false
  if ([95, 96, 99].includes(code)) return false
  if (code >= 61 && code <= 67) return false
  if (code >= 80 && code <= 82) return false
  return true
}

export const weatherService = {
  async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      const params = new URLSearchParams({
        latitude: HONG_KONG.latitude.toString(),
        longitude: HONG_KONG.longitude.toString(),
        current: 'temperature_2m,weather_code,wind_speed_10m',
        timezone: 'Asia/Hong_Kong',
      })
      const response = await fetch(`${API_URL}?${params}`)
      if (!response.ok) return null
      const data = await response.json()
      const current = data.current
      if (!current) return null
      const temp = current.temperature_2m ?? 0
      const code = current.weather_code ?? 0
      const wind = current.wind_speed_10m ?? 0
      return {
        temperature: Math.round(temp),
        weatherCode: code,
        weatherDesc: getWeatherDesc(code),
        windSpeed: Math.round(wind),
        runSuitable: isRunSuitable(wind, code),
        location: 'Hong Kong',
      }
    } catch {
      return null
    }
  },
}
