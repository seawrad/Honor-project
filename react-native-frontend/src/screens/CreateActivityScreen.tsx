import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { activityService } from '../services/activity.service';

const defaultScheduledDate = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  return now.toISOString().slice(0, 16);
};

const CreateActivityScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(defaultScheduledDate);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('22.3193');
  const [longitude, setLongitude] = useState('114.1694');
  const [distance, setDistance] = useState('5');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const helperText = useMemo(
    () => 'Use local date/time format: YYYY-MM-DDTHH:mm. Example: 2026-03-28T08:00',
    []
  );

  const handleCreate = async () => {
    if (!title || !description || !scheduledDate || !address || !latitude || !longitude || !distance || !maxParticipants) {
      setMessageType('error');
      setMessage('Please complete all required fields.');
      return;
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedDistance = Number(distance);
    const parsedMaxParticipants = Number(maxParticipants);
    const parsedDuration = durationMinutes ? Number(durationMinutes) : undefined;
    const parsedScheduledDate = new Date(scheduledDate);

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      setMessageType('error');
      setMessage('Latitude and longitude must be valid numbers.');
      return;
    }

    if (Number.isNaN(parsedDistance) || parsedDistance <= 0) {
      setMessageType('error');
      setMessage('Distance must be greater than 0.');
      return;
    }

    if (Number.isNaN(parsedMaxParticipants) || parsedMaxParticipants <= 0) {
      setMessageType('error');
      setMessage('Maximum participants must be greater than 0.');
      return;
    }

    if (durationMinutes && (Number.isNaN(parsedDuration) || (parsedDuration ?? 0) <= 0)) {
      setMessageType('error');
      setMessage('Duration must be greater than 0.');
      return;
    }

    if (Number.isNaN(parsedScheduledDate.getTime())) {
      setMessageType('error');
      setMessage('Scheduled date must be a valid date/time.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const activity = await activityService.createActivity({
        title,
        description,
        scheduledDate: parsedScheduledDate.toISOString(),
        location: {
          latitude: parsedLatitude,
          longitude: parsedLongitude,
          address,
        },
        distance: parsedDistance,
        maxParticipants: parsedMaxParticipants,
        activityType: 'route-based',
        durationMinutes: parsedDuration,
      });

      setMessageType('success');
      setMessage('Activity created successfully.');
      Alert.alert('Success', 'Activity created successfully.', [
        {
          text: 'Open Activity',
          onPress: () => navigation.replace('ActivityDetail', { id: activity.id }),
        },
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Unable to create activity right now.';
      setMessageType('error');
      setMessage(errorMessage);
      Alert.alert('Create Activity Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create Activity</Text>
      <Text style={styles.subtitle}>Add a new run so others can discover and join it.</Text>

      {!!message && (
        <View style={[
          styles.feedbackContainer,
          messageType === 'success' ? styles.feedbackSuccess : styles.feedbackError,
        ]}>
          <Text style={styles.feedbackText}>{message}</Text>
        </View>
      )}

      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} editable={!loading} />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        editable={!loading}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Scheduled Date"
        value={scheduledDate}
        onChangeText={setScheduledDate}
        editable={!loading}
        autoCapitalize="none"
      />
      <Text style={styles.helperText}>{helperText}</Text>
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} editable={!loading} />
      <TextInput
        style={styles.input}
        placeholder="Latitude"
        value={latitude}
        onChangeText={setLatitude}
        editable={!loading}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Longitude"
        value={longitude}
        onChangeText={setLongitude}
        editable={!loading}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Distance (km)"
        value={distance}
        onChangeText={setDistance}
        editable={!loading}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Max Participants"
        value={maxParticipants}
        onChangeText={setMaxParticipants}
        editable={!loading}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Duration Minutes"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        editable={!loading}
        keyboardType="number-pad"
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Activity</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
  },
  feedbackContainer: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  feedbackSuccess: {
    backgroundColor: '#E7F8EE',
    borderWidth: 1,
    borderColor: '#B6E3C9',
  },
  feedbackError: {
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F5C2C7',
  },
  feedbackText: {
    color: '#1F2937',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
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
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateActivityScreen;
