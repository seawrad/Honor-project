import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
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
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
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

          <Box sx={{ mt: 4 }}>
            <Button variant="contained" color="primary" sx={{ mr: 2 }}>
              探索活動
            </Button>
            <Button variant="outlined" color="primary" sx={{ mr: 2 }}>
              建立活動
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleLogout}>
              登出
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
