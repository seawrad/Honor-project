import { useState, useCallback } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { ArrowBack, Save, Schedule, Route } from '@mui/icons-material';
import { LocationPicker } from '../components/LocationPicker';
import { activityService } from '../services/activity.service';
import { CreateActivityData, ActivityType, Location } from '../types/activity.types';

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ESTIMATED_PACE_KM_PER_HOUR = 10;

interface FormErrors {
  title?: string;
  description?: string;
  scheduledDate?: string;
  location?: string;
  endLocation?: string;
  route?: string;
  distance?: string;
  durationMinutes?: string;
  maxParticipants?: string;
}

export const CreateActivityPage = () => {
  const navigate = useNavigate();
  const [activityType, setActivityType] = useState<ActivityType>('time-based');
  const [formData, setFormData] = useState<Partial<CreateActivityData>>({
    title: '',
    description: '',
    scheduledDate: '',
    location: undefined,
    endLocation: undefined,
    route: '',
    distance: 0,
    durationMinutes: 30,
    maxParticipants: 10,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (_e: React.MouseEvent<HTMLElement>, value: ActivityType | null) => {
    if (value) {
      setActivityType(value);
      if (value === 'time-based') {
        const mins = formData.durationMinutes ?? 30;
        const dist = (mins / 60) * ESTIMATED_PACE_KM_PER_HOUR;
        setFormData((prev) => ({
          ...prev,
          endLocation: undefined,
          route: '',
          distance: Math.round(dist * 10) / 10,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          durationMinutes: undefined,
          route: prev.location && prev.endLocation
            ? `從 ${prev.location.address} 至 ${prev.endLocation.address}`
            : '',
          distance: 0,
        }));
      }
    }
  };

  const handleChange = useCallback(
    (field: keyof CreateActivityData, value: unknown) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'durationMinutes' && activityType === 'time-based' && typeof value === 'number') {
          next.distance = Math.round((value / 60) * ESTIMATED_PACE_KM_PER_HOUR * 10) / 10;
        }
        if (field === 'location' && activityType === 'route-based') {
          const loc = value as Location | undefined;
          const end = next.endLocation;
          if (loc && end) {
            next.route = `從 ${loc.address} 至 ${end.address}`;
            next.distance = Math.round(haversineDistanceKm(loc.latitude, loc.longitude, end.latitude, end.longitude) * 10) / 10;
          }
        }
        if (field === 'endLocation' && activityType === 'route-based') {
          const end = value as Location | undefined;
          const start = next.location;
          if (start && end) {
            next.route = `從 ${start.address} 至 ${end.address}`;
            next.distance = Math.round(haversineDistanceKm(start.latitude, start.longitude, end.latitude, end.longitude) * 10) / 10;
          }
        }
        return next;
      });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [activityType]
  );

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
    } else if (new Date(formData.scheduledDate) <= new Date()) {
      newErrors.scheduledDate = '活動時間必須在未來';
    }
    if (!formData.location) {
      newErrors.location = '請選擇起點';
    }
    if (activityType === 'route-based' && !formData.endLocation) {
      newErrors.endLocation = '請選擇終點';
    }
    if (activityType === 'time-based') {
      if (!formData.durationMinutes || formData.durationMinutes <= 0) {
        newErrors.durationMinutes = '請輸入預計跑步時間（分鐘）';
      }
    }
    if (!formData.distance || formData.distance <= 0) {
      newErrors.distance = '距離需大於 0';
    }
    if (!formData.maxParticipants || formData.maxParticipants < 2) {
      newErrors.maxParticipants = '參加人數上限至少為 2 人';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !formData.location) return;

    const route =
      activityType === 'route-based' && formData.route
        ? formData.route
        : activityType === 'time-based'
        ? formData.route || `預計跑步 ${formData.durationMinutes} 分鐘`
        : formData.route || '';

    const payload: CreateActivityData = {
      title: formData.title!,
      description: formData.description!,
      scheduledDate: formData.scheduledDate!,
      location: formData.location,
      route,
      distance: formData.distance!,
      maxParticipants: formData.maxParticipants!,
      activityType,
      durationMinutes: activityType === 'time-based' ? formData.durationMinutes : undefined,
      endLocation: activityType === 'route-based' ? formData.endLocation : undefined,
    };

    try {
      setLoading(true);
      setSubmitError(null);
      const activity = await activityService.createActivity(payload);
      navigate(`/activities/${activity.id}`);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : null;
      setSubmitError(message || '建立活動失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/activities')} sx={{ mb: 3 }}>
        返回列表
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          建立跑步活動
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            活動類型
          </Typography>
          <ToggleButtonGroup
            value={activityType}
            exclusive
            onChange={handleTypeChange}
            aria-label="activity type"
          >
            <ToggleButton value="time-based" aria-label="time-based">
              <Schedule sx={{ mr: 1 }} />
              時間導向（設起點 + 跑步時長）
            </ToggleButton>
            <ToggleButton value="route-based" aria-label="route-based">
              <Route sx={{ mr: 1 }} />
              路線導向（設起點 + 終點）
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

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
                onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value) || 0)}
                fullWidth
                required
                inputProps={{ min: 2 }}
                error={!!errors.maxParticipants}
                helperText={errors.maxParticipants}
              />
            </Grid>

            {activityType === 'time-based' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="預計跑步時間（分鐘）"
                  type="number"
                  value={formData.durationMinutes ?? ''}
                  onChange={(e) => handleChange('durationMinutes', parseInt(e.target.value) || 0)}
                  fullWidth
                  required
                  inputProps={{ min: 5, max: 300 }}
                  error={!!errors.durationMinutes}
                  helperText={errors.durationMinutes || '距離會依約 10 km/h 自動估算'}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                label="距離（公里）"
                type="number"
                value={formData.distance ?? ''}
                onChange={(e) => handleChange('distance', parseFloat(e.target.value) || 0)}
                fullWidth
                required
                inputProps={{ min: 0.1, step: 0.1 }}
                error={!!errors.distance}
                helperText={errors.distance}
                disabled={activityType === 'time-based'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={activityType === 'time-based' ? '路線說明（選填）' : '路線說明'}
                value={formData.route}
                onChange={(e) => handleChange('route', e.target.value)}
                fullWidth
                required={activityType === 'route-based'}
                error={!!errors.route}
                helperText={
                  activityType === 'route-based'
                    ? '設定起點與終點後將自動產生'
                    : errors.route
                }
                disabled={activityType === 'route-based'}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                起點
              </Typography>
              <LocationPicker
                value={formData.location || null}
                onChange={(location) => handleChange('location', location)}
                error={!!errors.location}
                helperText={errors.location}
              />
            </Grid>

            {activityType === 'route-based' && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  終點
                </Typography>
                <LocationPicker
                  value={formData.endLocation || null}
                  onChange={(location) => handleChange('endLocation', location)}
                  error={!!errors.endLocation}
                  helperText={errors.endLocation}
                />
              </Grid>
            )}

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
