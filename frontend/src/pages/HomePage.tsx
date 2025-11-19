import React from 'react';
import { Container, Box, Typography, Button, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: { xs: 2, sm: 4, md: 8 } }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h3" gutterBottom>
            歡迎來到 Group Running App
          </Typography>
          
          <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
            您好，{user?.displayName}！
          </Typography>

          <Typography variant="body1" paragraph>
            電子郵件：{user?.email}
          </Typography>

          <Typography variant="body1" paragraph>
            年齡：{user?.age}
          </Typography>

          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ mt: 4 }}
          >
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={() => navigate('/activities')}
            >
              探索活動
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={() => navigate('/activities/create')}
            >
              建立活動
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={handleLogout}
            >
              登出
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};
