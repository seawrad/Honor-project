import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { LocationPicker } from '../components/LocationPicker';
import { activityService } from '../services/activity.service';
import { UpdateActivityData } from '../types/activity.types';

interface FormErrors {
  title?: string;
  description?: string;
  scheduledDate?: string;
  location?: string;
  route?: string;
  distance?: string;
  maxParticipants?: string;
}

export const EditActivityPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<UpdateActivityData>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadActivity = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const activity = await activityService.getActivityById(id);
        
        // Check if editing is allowed (1 hour before start)
        const timeUntilStart = new Date(activity.scheduledDate).getTime() - Date.now();
        if (timeUntilStart < 3600000) {
          setSubmitError('無法編輯：活動開始前 1 小時內不可編輯');
        }

        // Format date for datetime-local input
        const scheduledDate = new Date(activity.scheduledDate);
        const formattedDate = scheduledDate.toISOString().slice(0, 16);

        setFormData({
          title: activity.title,
          description: activity.description,
          scheduledDate: formattedDate,
          location: activity.location,
          route: activity.route,
          distance: activity.distance,
          maxParticipants: activity.maxParticipants,
        });
      } catch (err: any) {
        setSubmitError(err.response?.data?.error?.message || '載入活動失敗');
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.title !== undefined && formData.title.trim().length === 0) {
      newErrors.title = '請輸入活動標題';
    }

    if (formData.description !== undefined && formData.description.trim().length === 0) {
      newErrors.description = '請輸入活動描述';
    }

    if (formData.scheduledDate) {
      const scheduledTime = new Date(formData.scheduledDate).getTime();
      if (scheduledTime <= Date.now()) {
        newErrors.scheduledDate = '活動時間必須在未來';
      }
      if (scheduledTime - Date.now() < 3600000) {
        newErrors.scheduledDate = '活動時間必須在 1 小時後';
      }
    }

    if (formData.route !== undefined && formData.route.trim().length === 0) {
      newErrors.route = '請輸入路線說明';
    }

    if (formData.distance !== undefined && formData.distance <= 0) {
      newErrors.distance = '請輸入有效的距離';
    }

    if (formData.maxParticipants !== undefined && formData.maxParticipants < 2) {
      newErrors.maxParticipants = '參加人數上限至少為 2 人';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setSubmitError(null);
      
      await activityService.updateActivity(id, formData);
      navigate(`/activities/${id}`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || '更新活動失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateActivityData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  const isEditingDisabled = submitError?.includes('無法編輯');

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
        <Typography variant="h4" component="h1" gutterBottom>
          編輯活動
        </Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="活動標題"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                fullWidth
                error={!!errors.title}
                helperText={errors.title}
                disabled={isEditingDisabled}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="活動描述"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                fullWidth
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description}
                disabled={isEditingDisabled}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="活動時間"
                type="datetime-local"
                value={formData.scheduledDate || ''}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.scheduledDate}
                helperText={errors.scheduledDate}
                disabled={isEditingDisabled}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="參加人數上限"
                type="number"
                value={formData.maxParticipants || ''}
                onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))}
                fullWidth
                inputProps={{ min: 2 }}
                error={!!errors.maxParticipants}
                helperText={errors.maxParticipants}
                disabled={isEditingDisabled}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="距離（公里）"
                type="number"
                value={formData.distance || ''}
                onChange={(e) => handleChange('distance', parseFloat(e.target.value))}
                fullWidth
                inputProps={{ min: 0.1, step: 0.1 }}
                error={!!errors.distance}
                helperText={errors.distance}
                disabled={isEditingDisabled}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="路線說明"
                value={formData.route || ''}
                onChange={(e) => handleChange('route', e.target.value)}
                fullWidth
                error={!!errors.route}
                helperText={errors.route}
                disabled={isEditingDisabled}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                活動地點
              </Typography>
              <LocationPicker
                value={formData.location || null}
                onChange={(location) => handleChange('location', location)}
                error={!!errors.location}
                helperText={errors.location}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  fullWidth
                  disabled={saving || isEditingDisabled}
                >
                  {saving ? '儲存中...' : '儲存變更'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/activities/${id}`)}
                  fullWidth
                  disabled={saving}
                >
                  取消
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};
