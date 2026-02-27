import { Card, CardContent, CardActions, Box, Skeleton } from '@mui/material';

export const ActivityCardSkeleton: React.FC = () => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flex: 1 }}>
      <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
      </Box>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="50%" sx={{ mt: 1 }} />
    </CardContent>
    <CardActions>
      <Skeleton variant="rounded" width={100} height={36} />
    </CardActions>
  </Card>
);
