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
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess } from '@mui/icons-material';
import { ActivityFilters as ActivityFiltersType } from '../types/activity.types';

interface ActivityFiltersProps {
  onFiltersChange: (filters: ActivityFiltersType) => void;
}

export const ActivityFilters = ({ onFiltersChange }: ActivityFiltersProps) => {
  const [expanded, setExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [distanceRange, setDistanceRange] = useState<number[]>([0, 50]);
  const [radius, setRadius] = useState(10);

  const handleApplyFilters = () => {
    const filters: ActivityFiltersType = {};

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

    onFiltersChange(filters);
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setDistanceRange([0, 50]);
    setRadius(10);
    onFiltersChange({});
  };

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterList sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            篩選條件
          </Typography>
        </Box>
        <IconButton 
          onClick={() => setExpanded(!expanded)}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="開始日期"
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
                label="結束日期"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                距離範圍：{distanceRange[0]} - {distanceRange[1]} 公里
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
                搜尋半徑：{radius} 公里
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
                  onClick={handleApplyFilters}
                  fullWidth
                  sx={{ minHeight: 44 }}
                >
                  套用篩選
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  fullWidth
                  sx={{ minHeight: 44 }}
                >
                  重置
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};
