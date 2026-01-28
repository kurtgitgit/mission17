import React from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Target, Trophy, User } from 'lucide-react-native';

// --- IMPORT YOUR SCREENS ---
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import MissionsScreen from './src/screens/MissionsScreen';
import MissionDetailScreen from './src/screens/MissionDetailScreen';
import RankScreen from './src/screens/RankScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LearningScreen from './src/screens/LearningScreen'; 
import EditProfileScreen from './src/screens/EditProfileScreen'; // 👈 Imported
import SettingsScreen from './src/screens/SettingsScreen';

// --- ASSETS ---
const missionLogo = require('./assets/logo.png');

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- BOTTOM TABS CONFIGURATION ---
function MainTabs() {
  const TabNavigator = Tab.Navigator as any;

  return (
    <TabNavigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 70, 
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 10, 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -5,
        }
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }: any) => <Home size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="MissionsTab" 
        component={MissionsScreen} 
        options={{
          tabBarLabel: 'Missions',
          tabBarIcon: ({ color }: any) => <Target size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="LearningTab" 
        component={LearningScreen} 
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }: any) => (
            <View style={{
              top: -20,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Image 
                source={missionLogo} 
                style={{ width: 80, height: 80 }} 
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="RankTab" 
        component={RankScreen} 
        options={{
          tabBarLabel: 'Rank',
          tabBarIcon: ({ color }: any) => <Trophy size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }: any) => <User size={24} color={color} />,
        }}
      />
    </TabNavigator>
  );
}

// --- MAIN APP NAVIGATION ---
export default function App() {
  const StackNavigator = Stack.Navigator as any;

  return (
    <NavigationContainer>
      <StackNavigator id="RootStack" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={MainTabs} />
        <Stack.Screen name="MissionDetail" component={MissionDetailScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </StackNavigator>
    </NavigationContainer>
  );
}