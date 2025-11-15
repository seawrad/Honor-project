import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  Grid,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { userService } from '../services/user.service';
import { UserSearchResult } from '../types/user.types';
import { UserCard } from '../components/UserCard';

export const UserSearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await userService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '搜尋失敗');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setSearchResults((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing } : user
      )
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          搜尋使用者
        </Typography>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="輸入使用者名稱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isLoading && hasSearched && searchResults.length === 0 && (
          <Alert severity="info">找不到符合的使用者</Alert>
        )}

        {!isLoading && searchResults.length > 0 && (
          <Grid container spacing={2}>
            {searchResults.map((user) => (
              <Grid item xs={12} key={user.id}>
                <UserCard user={user} onFollowChange={handleFollowChange} />
              </Grid>
            ))}
          </Grid>
        )}

        {!hasSearched && !isLoading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              輸入名稱開始搜尋使用者
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
