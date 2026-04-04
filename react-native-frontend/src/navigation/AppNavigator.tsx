import React from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../contexts/SettingsContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ActivityListScreen from '../screens/ActivityListScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import ActivityFeedScreen from '../screens/ActivityFeedScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import StatsScreen from '../screens/StatsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import RouteHistoryScreen from '../screens/RouteHistoryScreen';
import MenuScreen from '../screens/MenuScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserSearchScreen from '../screens/UserSearchScreen';
import SocialConnectionsScreen from '../screens/SocialConnectionsScreen';
import EditActivityScreen from '../screens/EditActivityScreen';
import CancelActivityScreen from '../screens/CancelActivityScreen';
import SoloRunScreen from '../screens/SoloRunScreen';
import GPSTrackingScreen from '../screens/GPSTrackingScreen';
import MemoryCardScreen from '../screens/MemoryCardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Settings: undefined;
};

type RootStackParamList = {
  Home: undefined;
  ActivityDetail: { id: string };
  UserProfile: { userId: string };
  Settings: undefined;
};

type AuthNavigatorProps = {
  onAuthSuccess: () => void;
  onLogout: () => void;
};

function AuthNavigator({ onAuthSuccess, onLogout }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        initialParams={{ onAuthSuccess }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        initialParams={{ onAuthSuccess }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ onLogout }}
      />
    </Stack.Navigator>
  );
}

type RootNavigatorProps = {
  onLogout: () => void;
};

function RootNavigator({ onLogout }: RootNavigatorProps) {
  const { settings } = useAppSettings();
  const deviceTheme = useColorScheme();
  const isDarkMode = settings.themeMode === 'dark' || (settings.themeMode === 'system' && deviceTheme === 'dark');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap | undefined;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Activities') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Feed') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'grid' : 'grid-outline';
          }

          return iconName ? <Ionicons name={iconName} size={size} color={color} /> : null;
        },
        tabBarActiveTintColor: isDarkMode ? '#7DD3FC' : '#007AFF',
        tabBarInactiveTintColor: isDarkMode ? '#94A3B8' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#1E293B' : '#E2E8F0',
        },
        headerStyle: {
          backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
        },
        headerTitleStyle: {
          color: isDarkMode ? '#E2E8F0' : '#0A2640',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Chat"
        children={() => <ChatStackNavigator onLogout={onLogout} />}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Menu"
        children={() => <MenuStackNavigator onLogout={onLogout} />}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Home',
          headerRight: () => (
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#007AFF"
              onPress={() => navigation.navigate('CreateActivity')}
            />
          ),
        })}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity Details' }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ title: 'Chat Room' }}
      />
      <Stack.Screen
        name="GPSTracking"
        component={GPSTrackingScreen}
        options={{ title: 'Activity Tracking' }}
      />
      <Stack.Screen
        name="EditActivity"
        component={EditActivityScreen}
        options={{ title: 'Edit Activity' }}
      />
      <Stack.Screen
        name="CancelActivity"
        component={CancelActivityScreen}
        options={{ title: 'Cancel Activity' }}
      />
      <Stack.Screen
        name="CreateActivity"
        component={CreateActivityScreen}
        options={{ title: 'Create Activity' }}
      />
      <Stack.Screen
        name="SoloRun"
        component={SoloRunScreen}
        options={{ title: 'Solo Run' }}
      />
      <Stack.Screen
        name="RouteHistory"
        component={RouteHistoryScreen}
        options={{ title: 'Route History' }}
      />
      <Stack.Screen
        name="MemoryCard"
        component={MemoryCardScreen}
        options={{ title: 'Run Memory Card' }}
      />
      <Stack.Screen
        name="UserSearch"
        component={UserSearchScreen}
        options={{ title: 'Search Users' }}
      />
      <Stack.Screen
        name="SocialConnections"
        component={SocialConnectionsScreen}
        options={{ title: 'Connections' }}
      />
    </Stack.Navigator>
  );
}

function ActivitiesStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ActivityList"
        component={ActivityListScreen}
        options={({ navigation }) => ({
          title: 'Activities',
          headerRight: () => (
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#007AFF"
              onPress={() => navigation.navigate('CreateActivity')}
            />
          ),
        })}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity Details' }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ title: 'Chat Room' }}
      />
      <Stack.Screen
        name="GPSTracking"
        component={GPSTrackingScreen}
        options={{ title: 'Activity Tracking' }}
      />
      <Stack.Screen
        name="EditActivity"
        component={EditActivityScreen}
        options={{ title: 'Edit Activity' }}
      />
      <Stack.Screen
        name="CancelActivity"
        component={CancelActivityScreen}
        options={{ title: 'Cancel Activity' }}
      />
      <Stack.Screen
        name="CreateActivity"
        component={CreateActivityScreen}
        options={{ title: 'Create Activity' }}
      />
      <Stack.Screen
        name="SoloRun"
        component={SoloRunScreen}
        options={{ title: 'Solo Run' }}
      />
      <Stack.Screen
        name="RouteHistory"
        component={RouteHistoryScreen}
        options={{ title: 'Route History' }}
      />
      <Stack.Screen
        name="MemoryCard"
        component={MemoryCardScreen}
        options={{ title: 'Run Memory Card' }}
      />
    </Stack.Navigator>
  );
}

function FeedStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ActivityFeed"
        component={ActivityFeedScreen}
        options={{ title: 'Feed' }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity Details' }}
      />
      <Stack.Screen
        name="GPSTracking"
        component={GPSTrackingScreen}
        options={{ title: 'Activity Tracking' }}
      />
      <Stack.Screen
        name="MemoryCard"
        component={MemoryCardScreen}
        options={{ title: 'Run Memory Card' }}
      />
      <Stack.Screen
        name="EditActivity"
        component={EditActivityScreen}
        options={{ title: 'Edit Activity' }}
      />
      <Stack.Screen
        name="CancelActivity"
        component={CancelActivityScreen}
        options={{ title: 'Cancel Activity' }}
      />
    </Stack.Navigator>
  );
}

type LogoutProps = {
  onLogout: () => void;
};

function ChatStackNavigator({ onLogout }: LogoutProps) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: 'Chats' }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ title: 'Chat Room' }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity Details' }}
      />
      <Stack.Screen
        name="GPSTracking"
        component={GPSTrackingScreen}
        options={{ title: 'Activity Tracking' }}
      />
      <Stack.Screen
        name="MemoryCard"
        component={MemoryCardScreen}
        options={{ title: 'Run Memory Card' }}
      />
      <Stack.Screen
        name="EditActivity"
        component={EditActivityScreen}
        options={{ title: 'Edit Activity' }}
      />
      <Stack.Screen
        name="CancelActivity"
        component={CancelActivityScreen}
        options={{ title: 'Cancel Activity' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        initialParams={{ onLogout }}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="UserSearch"
        component={UserSearchScreen}
        options={{ title: 'Search Users' }}
      />
      <Stack.Screen
        name="SocialConnections"
        component={SocialConnectionsScreen}
        options={{ title: 'Connections' }}
      />
    </Stack.Navigator>
  );
}

function MenuStackNavigator({ onLogout }: LogoutProps) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MenuHome"
        component={MenuScreen}
        options={{ title: 'Menu' }}
      />
      <Stack.Screen
        name="ActivityFeed"
        component={ActivityFeedScreen}
        options={{ title: 'Activity Feed' }}
      />
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: 'Chat List' }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ title: 'Chat Room' }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
      <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: 'Stats' }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Stack.Screen
        name="RouteHistory"
        component={RouteHistoryScreen}
        options={{ title: 'Route History' }}
      />
      <Stack.Screen
        name="SoloRun"
        component={SoloRunScreen}
        options={{ title: 'Solo Run' }}
      />
      <Stack.Screen
        name="CreateActivity"
        component={CreateActivityScreen}
        options={{ title: 'Create Activity' }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity Details' }}
      />
      <Stack.Screen
        name="GPSTracking"
        component={GPSTrackingScreen}
        options={{ title: 'Activity Tracking' }}
      />
      <Stack.Screen
        name="MemoryCard"
        component={MemoryCardScreen}
        options={{ title: 'Run Memory Card' }}
      />
      <Stack.Screen
        name="EditActivity"
        component={EditActivityScreen}
        options={{ title: 'Edit Activity' }}
      />
      <Stack.Screen
        name="CancelActivity"
        component={CancelActivityScreen}
        options={{ title: 'Cancel Activity' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        initialParams={{ onLogout }}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="UserSearch"
        component={UserSearchScreen}
        options={{ title: 'Search Users' }}
      />
      <Stack.Screen
        name="SocialConnections"
        component={SocialConnectionsScreen}
        options={{ title: 'Connections' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ onLogout }}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}

type NavigationProps = {
  isLoggedIn: boolean;
  onAuthSuccess: () => void;
  onLogout: () => void;
};

export const AppNavigator = ({ isLoggedIn, onAuthSuccess, onLogout }: NavigationProps) => {
  const { settings } = useAppSettings();
  const deviceTheme = useColorScheme();
  const isDarkMode = settings.themeMode === 'dark' || (settings.themeMode === 'system' && deviceTheme === 'dark');

  const navigationTheme = isDarkMode
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#38BDF8',
          background: '#0B1220',
          card: '#111827',
          text: '#E2E8F0',
          border: '#1E293B',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#0097A7',
          background: '#F7FBFF',
          card: '#FFFFFF',
          text: '#0A2640',
          border: '#E2E8F0',
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      {isLoggedIn ? <RootNavigator onLogout={onLogout} /> : <AuthNavigator onAuthSuccess={onAuthSuccess} onLogout={onLogout} />}
    </NavigationContainer>
  );
};
