import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth.service';
import { brandColors, brandGradient } from '../utils/brand';

const LoginScreen = ({ navigation, route }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const onAuthSuccess = route?.params?.onAuthSuccess as (() => void) | undefined;

  const handleLogin = async () => {
    if (!email || !password) {
      setMessageType('error');
      setMessage('Please fill in all fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await authService.login({ email, password });
      setMessageType('success');
      setMessage('Login successful. Redirecting...');
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid credentials or server error';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[...brandGradient]} style={styles.container}>
      <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoShell}>
            <Text style={styles.logoText}>RunCrew</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to explore activities, stats, and your running crew.</Text>

            {!!message && (
              <View
                style={[
                  styles.feedbackContainer,
                  messageType === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                ]}
              >
                <Text style={styles.feedbackText}>{message}</Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>No account yet? Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  settingsButton: {
    position: 'absolute',
    top: 22,
    right: 20,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logoShell: {
    alignSelf: 'center',
    minWidth: 180,
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 28,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: brandColors.paper,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: brandColors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: brandColors.textSecondary,
    marginBottom: 28,
    textAlign: 'center',
  },
  feedbackContainer: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  feedbackSuccess: {
    backgroundColor: brandColors.successBg,
    borderWidth: 1,
    borderColor: brandColors.successBorder,
  },
  feedbackError: {
    backgroundColor: brandColors.errorBg,
    borderWidth: 1,
    borderColor: brandColors.errorBorder,
  },
  feedbackText: {
    color: '#1F2937',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
    marginBottom: 15,
    borderRadius: 12,
    fontSize: 16,
    color: brandColors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: brandColors.primary,
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
    color: brandColors.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
