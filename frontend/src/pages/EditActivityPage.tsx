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
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          setSubmitError(t('cannotEditWithinHour'));
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
        setSubmitError(err.response?.data?.error?.message || t('loadActivityFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.title !== undefined && formData.title.trim().length === 0) {
      newErrors.title = t('titleRequired');
    }

    if (formData.description !== undefined && formData.description.trim().length === 0) {
      newErrors.description = t('descriptionRequired');
    }

    if (formData.scheduledDate) {
      const scheduledTime = new Date(formData.scheduledDate).getTime();
      if (scheduledTime <= Date.now()) {
        newErrors.scheduledDate = t('scheduledDateFuture');
      }
      if (scheduledTime - Date.now() < 3600000) {
        newErrors.scheduledDate = t('scheduledDateOneHour');
      }
    }

    if (formData.route !== undefined && formData.route.trim().length === 0) {
      newErrors.route = t('routeRequired');
    }

    if (formData.distance !== undefined && formData.distance <= 0) {
      newErrors.distance = t('validDistanceRequired');
    }

    if (formData.maxParticipants !== undefined && formData.maxParticipants < 2) {
      newErrors.maxParticipants = t('maxParticipantsMin');
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
      setSubmitError(err.response?.data?.error?.message || t('updateActivityFailed'));
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

  const isEditingDisabled = !!submitError && (submitError.includes('無法編輯') || submitError.includes('Cannot edit'));

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/activities/${id}`)}
        sx={{ mb: 3 }}
      >
        {t('backToActivityDetail')}
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('editActivity')}
        </Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {loading ? null : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label={t('activityTitle')}
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
                label={t('activityDescription')}
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
                label={t('scheduledDate')}
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
                label={t('maxParticipants')}
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
                label={`${t('distance')} (${t('kmShort')})`}
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
                label={t('routeDescriptionLabel')}
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
                {t('activityLocationLabel')}
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
                  {saving ? t('saving') : t('saveChanges')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/activities/${id}`)}
                  fullWidth
                  disabled={saving}
                >
                  {t('cancel')}
                </Button>
              </Box>
            </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};
