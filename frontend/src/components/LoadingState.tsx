import { Box, CircularProgress, Typography, Skeleton } from '@mui/material';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton';
  message?: string;
  count?: number;
}

export const LoadingState = ({ 
  type = 'spinner', 
  message = '載入中...',
  count = 3 
}: LoadingStateProps) => {
  if (type === 'skeleton') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: { xs: '200px', sm: '300px' },
        py: 4,
      }}
    >
      <CircularProgress size={48} />
      {message && (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};
