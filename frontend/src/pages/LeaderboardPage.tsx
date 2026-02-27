import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { leaderboardService, LeaderboardEntry, LeaderboardType } from '../services/leaderboard.service';
import { LeaderboardRowSkeleton } from '../components/skeletons';
import { EmptyState } from '../components/EmptyState';

export const LeaderboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const TAB_LABELS: Record<LeaderboardType, string> = {
    weekly_km: t('weeklyKm'),
    monthly_km: t('monthlyKm'),
    weekly_runs: t('weeklyRuns'),
    monthly_runs: t('monthlyRuns'),
  };
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<LeaderboardType>('weekly_km');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    leaderboardService
      .getLeaderboard(tab)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error?.message || t('loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tab]);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return undefined;
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <EmojiEventsIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h4" component="h1">
          {t('leaderboardTitle')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={TAB_LABELS.weekly_km} value="weekly_km" />
        <Tab label={TAB_LABELS.monthly_km} value="monthly_km" />
        <Tab label={TAB_LABELS.weekly_runs} value="weekly_runs" />
        <Tab label={TAB_LABELS.monthly_runs} value="monthly_runs" />
      </Tabs>

      <Paper>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <LeaderboardRowSkeleton key={i} />
            ))}
          </Box>
        ) : entries.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <EmptyState variant="no-data" title={t('noData')} />
          </Box>
        ) : (
          <List>
            {entries.map((e) => (
              <ListItem
                key={e.userId}
                button
                onClick={() => navigate(`/users/${e.userId}`)}
                sx={{
                  borderLeft: e.rank <= 3 ? `4px solid ${getMedalColor(e.rank)}` : undefined,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getMedalColor(e.rank) || 'primary.main', width: 36, height: 36 }}>
                    {e.rank <= 3 ? '🏅' : e.rank}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={e.displayName}
                  secondary={`${e.value} ${e.unit}`}
                  primaryTypographyProps={{ fontWeight: e.rank <= 3 ? 600 : 400 }}
                />
                <Typography variant="body2" color="text.secondary">
                  #{e.rank}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};
