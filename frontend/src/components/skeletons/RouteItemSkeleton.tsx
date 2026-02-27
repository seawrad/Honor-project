import { Card, CardContent, Skeleton } from '@mui/material';

export const RouteItemSkeleton: React.FC = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width={140} height={28} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" height={24} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="55%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1, pt: 1 }} />
    </CardContent>
  </Card>
);
