import React from 'react';
import { Card, CardContent, Typography, Box, Avatar, Rating } from '@mui/material';
import { DirectionsRun } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { UserSearchResult } from '../types/user.types';
import { FollowButton } from './FollowButton';
import { useAuth } from '../hooks/useAuth';

interface UserCardProps {
  user: UserSearchResult;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onFollowChange }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === user.id;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the follow button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/users/${user.id}`);
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        '&:hover': { boxShadow: 6 },
        transition: 'box-shadow 0.3s',
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {user.displayName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DirectionsRun fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {user.totalRuns} 次跑步
                </Typography>
              </Box>
              {user.averageRating > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={user.averageRating} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary">
                    ({user.averageRating.toFixed(1)})
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          {!isOwnProfile && (
            <FollowButton
              userId={user.id}
              isFollowing={user.isFollowing}
              onFollowChange={(isFollowing) => onFollowChange?.(user.id, isFollowing)}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
