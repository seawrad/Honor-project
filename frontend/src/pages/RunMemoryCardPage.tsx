import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LenticularCard } from '../components/LenticularCard';
import { memoryCardService, RunMemoryCard } from '../services/memoryCard.service';
import { activityService } from '../services/activity.service';

export const RunMemoryCardPage: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<RunMemoryCard | null>(null);
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    memoryCardService
      .getById(cardId)
      .then((data) => {
        if (!cancelled) setCard(data);
        if (data.activityId) {
          return activityService.getActivityById(data.activityId);
        }
      })
      .then((activity) => {
        if (activity && !cancelled) setActivityTitle(activity.title);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error?.message || '無法載入記憶卡');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !card) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || '找不到此記憶卡'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/activities/${card.activityId}`)}
          variant="outlined"
        >
          返回活動
        </Button>
        <Typography variant="h5" component="h1">
          跑步記憶卡
        </Typography>
      </Box>

      <LenticularCard
        data={{
          id: card.id,
          activityId: card.activityId,
          participantCount: card.participantCount,
          totalDistance: card.totalDistance,
          averageSpeed: card.averageSpeed,
          durationSeconds: card.durationSeconds,
          runDate: card.runDate,
          weatherTemp: card.weatherTemp,
          weatherDesc: card.weatherDesc,
          newsHeadline: card.newsHeadline,
          aiImageUrl: card.aiImageUrl,
          groupPhotoUrl: card.groupPhotoUrl,
          messages: card.messages.map((m) => ({ displayName: m.displayName, content: m.content })),
        }}
        activityTitle={activityTitle}
      />
    </Container>
  );
};
