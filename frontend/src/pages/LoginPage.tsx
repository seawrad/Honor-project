import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Paper,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { LoginCredentials } from '../types/auth.types';
import { tokenStorage } from '../utils/tokenStorage';
import { RunCrewLoadingScreen } from '../components/RunCrewLoadingScreen';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { login } = useAuth();

  const rememberedEmail = tokenStorage.getRememberedEmail();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: rememberedEmail ?? '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [rememberEmail, setRememberEmail] = useState(!!rememberedEmail);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessTransition, setShowSuccessTransition] = useState(false);

  const successMessage = location.state?.message as string | undefined;
  const from = (location.state?.from?.pathname as string) || '/';

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (apiError) {
      setApiError('');
    }
  };

  const handleCompleteTransition = useCallback(() => {
    setShowSuccessTransition(false);
    navigate(from, { replace: true });
  }, [navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData, { keepLoggedIn });

      if (rememberEmail) {
        tokenStorage.setRememberedEmail(formData.email);
      } else {
        tokenStorage.clearRememberedEmail();
      }

      setIsSubmitting(false);
      setShowSuccessTransition(true);
    } catch (error: any) {
      if (error.response?.data?.error) {
        const errorCode = error.response.data.error.code;
        const errorMessage = error.response.data.error.message;

        if (errorCode === 'AUTH_INVALID_CREDENTIALS') {
          setApiError(t('invalidCredentials'));
        } else {
          setApiError(errorMessage || t('loginFailed'));
        }
      } else if (error.request) {
        setApiError(t('networkError'));
      } else {
        setApiError(t('loginFailed'));
      }

      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    }
  };

  if (showSuccessTransition) {
    return <RunCrewLoadingScreen onComplete={handleCompleteTransition} duration={4800} />;
  }

  return (
    <Box className="login-page-root">
      <IconButton
        component={RouterLink}
        to="/settings"
        aria-label={t('settings')}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10,
          color: 'rgba(255, 255, 255, 0.95)',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
        }}
      >
        <SettingsIcon />
      </IconButton>

      <Box className="login-page-inner">
        {/* Logo area – RunCrew branding */}
        <Box className="login-page-logo" component="div">
          <img src="/Main_logo.png" alt="RunCrew" />
        </Box>

        <Paper
          elevation={0}
          className="login-page-card"
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            bgcolor: '#ffffff',
            color: 'rgba(0,0,0,0.87)',
            '& .MuiFormLabel-root, & .MuiInputBase-input': { color: 'rgba(0,0,0,0.87)' },
            '& .MuiFormHelperText-root': { color: 'rgba(0,0,0,0.6)' },
            '& .MuiTypography-root': { color: 'inherit' },
            '& .MuiTypography-colorSecondary': { color: 'rgba(0,0,0,0.6)' },
          }}
        >

          <Typography component="h1" variant="h5" align="center" fontWeight="700" gutterBottom sx={{ color: 'text.primary' }}>
            {t('loginTitle')}
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            {t('loginWelcome')}
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} variant="standard">
              {successMessage}
            </Alert>
          )}

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }} variant="standard">
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('email')}
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      onClick={() => setShowPassword((p) => !p)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      sx={{ color: 'rgba(0,0,0,0.7)', '&:hover': { color: 'rgba(0,0,0,0.87)' } }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('keepLoggedIn')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('rememberEmail')}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {isSubmitting ? t('loggingIn') : t('login')}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2" underline="hover">
                {t('noAccount')}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
