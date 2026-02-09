import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import RouteIcon from '@mui/icons-material/Route';
import PeopleIcon from '@mui/icons-material/People';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../hooks/useAuth';

const DRAWER_WIDTH = 260;

const navItems = [
  { path: '/', label: '首頁', icon: <HomeIcon /> },
  { path: '/activities', label: '跑步活動', icon: <EventIcon /> },
  { path: '/feed', label: '動態', icon: <RssFeedIcon /> },
  { path: '/activities/create', label: '建立活動', icon: <AddIcon /> },
  { path: '/routes/history', label: '路線紀錄', icon: <RouteIcon /> },
  { path: '/users/search', label: '搜尋用戶', icon: <PeopleIcon /> },
];

export const AppLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleDrawerClose = () => setDrawerOpen(false);
  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setUserMenuAnchor(e.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) handleDrawerClose();
  };

  const handleUserMenuItem = (path: string) => {
    handleUserMenuClose();
    navigate(path);
  };

  const drawer = (
    <Box sx={{ width: DRAWER_WIDTH, pt: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pb: 2 }}>
        選單
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavClick(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F7FBFF' }}>
      <AppBar position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            size={isMobile ? 'medium' : 'large'}
            edge="start"
            color="inherit"
            aria-label="open menu"
            onClick={handleDrawerToggle}
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
              component="button"
              onClick={() => handleNavClick('/')}
              aria-label="Go to homepage"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '9999px',
                p: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
              }}
            >
            <Box
              component="img"
              src="/Home_logo_rectangle.png"
              alt="RunCrew"
              sx={{
                height: { xs: 32, sm: 40 },
                width: 'auto',
                maxWidth: { xs: 140, sm: 180 },
                objectFit: 'contain',
                borderRadius: '9999px',
              }}
            />
            </Box>
          </Box>
          {isAuthenticated && (
            <>
              <NotificationBell />
              <IconButton
                color="inherit"
                onClick={handleUserMenuOpen}
                aria-label="user menu"
                sx={{ ml: 0.5 }}
              >
                <AccountCircleIcon fontSize={isMobile ? 'medium' : 'large'} />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* User menu dropdown */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {user?.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => user?.id && handleUserMenuItem(`/users/${user.id}`)}
          disabled={!user?.id}
        >
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>個人檔案</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUserMenuItem('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>設定</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUserMenuItem('/chat-list')}>
          <ListItemIcon>
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>聊天列表</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>登出</ListItemText>
        </MenuItem>
      </Menu>

      {/* Side drawer (mobile: temporary, desktop: can be persistent) */}
      <Drawer
        variant={isMobile ? 'temporary' : 'temporary'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Container
        component="main"
        sx={{
          flex: 1,
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3 },
        }}
        maxWidth="xl"
      >
        <Outlet />
      </Container>
    </Box>
  );
};
