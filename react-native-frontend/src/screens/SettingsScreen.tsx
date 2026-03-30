import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { authService } from '../services/auth.service';
import { DistanceUnit, Language, ThemeMode } from '../services/settings.service';
import { useAppSettings } from '../contexts/SettingsContext';
import { brandColors } from '../utils/brand';

const SettingsScreen = ({ navigation, route }: any) => {
  const onLogout = route?.params?.onLogout as (() => void) | undefined;
  const { settings, loading, updateSetting } = useAppSettings();
  const [savingKey, setSavingKey] = useState<keyof typeof settings | null>(null);

  const navigateIfAvailable = (screenName: string) => {
    const routeNames = navigation?.getState?.()?.routeNames || [];
    if (routeNames.includes(screenName)) {
      navigation.navigate(screenName);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      onLogout?.();
    } catch {
      Alert.alert('Logout failed', 'Please try again.');
    }
  };

  const handleSettingChange = async <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSavingKey(key);
    try {
      await updateSetting(key, value);
    } catch {
      Alert.alert('Save failed', 'Unable to persist this setting right now.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primaryDark} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your account and app preferences.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>

        <Text style={styles.label}>Language</Text>
        <View style={styles.optionRow}>
          {(['en', 'zh-TW'] as Language[]).map((language) => (
            <TouchableOpacity
              key={language}
              style={[styles.optionChip, settings.language === language && styles.optionChipActive]}
              onPress={() => handleSettingChange('language', language)}
            >
              <Text style={[styles.optionChipText, settings.language === language && styles.optionChipTextActive]}>
                {language === 'en' ? 'English' : 'Traditional Chinese'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Distance Unit</Text>
        <View style={styles.optionRow}>
          {(['km', 'miles'] as DistanceUnit[]).map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.optionChip, settings.distanceUnit === unit && styles.optionChipActive]}
              onPress={() => handleSettingChange('distanceUnit', unit)}
            >
              <Text style={[styles.optionChipText, settings.distanceUnit === unit && styles.optionChipTextActive]}>
                {unit === 'km' ? 'Kilometers' : 'Miles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Theme</Text>
        <View style={styles.optionRow}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.optionChip, settings.themeMode === mode && styles.optionChipActive]}
              onPress={() => handleSettingChange('themeMode', mode)}
            >
              <Text style={[styles.optionChipText, settings.themeMode === mode && styles.optionChipTextActive]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.itemText}>Activity Reminders</Text>
            <Text style={styles.helperText}>Keep reminders enabled for upcoming runs.</Text>
          </View>
          <Switch
            value={settings.activityReminders}
            onValueChange={(value) => handleSettingChange('activityReminders', value)}
            trackColor={{ false: '#CBD5E1', true: '#7DD3FC' }}
            thumbColor={settings.activityReminders ? brandColors.primary : '#F8FAFC'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.itemText}>Chat Notifications</Text>
            <Text style={styles.helperText}>Keep direct and activity chat updates visible.</Text>
          </View>
          <Switch
            value={settings.chatNotifications}
            onValueChange={(value) => handleSettingChange('chatNotifications', value)}
            trackColor={{ false: '#CBD5E1', true: '#7DD3FC' }}
            thumbColor={settings.chatNotifications ? brandColors.primary : '#F8FAFC'}
          />
        </View>

        {savingKey ? <Text style={styles.saveHint}>Saving {String(savingKey)}...</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shortcuts</Text>

        <TouchableOpacity style={styles.item} onPress={() => navigateIfAvailable('Stats')}>
          <Text style={styles.itemText}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigateIfAvailable('Achievements')}>
          <Text style={styles.itemText}>Achievements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigateIfAvailable('RouteHistory')}>
          <Text style={styles.itemText}>Route History</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: brandColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginBottom: 14,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFEAF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  optionChipActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  optionChipText: {
    color: brandColors.primaryDark,
    fontWeight: '600',
    fontSize: 12,
  },
  optionChipTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: brandColors.textPrimary,
  },
  helperText: {
    color: brandColors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  saveHint: {
    color: brandColors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default SettingsScreen;
