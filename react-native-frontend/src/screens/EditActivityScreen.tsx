import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { activityService } from '../services/activity.service';
import { brandColors } from '../utils/brand';

const formatForInput = (value: string) => new Date(value).toISOString().slice(0, 16);

const EditActivityScreen = ({ navigation, route }: any) => {
  const { id } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [routeName, setRouteName] = useState('');
  const [distance, setDistance] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [locked, setLocked] = useState(false);

  const helperText = useMemo(
    () => 'Use local date/time format: YYYY-MM-DDTHH:mm. Example: 2026-03-28T08:00',
    []
  );

  useEffect(() => {
    let active = true;

    const loadActivity = async () => {
      setLoading(true);
      try {
        const activity = await activityService.getActivityById(id);
        if (!active) {
          return;
        }

        const timeUntilStart = new Date(activity.scheduledDate).getTime() - Date.now();
        setLocked(timeUntilStart < 60 * 60 * 1000);

        setTitle(activity.title);
        setDescription(activity.description);
        setScheduledDate(formatForInput(activity.scheduledDate));
        setAddress(activity.location.address);
        setLatitude(String(activity.location.latitude));
        setLongitude(String(activity.location.longitude));
        setRouteName(activity.route || '');
        setDistance(String(activity.distance ?? ''));
        setMaxParticipants(String(activity.maxParticipants ?? ''));
      } catch (error: any) {
        if (active) {
          setMessage(error.response?.data?.error?.message || 'Unable to load activity for editing.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadActivity();

    return () => {
      active = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (locked) {
      setMessage('This activity can no longer be edited within 1 hour of the start time.');
      return;
    }

    if (!title || !description || !scheduledDate || !address || !latitude || !longitude || !distance || !maxParticipants) {
      setMessage('Please complete all required fields.');
      return;
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedDistance = Number(distance);
    const parsedMaxParticipants = Number(maxParticipants);
    const parsedScheduledDate = new Date(scheduledDate);

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      setMessage('Latitude and longitude must be valid numbers.');
      return;
    }

    if (Number.isNaN(parsedDistance) || parsedDistance <= 0) {
      setMessage('Distance must be greater than 0.');
      return;
    }

    if (Number.isNaN(parsedMaxParticipants) || parsedMaxParticipants < 2) {
      setMessage('Maximum participants must be at least 2.');
      return;
    }

    if (Number.isNaN(parsedScheduledDate.getTime())) {
      setMessage('Scheduled date must be a valid date/time.');
      return;
    }

    if (parsedScheduledDate.getTime() - Date.now() < 60 * 60 * 1000) {
      setMessage('Activities must stay at least 1 hour in the future when edited.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await activityService.updateActivity(id, {
        title,
        description,
        scheduledDate: parsedScheduledDate.toISOString(),
        location: {
          latitude: parsedLatitude,
          longitude: parsedLongitude,
          address,
        },
        route: routeName,
        distance: parsedDistance,
        maxParticipants: parsedMaxParticipants,
      });

      navigation.replace('ActivityDetail', { id });
    } catch (error: any) {
      setMessage(error.response?.data?.error?.message || 'Unable to update this activity right now.');
    } finally {
      setSaving(false);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Edit Activity</Text>
      <Text style={styles.subtitle}>Update your run details before the edit deadline.</Text>

      {!!message && <Text style={styles.message}>{message}</Text>}
      {locked ? <Text style={styles.warning}>Editing is disabled within 1 hour of the scheduled start time.</Text> : null}

      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} editable={!saving && !locked} />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        editable={!saving && !locked}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Scheduled Date"
        value={scheduledDate}
        onChangeText={setScheduledDate}
        editable={!saving && !locked}
        autoCapitalize="none"
      />
      <Text style={styles.helperText}>{helperText}</Text>
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} editable={!saving && !locked} />
      <TextInput style={styles.input} placeholder="Latitude" value={latitude} onChangeText={setLatitude} editable={!saving && !locked} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Longitude" value={longitude} onChangeText={setLongitude} editable={!saving && !locked} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Route" value={routeName} onChangeText={setRouteName} editable={!saving && !locked} />
      <TextInput style={styles.input} placeholder="Distance (km)" value={distance} onChangeText={setDistance} editable={!saving && !locked} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Max Participants" value={maxParticipants} onChangeText={setMaxParticipants} editable={!saving && !locked} keyboardType="number-pad" />

      <TouchableOpacity style={[styles.button, (saving || locked) && styles.buttonDisabled]} onPress={handleSave} disabled={saving || locked}>
        {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Save Changes</Text>}
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
  message: {
    marginBottom: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  warning: {
    marginBottom: 12,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    color: brandColors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -4,
    marginBottom: 12,
  },
  button: {
    backgroundColor: brandColors.primaryDark,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditActivityScreen;