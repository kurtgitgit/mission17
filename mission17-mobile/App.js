import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Target, Trophy, User } from 'lucide-react-native';

// --- IMPORT YOUR SCREENS ---
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';

// --- PLACEHOLDER SCREENS (So the tabs work immediately) ---
// You can replace these with real files later like: import RankScreen from './src/screens/RankScreen';
const MissionsScreen = () => <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Missions Page</Text></View>;
const RankScreen = () => <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Rank & Leaderboard</Text></View>;
const ProfileScreen = () => <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>User Profile</Text></View>;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- THE BOTTOM TAB BAR CONFIGURATION ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6', // Mission 17 Blue
        tabBarInactiveTintColor: '#94a3b8', // Gray
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 10, // Shadow for Android
          shadowColor: '#000', // Shadow for iOS
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: -5,
        }
      }}
    >
      {/* 1. HOME TAB */}
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      {/* 2. MISSIONS TAB */}
      <Tab.Screen 
        name="MissionsTab" 
        component={MissionsScreen} 
        options={{
          tabBarLabel: 'Missions',
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />

      {/* 3. RANK TAB (New!) */}
      <Tab.Screen 
        name="RankTab" 
        component={RankScreen} 
        options={{
          tabBarLabel: 'Rank',
          tabBarIcon: ({ color }) => <Trophy size={24} color={color} />,
        }}
      />

      {/* 4. PROFILE TAB */}
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// --- MAIN APP NAVIGATION ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* Main App (The Tabs) */}
        <Stack.Screen name="Home" component={MainTabs} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}