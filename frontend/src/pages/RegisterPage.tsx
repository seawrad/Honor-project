import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Checkbox,
  FormControlLabel,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { RegisterData } from '../types/auth.types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    displayName: '',
    age: 0,
    agreedToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('passwordMinLength');
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = t('passwordRule');
    }

    if (!formData.displayName) {
      newErrors.displayName = t('displayNameRequired');
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = t('displayNameMin');
    }

    if (!formData.age) {
      newErrors.age = t('ageRequired');
    } else if (formData.age < 18 || formData.age > 65) {
      newErrors.age = t('ageRange');
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = t('termsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData);
      // Redirect to login page after successful registration
      navigate('/login', {
        state: { message: t('registerSuccess') },
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        const errorCode = error.response.data.error.code;
        const errorMessage = error.response.data.error.message;
        
        if (errorCode === 'VALIDATION_DUPLICATE_EMAIL') {
          setErrors({ email: t('duplicateEmail') });
        } else if (errorCode === 'VALIDATION_AGE_RESTRICTION') {
          setErrors({ age: t('ageRange') });
        } else {
          setApiError(errorMessage || t('registerFailed'));
        }
      } else {
        setApiError(t('registerFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: { xs: 2, sm: 4, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            {t('registerTitle')}
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            {t('registerWelcome')}
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || t('passwordMinLength')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      onClick={() => setShowPassword((p) => !p)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="displayName"
              label={t('displayName')}
              id="displayName"
              autoComplete="name"
              value={formData.displayName}
              onChange={handleChange}
              error={!!errors.displayName}
              helperText={errors.displayName}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="age"
              label={t('age')}
              type="number"
              id="age"
              value={formData.age || ''}
              onChange={handleChange}
              error={!!errors.age}
              helperText={errors.age || t('ageRange')}
              inputProps={{ min: 18, max: 65 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="agreedToTerms"
                  color="primary"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                />
              }
              label={
                <Typography variant="body2">
                  {t('agreeTermsPrefix')}
                  <Link href="/terms" target="_blank">
                    {t('terms')}
                  </Link>
                  {t('agreeTermsMiddle')}
                  <Link href="/privacy" target="_blank">
                    {t('privacyPolicy')}
                  </Link>
                </Typography>
              }
            />
            {errors.agreedToTerms && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                {errors.agreedToTerms}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('registering') : t('register')}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                {t('haveAccount')}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
