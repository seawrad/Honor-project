import { Paper, Box, Skeleton, Grid } from '@mui/material';

export const ProfileSkeleton: React.FC = () => (
  <Paper sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      <Skeleton variant="circular" width={80} height={80} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={180} height={32} />
        <Skeleton variant="text" width={120} height={24} sx={{ mt: 0.5 }} />
      </Box>
    </Box>
    <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  </Paper>
);
