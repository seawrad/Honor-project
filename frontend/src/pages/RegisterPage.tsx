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
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { RegisterData } from '../types/auth.types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    displayName: '',
    age: 0,
    agreedToTerms: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = '電子郵件為必填';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = '密碼為必填';
    } else if (formData.password.length < 8) {
      newErrors.password = '密碼至少需要 8 個字元';
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = '密碼必須包含字母和數字';
    }

    // Display name validation
    if (!formData.displayName) {
      newErrors.displayName = '顯示名稱為必填';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = '顯示名稱至少需要 2 個字元';
    }

    // Age validation (18-65)
    if (!formData.age) {
      newErrors.age = '年齡為必填';
    } else if (formData.age < 18 || formData.age > 65) {
      newErrors.age = '年齡必須在 18 到 65 歲之間';
    }

    // Terms acceptance validation
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = '您必須同意服務條款';
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
        state: { message: '註冊成功！請登入您的帳戶。' } 
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        const errorCode = error.response.data.error.code;
        const errorMessage = error.response.data.error.message;
        
        if (errorCode === 'VALIDATION_DUPLICATE_EMAIL') {
          setErrors({ email: '此電子郵件已被註冊' });
        } else if (errorCode === 'VALIDATION_AGE_RESTRICTION') {
          setErrors({ age: '年齡必須在 18 到 65 歲之間' });
        } else {
          setApiError(errorMessage || '註冊失敗，請稍後再試');
        }
      } else {
        setApiError('註冊失敗，請檢查您的網路連線');
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
            註冊
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            加入 Group Running App 開始您的跑步之旅
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
              label="電子郵件"
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
              label="密碼"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || '至少 8 個字元，包含字母和數字'}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="displayName"
              label="顯示名稱"
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
              label="年齡"
              type="number"
              id="age"
              value={formData.age || ''}
              onChange={handleChange}
              error={!!errors.age}
              helperText={errors.age || '必須年滿 18 歲且不超過 65 歲'}
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
                  我同意{' '}
                  <Link href="/terms" target="_blank">
                    服務條款
                  </Link>{' '}
                  和{' '}
                  <Link href="/privacy" target="_blank">
                    隱私政策
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
              {isSubmitting ? '註冊中...' : '註冊'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                已有帳戶？登入
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
