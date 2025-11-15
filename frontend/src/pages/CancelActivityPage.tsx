import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Cancel } from '@mui/icons-material';
import { activityService } from '../services/activity.service';
import { Activity } from '../types/activity.types';

export const CancelActivityPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const loadActivity = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await activityService.getActivityById(id);
        setActivity(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || '載入活動失敗');
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [id]);

  const handleCancelActivity = async () => {
    if (!id) return;

    try {
      setCancelling(true);
      setError(null);
      await activityService.deleteActivity(id);
      navigate('/activities', { 
        state: { message: '活動已成功取消，所有參加者已收到通知' } 
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '取消活動失敗');
      setConfirmOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!activity) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">找不到活動</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/activities')}
          sx={{ mt: 2 }}
        >
          返回列表
        </Button>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/activities/${id}`)}
        sx={{ mb: 3 }}
      >
        返回活動詳情
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom color="error">
          取消活動
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>警告：此操作無法復原</strong>
          </Typography>
          <Typography variant="body2">
            取消活動後，所有已報名的參加者將會收到通知。
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            活動資訊
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>標題：</strong>{activity.title}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>時間：</strong>{formatDate(activity.scheduledDate)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>地點：</strong>{activity.location.address}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>參加人數：</strong>{activity.currentParticipants} / {activity.maxParticipants} 人
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={() => setConfirmOpen(true)}
            fullWidth
            disabled={cancelling}
          >
            確認取消活動
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`/activities/${id}`)}
            fullWidth
            disabled={cancelling}
          >
            返回
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={confirmOpen}
        onClose={() => !cancelling && setConfirmOpen(false)}
      >
        <DialogTitle>確認取消活動</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要取消「{activity.title}」嗎？
            <br />
            <br />
            此操作無法復原，所有 {activity.currentParticipants} 位參加者將會收到取消通知。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={cancelling}
          >
            返回
          </Button>
          <Button
            onClick={handleCancelActivity}
            color="error"
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={24} /> : '確認取消'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
