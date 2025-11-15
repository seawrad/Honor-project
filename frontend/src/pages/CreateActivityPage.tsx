import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { LocationPicker } from '../components/LocationPicker';
import { activityService } from '../services/activity.service';
import { CreateActivityData } from '../types/activity.types';

interface FormErrors {
  title?: string;
  description?: string;
  scheduledDate?: string;
  location?: string;
  route?: string;
  distance?: string;
  maxParticipants?: string;
}

export const CreateActivityPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<CreateActivityData>>({
    title: '',
    description: '',
    scheduledDate: '',
    location: undefined,
    route: '',
    distance: 0,
    maxParticipants: 10,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = '請輸入活動標題';
    }

    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = '請輸入活動描述';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = '請選擇活動時間';
    } else {
      const scheduledTime = new Date(formData.scheduledDate).getTime();
      if (scheduledTime <= Date.now()) {
        newErrors.scheduledDate = '活動時間必須在未來';
      }
    }

    if (!formData.location) {
      newErrors.location = '請選擇活動地點';
    }

    if (!formData.route || formData.route.trim().length === 0) {
      newErrors.route = '請輸入路線說明';
    }

    if (!formData.distance || formData.distance <= 0) {
      newErrors.distance = '請輸入有效的距離';
    }

    if (!formData.maxParticipants || formData.maxParticipants < 2) {
      newErrors.maxParticipants = '參加人數上限至少為 2 人';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);
      
      const activity = await activityService.createActivity(formData as CreateActivityData);
      navigate(`/activities/${activity.id}`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || '建立活動失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateActivityData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/activities')}
        sx={{ mb: 3 }}
      >
        返回列表
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          建立跑步活動
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
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="活動描述"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                fullWidth
                required
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="活動時間"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors.scheduledDate}
                helperText={errors.scheduledDate}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="參加人數上限"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))}
                fullWidth
                required
                inputProps={{ min: 2 }}
                error={!!errors.maxParticipants}
                helperText={errors.maxParticipants}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="距離（公里）"
                type="number"
                value={formData.distance}
                onChange={(e) => handleChange('distance', parseFloat(e.target.value))}
                fullWidth
                required
                inputProps={{ min: 0.1, step: 0.1 }}
                error={!!errors.distance}
                helperText={errors.distance}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="路線說明"
                value={formData.route}
                onChange={(e) => handleChange('route', e.target.value)}
                fullWidth
                required
                error={!!errors.route}
                helperText={errors.route}
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
                  disabled={loading}
                >
                  {loading ? '建立中...' : '建立活動'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/activities')}
                  fullWidth
                  disabled={loading}
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
