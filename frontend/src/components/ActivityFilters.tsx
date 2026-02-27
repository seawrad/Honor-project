import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Slider,
  Typography,
  Button,
  Grid,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FilterList, ExpandMore, ExpandLess, Search } from '@mui/icons-material';
import { ActivityFilters as ActivityFiltersType, ActivityType } from '../types/activity.types';

interface ActivityFiltersProps {
  onFiltersChange: (filters: ActivityFiltersType) => void;
}

export const ActivityFilters = ({ onFiltersChange }: ActivityFiltersProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [distanceRange, setDistanceRange] = useState<number[]>([0, 50]);
  const [radius, setRadius] = useState(10);
  const [activityType, setActivityType] = useState<ActivityType | ''>('');

  const handleApplyFilters = (keywordOverride?: string) => {
    const filters: ActivityFiltersType = {};
    const kw = (keywordOverride ?? keyword).trim();

    if (kw) {
      filters.keyword = kw;
    }
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom).toISOString();
    }
    if (dateTo) {
      filters.dateTo = new Date(dateTo).toISOString();
    }
    if (distanceRange[0] > 0 || distanceRange[1] < 50) {
      filters.distanceMin = distanceRange[0];
      filters.distanceMax = distanceRange[1];
    }
    if (radius < 50) {
      filters.radius = radius;
    }
    if (activityType) {
      filters.activityType = activityType;
    }

    onFiltersChange(filters);
  };

  const handleResetFilters = () => {
    setKeyword('');
    setDateFrom('');
    setDateTo('');
    setDistanceRange([0, 50]);
    setRadius(10);
    setActivityType('');
    onFiltersChange({});
  };

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterList sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {t('filterConditions')}
          </Typography>
        </Box>
        <IconButton 
          onClick={() => setExpanded(!expanded)}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder={t('activitySearchPlaceholder')}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const value = (e.target as HTMLInputElement).value;
            setKeyword(value);
            handleApplyFilters(value);
          }
        }}
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />,
        }}
        sx={{ mt: 2 }}
      />

      <Collapse in={expanded}>
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('startDate')}
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('endDate')}
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="activity-type-label">{t('activityType')}</InputLabel>
                <Select
                  labelId="activity-type-label"
                  label={t('activityType')}
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ActivityType | '')}
                >
                  <MenuItem value="">{t('all')}</MenuItem>
                  <MenuItem value="time-based">{t('timeBased')}</MenuItem>
                  <MenuItem value="route-based">{t('routeBased')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                {t('distanceRange', { min: distanceRange[0], max: distanceRange[1] })}
              </Typography>
              <Slider
                value={distanceRange}
                onChange={(_e, newValue) => setDistanceRange(newValue as number[])}
                valueLabelDisplay="auto"
                min={0}
                max={50}
                step={1}
                sx={{
                  '& .MuiSlider-thumb': {
                    width: { xs: 20, sm: 24 },
                    height: { xs: 20, sm: 24 },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                {t('searchRadius', { radius })}
              </Typography>
              <Slider
                value={radius}
                onChange={(_e, newValue) => setRadius(newValue as number)}
                valueLabelDisplay="auto"
                min={1}
                max={50}
                step={1}
                sx={{
                  '& .MuiSlider-thumb': {
                    width: { xs: 20, sm: 24 },
                    height: { xs: 20, sm: 24 },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => handleApplyFilters()}
                  fullWidth
                  sx={{ minHeight: 44 }}
                >
                  {t('applyFilters')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  fullWidth
                  sx={{ minHeight: 44 }}
                >
                  {t('resetFilters')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};
