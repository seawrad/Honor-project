import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';

export interface LenticularCardData {
  id?: string;
  activityId: string;
  participantCount: number;
  totalDistance: number;
  averageSpeed: number;
  durationSeconds: number;
  runDate: string;
  weatherTemp?: number;
  weatherDesc?: string;
  newsHeadline?: string;
  aiImageUrl?: string;
  groupPhotoUrl?: string;
  messages?: { displayName: string; content: string }[];
  activityTitle?: string;
}

interface LenticularCardProps {
  data: LenticularCardData;
  activityTitle?: string;
}

function formatDuration(seconds: number): string {
  const n = Number(seconds) || 0;
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}分${s}秒`;
}

export const LenticularCard: React.FC<LenticularCardProps> = ({
  data,
  activityTitle,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [usePointer, setUsePointer] = useState(false);

  const handleDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    const beta = Math.max(-45, Math.min(45, e.beta - 45));
    const gamma = Math.max(-30, Math.min(30, e.gamma));
    setTilt({ x: gamma * 2, y: beta * 2 });
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!cardRef.current || !usePointer) return;
      const rect = cardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = (e.clientX - cx) / rect.width;
      const y = (e.clientY - cy) / rect.height;
      setTilt({ x: x * 20, y: y * 20 });
    },
    [usePointer]
  );

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supportsOrientation = 'DeviceOrientationEvent' in window;
    if (supportsOrientation && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setUsePointer(true);
    } else if (supportsOrientation) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      return () => window.removeEventListener('deviceorientation', handleDeviceOrientation);
    } else {
      setUsePointer(true);
    }
  }, [handleDeviceOrientation]);

  const transform = `perspective(1000px) rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg)`;

  return (
    <Box
      sx={{
        perspective: '1200px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
        p: 2,
      }}
    >
      <Paper
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 360,
          height: 520,
          borderRadius: 3,
          overflow: 'hidden',
          transform,
          transformStyle: 'preserve-3d',
          transition: usePointer ? 'transform 0.1s ease-out' : 'none',
          cursor: usePointer ? 'pointer' : 'default',
          '&:hover': usePointer ? {} : undefined,
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(145deg, #1a237e 0%, #0d47a1 50%, #01579b 100%)',
            color: 'white',
          }}
        >
          {/* Header - AI / Group photo area */}
          <Box
            sx={{
              height: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.2)',
              transform: `translateZ(20px)`,
            }}
          >
            {data.aiImageUrl || data.groupPhotoUrl ? (
              <Box
                component="img"
                src={data.aiImageUrl || data.groupPhotoUrl}
                alt="Run moment"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  opacity: 0.9,
                }}
              >
                <DirectionsRunIcon sx={{ fontSize: 64 }} />
                <Typography variant="h6">
                  {Number(data.participantCount) || 0} 位跑者 · {(Number(data.totalDistance) || 0).toFixed(1)} km
                </Typography>
              </Box>
            )}
          </Box>

          {/* Run stats - parallax layer */}
          <Box
            sx={{
              p: 2,
              flex: 1,
              transform: `translateZ(30px)`,
            }}
          >
            <Typography variant="overline" sx={{ opacity: 0.9 }}>
              {activityTitle || '跑步活動'}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
              {new Date(data.runDate).toLocaleDateString('zh-TW', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DirectionsRunIcon fontSize="small" />
                <Typography variant="body2">
                  {(Number(data.totalDistance) || 0).toFixed(1)} km · {(Number(data.averageSpeed) || 0).toFixed(1)} km/h
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{formatDuration(Number(data.durationSeconds) || 0)}</Typography>
              </Box>
            </Box>

            {(data.weatherTemp ?? data.weatherDesc) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                <WbSunnyIcon fontSize="small" />
                <Typography variant="body2">
                  {data.weatherTemp != null ? `${Number(data.weatherTemp)}°C` : ''}
                  {data.weatherTemp != null && data.weatherDesc ? ' · ' : ''}
                  {data.weatherDesc || ''}
                </Typography>
              </Box>
            )}

            {data.newsHeadline && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.8 }}>
                📰 {data.newsHeadline}
              </Typography>
            )}

            {data.messages && data.messages.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <ChatBubbleIcon fontSize="small" />
                  <Typography variant="subtitle2">跑者留言</Typography>
                </Box>
                {data.messages.slice(0, 3).map((m, i) => (
                  <Typography key={i} variant="body2" sx={{ opacity: 0.95, mb: 0.5 }}>
                    {m.displayName}: {m.content}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>

          {/* Hint for tilt */}
          <Typography
            variant="caption"
            sx={{
              p: 1,
              textAlign: 'center',
              opacity: 0.7,
              transform: `translateZ(10px)`,
            }}
          >
            {usePointer ? '移動滑鼠體驗立體效果' : '傾斜手機體驗立體效果'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
