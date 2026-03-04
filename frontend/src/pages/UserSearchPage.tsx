import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  Grid,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user.service';
import { UserSearchResult } from '../types/user.types';
import { UserCard } from '../components/UserCard';
import { useAuth } from '../hooks/useAuth';

export const UserSearchPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDeveloperMode } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadAllUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const results = await userService.searchUsers('', 1, 200);
      setSearchResults(results);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || t('searchFailed'));
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isDeveloperMode && !searchQuery.trim()) {
      loadAllUsers();
    }
  }, [isDeveloperMode, searchQuery, loadAllUsers]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else if (!isDeveloperMode) {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isDeveloperMode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await userService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('searchFailed'));
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
          {t('searchUsers')}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder={t('searchPlaceholder')}
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isDeveloperMode && !searchQuery.trim() && hasSearched && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('devModeAllUsers')}
          </Typography>
        )}

        {!isLoading && hasSearched && searchResults.length === 0 && (
          <Alert severity="info">{t('noMatchingUsers')}</Alert>
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
              {t('enterSearch')}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
