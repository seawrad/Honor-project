import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { WifiOff } from '@mui/icons-material';

export const OfflinePage = () => {
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
            無網路連線
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            您目前處於離線狀態。某些功能可能無法使用。
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            請檢查您的網路連線，然後重試。
          </Typography>

          <Button
            variant="contained"
            onClick={handleRetry}
            sx={{ mt: 2 }}
          >
            重新連線
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};
