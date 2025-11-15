import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { userService } from '../services/user.service';
import { UserSearchResult } from '../types/user.types';
import { UserCard } from '../components/UserCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const FollowersPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [followers, setFollowers] = useState<UserSearchResult[]>([]);
  const [following, setFollowing] = useState<UserSearchResult[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(true);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(true);
  const [followersError, setFollowersError] = useState<string | null>(null);
  const [followingError, setFollowingError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchFollowers = async () => {
      setIsLoadingFollowers(true);
      setFollowersError(null);
      try {
        const data = await userService.getFollowers(userId);
        setFollowers(data);
      } catch (err: any) {
        setFollowersError(err.response?.data?.error?.message || '無法載入追蹤者列表');
      } finally {
        setIsLoadingFollowers(false);
      }
    };

    const fetchFollowing = async () => {
      setIsLoadingFollowing(true);
      setFollowingError(null);
      try {
        const data = await userService.getFollowing(userId);
        setFollowing(data);
      } catch (err: any) {
        setFollowingError(err.response?.data?.error?.message || '無法載入追蹤中列表');
      } finally {
        setIsLoadingFollowing(false);
      }
    };

    fetchFollowers();
    fetchFollowing();
  }, [userId]);

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    // Update followers list
    setFollowers((prev) =>
      prev.map((user) =>
        user.id === targetUserId ? { ...user, isFollowing } : user
      )
    );

    // Update following list
    setFollowing((prev) =>
      prev.map((user) =>
        user.id === targetUserId ? { ...user, isFollowing } : user
      )
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          社交連結
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={`追蹤者 (${followers.length})`} />
            <Tab label={`追蹤中 (${following.length})`} />
          </Tabs>
        </Box>

        {/* Followers Tab */}
        <TabPanel value={tabValue} index={0}>
          {isLoadingFollowers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : followersError ? (
            <Alert severity="error">{followersError}</Alert>
          ) : followers.length === 0 ? (
            <Alert severity="info">尚無追蹤者</Alert>
          ) : (
            <Grid container spacing={2}>
              {followers.map((user) => (
                <Grid item xs={12} key={user.id}>
                  <UserCard user={user} onFollowChange={handleFollowChange} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Following Tab */}
        <TabPanel value={tabValue} index={1}>
          {isLoadingFollowing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : followingError ? (
            <Alert severity="error">{followingError}</Alert>
          ) : following.length === 0 ? (
            <Alert severity="info">尚未追蹤任何人</Alert>
          ) : (
            <Grid container spacing={2}>
              {following.map((user) => (
                <Grid item xs={12} key={user.id}>
                  <UserCard user={user} onFollowChange={handleFollowChange} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};
