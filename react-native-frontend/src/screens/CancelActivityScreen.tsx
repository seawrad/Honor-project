import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

import { Activity, activityService } from '../services/activity.service';
import { brandColors } from '../utils/brand';

const CancelActivityScreen = ({ navigation, route }: any) => {
  const { id } = route.params;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    activityService
      .getActivityById(id)
      .then((data) => {
        if (active) {
          setActivity(data);
        }
      })
      .catch((loadError: any) => {
        if (active) {
          setError(loadError.response?.data?.error?.message || 'Unable to load activity details.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Activity',
      'This will cancel the activity and notify participants. This action cannot be undone.',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            setError('');
            try {
              await activityService.deleteActivity(id);
              const parentNavigation = navigation.getParent?.();
              if (parentNavigation) {
                parentNavigation.navigate('Activities');
              } else {
                navigation.navigate('Activities');
              }
            } catch (cancelError: any) {
              setError(cancelError.response?.data?.error?.message || 'Unable to cancel this activity right now.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primaryDark} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Cancel Activity</Text>
      <Text style={styles.subtitle}>Review the activity details before cancelling it for everyone.</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>Warning</Text>
        <Text style={styles.warningText}>Cancelling an activity is irreversible and participants will be notified.</Text>
      </View>

      {activity ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{activity.title}</Text>
          <Text style={styles.summaryLine}>Time: {new Date(activity.scheduledDate).toLocaleString()}</Text>
          <Text style={styles.summaryLine}>Location: {activity.location.address}</Text>
          <Text style={styles.summaryLine}>
            Participants: {activity.currentParticipants ?? activity.participants?.length ?? 0} / {activity.maxParticipants ?? '∞'}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.cancelButton, cancelling && styles.buttonDisabled]} onPress={handleCancel} disabled={cancelling}>
        {cancelling ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.cancelButtonText}>Confirm Cancel Activity</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={cancelling}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brandColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: brandColors.textSecondary,
    marginBottom: 16,
  },
  error: {
    marginBottom: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  warningCard: {
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
  },
  summaryCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    padding: 16,
    marginBottom: 18,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 10,
  },
  summaryLine: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginBottom: 6,
  },
  cancelButton: {
    backgroundColor: '#DC2626',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: brandColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default CancelActivityScreen;