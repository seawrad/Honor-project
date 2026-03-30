import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brandColors } from '../utils/brand';

type MenuItem = {
  label: string;
  target: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const sections: Array<{ title: string; items: MenuItem[] }> = [
  {
    title: 'Explore',
    items: [
      { label: 'Activity Feed', target: 'ActivityFeed', icon: 'newspaper-outline' },
      { label: 'Chat List', target: 'ChatList', icon: 'chatbubbles-outline' },
      { label: 'Search Users', target: 'UserSearch', icon: 'search-outline' },
      { label: 'Leaderboard', target: 'Leaderboard', icon: 'trophy-outline' },
    ],
  },
  {
    title: 'My Activity',
    items: [
      { label: 'Solo Run', target: 'SoloRun', icon: 'walk-outline' },
      { label: 'Stats', target: 'Stats', icon: 'stats-chart-outline' },
      { label: 'Achievements', target: 'Achievements', icon: 'medal-outline' },
      { label: 'Route History', target: 'RouteHistory', icon: 'map-outline' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { label: 'Create Activity', target: 'CreateActivity', icon: 'add-circle-outline' },
      { label: 'Connections', target: 'SocialConnections', icon: 'people-outline' },
      { label: 'Profile', target: 'UserProfile', icon: 'person-outline' },
      { label: 'Settings', target: 'Settings', icon: 'settings-outline' },
    ],
  },
];

const MenuScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>RunCrew Hub</Text>
      <Text style={styles.subtitle}>Navigate by the same feature groups as web.</Text>

      {sections.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <TouchableOpacity
              key={item.target}
              style={styles.menuItem}
              onPress={() =>
                item.target === 'SocialConnections'
                  ? navigation.navigate(item.target, { initialTab: 'followers' })
                  : navigation.navigate(item.target)
              }
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={20} color={brandColors.primaryDark} />
              </View>
              <Text style={styles.menuText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      ))}
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
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brandColors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5F6FB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 184, 212, 0.12)',
    marginRight: 10,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: brandColors.textPrimary,
    fontWeight: '600',
  },
});

export default MenuScreen;
