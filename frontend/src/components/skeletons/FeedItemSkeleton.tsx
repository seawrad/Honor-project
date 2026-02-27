import { Paper, Box, Skeleton } from '@mui/material';

export const FeedItemSkeleton: React.FC = () => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Skeleton variant="circular" width={48} height={48} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={150} height={24} />
        <Skeleton variant="text" width={100} height={20} />
      </Box>
    </Box>
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="rectangular" height={160} sx={{ mt: 1.5, borderRadius: 2 }} />
  </Paper>
);
