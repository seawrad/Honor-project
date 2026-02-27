import { Paper, Box, Skeleton } from '@mui/material';

export const LeaderboardRowSkeleton: React.FC = () => (
  <Paper sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Skeleton variant="circular" width={32} height={32} />
    <Skeleton variant="circular" width={40} height={40} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width={120} height={24} />
      <Skeleton variant="text" width={80} height={20} />
    </Box>
    <Skeleton variant="text" width={60} height={28} />
  </Paper>
);
