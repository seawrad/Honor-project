import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth.service';
import { brandColors, brandGradient } from '../utils/brand';

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !displayName || !age) {
      setMessageType('error');
      setMessage('Please fill in all fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const parsedAge = Number(age);

    if (!Number.isInteger(parsedAge)) {
      setMessageType('error');
      setMessage('Age must be a whole number');
      Alert.alert('Error', 'Age must be a whole number');
      return;
    }

    if (parsedAge < 18 || parsedAge > 65) {
      setMessageType('error');
      setMessage('Age must be between 18 and 65');
      Alert.alert('Error', 'Age must be between 18 and 65');
      return;
    }

    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setMessageType('error');
      setMessage('Password must be at least 8 characters');
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (!agreedToTerms) {
      setMessageType('error');
      setMessage('You must agree to the terms to register');
      Alert.alert('Error', 'You must agree to the terms to register');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await authService.register({
        email,
        password,
        displayName,
        age: parsedAge,
        agreedToTerms,
      });
      setMessageType('success');
      setMessage('Registration successful. Redirecting to login...');
      Alert.alert('Success', 'Registration successful. Please login.');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 800);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Unable to register right now';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[...brandGradient]} style={styles.container}>
      <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the RunCrew community and start building your running history.</Text>

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
            placeholder="Display Name"
            placeholderTextColor="#6B7280"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading}
            autoCapitalize="words"
          />

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
            placeholder="Age"
            placeholderTextColor="#6B7280"
            value={age}
            onChangeText={setAge}
            editable={!loading}
            keyboardType="number-pad"
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

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#6B7280"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <View style={styles.termsRow}>
            <Switch
              value={agreedToTerms}
              onValueChange={setAgreedToTerms}
              disabled={loading}
              trackColor={{ false: '#CBD5E1', true: '#7DD3FC' }}
              thumbColor={agreedToTerms ? brandColors.primary : '#F8FAFC'}
            />
            <Text style={styles.termsText}>I agree to the terms and confirm I am between 18 and 65.</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  contentContainer: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  termsText: {
    flex: 1,
    color: brandColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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

export default RegisterScreen;
