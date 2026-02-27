import React from 'react';
import { Box, Typography, Button } from '@mui/material';

type EmptyStateVariant =
  | 'no-activities'
  | 'no-routes'
  | 'no-achievements'
  | 'no-feed'
  | 'no-chat'
  | 'no-data'
  | 'no-friends';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const illustrations: Record<EmptyStateVariant, React.ReactNode> = {
  'no-activities': (
    <Box component="svg" viewBox="0 0 120 80" sx={{ width: 120, height: 80, opacity: 0.7 }}>
      <ellipse cx="60" cy="50" rx="45" ry="25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4} />
      <circle cx="35" cy="45" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      <circle cx="60" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      <circle cx="85" cy="45" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      <path d="M30 35 L35 30 L40 35" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.6} />
      <path d="M55 30 L60 25 L65 30" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.6} />
      <path d="M80 35 L85 30 L90 35" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.6} />
    </Box>
  ),
  'no-routes': (
    <Box component="svg" viewBox="0 0 120 80" sx={{ width: 120, height: 80, opacity: 0.7 }}>
      <path
        d="M20 60 Q40 30 60 45 T100 25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
        opacity={0.5}
      />
      <circle cx="20" cy="60" r="6" fill="currentColor" opacity={0.4} />
      <circle cx="100" cy="25" r="6" fill="currentColor" opacity={0.4} />
      <path d="M50 50 L55 45 L60 50" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.6} />
    </Box>
  ),
  'no-achievements': (
    <Box component="svg" viewBox="0 0 120 80" sx={{ width: 120, height: 80, opacity: 0.7 }}>
      <path
        d="M60 15 L70 35 L92 38 L75 52 L82 75 L60 63 L38 75 L45 52 L28 38 L50 35 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity={0.5}
      />
      <circle cx="60" cy="45" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4} />
    </Box>
  ),
  'no-feed': (
    <Box component="svg" viewBox="0 0 120 80" sx={{ width: 120, height: 80, opacity: 0.7 }}>
      <rect x="25" y="20" width="70" height="45" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4} />
      <circle cx="45" cy="35" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      <rect x="58" y="30" width="30" height="6" rx="2" fill="currentColor" opacity={0.3} />
      <rect x="58" y="42" width="25" height="6" rx="2" fill="currentColor" opacity={0.2} />
      <path d="M30 55 L35 50 L40 55" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.5} />
    </Box>
  ),
  'no-chat': (
    <Box component="svg" viewBox="0 0 120 80" sx={{ width: 120, height: 80, opacity: 0.7 }}>
      <path
        d="M25 25 L95 25 L95 55 L60 55 L55 65 L50 55 L25 55 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity={0.5}
      />
      <circle cx="45" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      <circle cx="75" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
    </Box>
  ),
  'no-data': (
    <Box component="svg" viewBox="0 0 120 80" sx={{ width: 120, height: 80, opacity: 0.7 }}>
      <rect x="30" y="35" width="15" height="35" rx="2" fill="currentColor" opacity={0.3} />
      <rect x="52" y="25" width="15" height="45" rx="2" fill="currentColor" opacity={0.3} />
      <rect x="74" y="40" width="15" height="30" rx="2" fill="currentColor" opacity={0.3} />
      <path d="M35 35 L45 45 L55 30 L65 40 L75 25" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.5} />
    </Box>
  ),
  'no-friends': (
    <Box component="svg" viewBox="0 0 120 80" sx={{ width: 120, height: 80, opacity: 0.7 }}>
      <circle cx="40" cy="35" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      <circle cx="80" cy="35" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      <path d="M30 55 Q40 70 60 70 Q80 70 90 55" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      <path d="M55 30 L60 25 L65 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.5} />
    </Box>
  ),
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 6,
      px: 3,
      bgcolor: 'action.hover',
      borderRadius: 3,
      border: '1px dashed',
      borderColor: 'divider',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 2,
        color: 'text.secondary',
      }}
    >
      {illustrations[variant]}
    </Box>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 320, mx: 'auto' }}>
        {description}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
        {actionLabel}
      </Button>
    )}
  </Box>
);
