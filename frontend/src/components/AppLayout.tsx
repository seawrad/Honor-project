import React, { useState, useEffect } from 'react';
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
  CircularProgress,
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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { FriendChatButton } from './FriendChatButton';
import { DMChatBox } from './DMChatBox';
import { OfflineIndicator } from './OfflineIndicator';
import { BackToTop } from './BackToTop';
import { DevModeBanner } from './DevModeBanner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useDMChat } from '../contexts/DMChatContext';
import { userService } from '../services/user.service';
import { dmService } from '../services/dm.service';

const DRAWER_WIDTH = 260;

interface Friend {
  id: string;
  displayName: string;
}

const navGroups = [
  {
    labelKey: 'explore' as const,
    items: [
      { path: '/', key: 'home', icon: <HomeIcon /> },
      { path: '/activities', key: 'activities', icon: <EventIcon /> },
      { path: '/feed', key: 'feed', icon: <RssFeedIcon /> },
    ],
  },
  {
    labelKey: 'myActivity' as const,
    items: [
      { path: '/chat-list', key: 'chat', icon: <ChatIcon /> },
      { path: '/achievements', key: 'achievements', icon: <EmojiEventsIcon /> },
      { path: '/stats', key: 'stats', icon: <TrendingUpIcon /> },
      { path: '/leaderboard', key: 'leaderboard', icon: <LeaderboardIcon /> },
      { path: '/routes/history', key: 'routeHistory', icon: <RouteIcon /> },
    ],
  },
  {
    labelKey: 'actions' as const,
    items: [
      { path: '/activities/create', key: 'createActivity', icon: <AddIcon /> },
      { path: '/users/search', key: 'searchUsers', icon: <PeopleIcon /> },
    ],
  },
];

export const AppLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { openChat } = useDMChat();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  useEffect(() => {
    if (drawerOpen && isAuthenticated) {
      let cancelled = false;
      setFriendsLoading(true);
      userService
        .getFriends()
        .then((data) => {
          if (!cancelled) setFriends(data);
        })
        .catch(() => {
          if (!cancelled) setFriends([]);
        })
        .finally(() => {
          if (!cancelled) setFriendsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [drawerOpen, isAuthenticated]);

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

  const handleDrawerFriendClick = async (friend: Friend) => {
    try {
      const room = await dmService.getOrCreateRoom(friend.id);
      openChat(room);
      handleDrawerClose();
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  };

  const drawer = (
    <Box sx={{ width: DRAWER_WIDTH, pt: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pb: 2 }}>
        {t('menu')}
      </Typography>
      <Divider />
      {navGroups.map((group) => (
        <Box key={group.labelKey} sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
            {t(group.labelKey)}
          </Typography>
          <List disablePadding>
            {group.items.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavClick(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={t(item.key)} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
      {isAuthenticated && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
            {t('friends')}
          </Typography>
          {friendsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : friends.length === 0 ? (
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('noFriendsYet')}
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {friends.map((friend) => (
                <ListItem key={friend.id} disablePadding>
                  <ListItemButton onClick={() => handleDrawerFriendClick(friend)}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ChatIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText primary={friend.displayName} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
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
              <FriendChatButton />
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

      <DevModeBanner />

      {/* User menu dropdown */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 200 } }}
        slotProps={{
          root: { sx: { zIndex: 1400 } },
        }}
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
          <ListItemText>{t('profile')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUserMenuItem('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('settings')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUserMenuItem('/chat-list')}>
          <ListItemIcon>
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('chat')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('logout')}</ListItemText>
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

      {isAuthenticated && <DMChatBox />}
      <OfflineIndicator />
      <BackToTop />
    </Box>
  );
};
