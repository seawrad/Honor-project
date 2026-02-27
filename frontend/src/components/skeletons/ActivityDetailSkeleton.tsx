import { Paper, Box, Skeleton, Grid } from '@mui/material';

export const ActivityDetailSkeleton: React.FC = () => (
  <Paper sx={{ p: 3 }}>
    <Skeleton variant="text" width="70%" height={36} sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Skeleton variant="rounded" width={80} height={28} />
      <Skeleton variant="rounded" width={100} height={28} />
    </Box>
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={6} sm={3} key={i}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="80%" />
    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
      <Skeleton variant="rounded" width={120} height={40} />
      <Skeleton variant="rounded" width={120} height={40} />
    </Box>
  </Paper>
);
