import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { WifiOff } from '@mui/icons-material';

export const OfflinePage = () => {
  const { t } = useTranslation();
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: { xs: 4, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, width: '100%', textAlign: 'center' }}>
          <WifiOff sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          
          <Typography variant="h4" gutterBottom>
            {t('noConnection')}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('offlineDesc')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('checkConnection')}
          </Typography>

          <Button
            variant="contained"
            onClick={handleRetry}
            sx={{ mt: 2 }}
          >
            {t('reconnect')}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};
