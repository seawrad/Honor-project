import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';
import { LenticularCard } from '../components/LenticularCard';
import { memoryCardService, RunMemoryCard } from '../services/memoryCard.service';
import { activityService } from '../services/activity.service';

export const RunMemoryCardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<RunMemoryCard | null>(null);
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

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
          return activityService.getActivityById(data.activityId).then((a) => a?.title ?? t('freeRun'));
        }
        return Promise.resolve(t('freeRun'));
      })
      .then((title) => {
        if (!cancelled) setActivityTitle(title);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error?.message || t('loadMemoryCardFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${t('runCrewMemoryCard')}: ${activityTitle} · ${(Number(card?.totalDistance) || 0).toFixed(1)} ${t('kmShort')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('runCrewMemoryCard'),
          text,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard?.writeText(`${text}\n${url}`);
        }
      }
    } else {
      navigator.clipboard?.writeText(`${text}\n${url}`);
    }
  };

  const handleDownload = async () => {
    if (!cardContainerRef.current || !card) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardContainerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1a237e',
      });
      const link = document.createElement('a');
      link.download = `RunCrew-${t('runMemoryCard')}-${new Date(card.runDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-TW')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (!loading && (error || !card)) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || t('memoryCardNotFound')}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          {t('back')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => card?.activityId ? navigate(`/activities/${card.activityId}`) : navigate(-1)}
            variant="outlined"
          >
            {t('back')}
          </Button>
          <Typography variant="h5" component="h1">
            {t('runMemoryCard')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={t('share')}>
            <IconButton onClick={handleShare} color="primary">
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('downloadImage')}>
            <IconButton onClick={handleDownload} disabled={downloading} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box ref={cardContainerRef}>
      {card && <LenticularCard
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
      />}
      </Box>
    </Container>
  );
};
