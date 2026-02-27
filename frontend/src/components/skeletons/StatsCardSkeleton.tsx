import { Paper, Skeleton } from '@mui/material';

export const StatsCardSkeleton: React.FC = () => (
  <Paper sx={{ p: 2, textAlign: 'center' }}>
    <Skeleton variant="circular" width={36} height={36} sx={{ mx: 'auto', mb: 1 }} />
    <Skeleton variant="text" width={60} height={40} sx={{ mx: 'auto', mb: 0.5 }} />
    <Skeleton variant="text" width={100} height={20} sx={{ mx: 'auto' }} />
  </Paper>
);
