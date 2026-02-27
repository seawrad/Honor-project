import { Card, CardContent, Skeleton } from '@mui/material';

export const AchievementCardSkeleton: React.FC = () => (
  <Card>
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 1 }} />
      <Skeleton variant="text" width="60%" height={24} sx={{ mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="90%" height={20} sx={{ mx: 'auto' }} />
      <Skeleton variant="rounded" width={80} height={24} sx={{ mx: 'auto', mt: 1.5 }} />
    </CardContent>
  </Card>
);
