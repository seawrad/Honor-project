import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Container,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            size={isMobile ? 'medium' : 'large'}
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? 'Running App' : (title || 'Group Running App')}
          </Typography>
          {isAuthenticated && <NotificationBell />}
        </Toolbar>
      </AppBar>
      <Container 
        component="main" 
        sx={{ 
          flex: 1, 
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3 },
        }}
        maxWidth="xl"
      >
        {children}
      </Container>
    </Box>
  );
};
