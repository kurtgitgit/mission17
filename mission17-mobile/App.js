import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User, BookOpen } from 'lucide-react-native'; // Added BookOpen icon

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MissionDetailScreen from './src/screens/MissionDetailScreen';
import LearningScreen from './src/screens/LearningScreen'; // Added Import

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 1. Create the Tab Navigator (Main App)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Missions" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      
      {/* ADDED: The SDG Learning Hub Tab */}
      <Tab.Screen 
        name="Learn" 
        component={LearningScreen} 
        options={{
          tabBarIcon: ({ color }) => <BookOpen color={color} size={24} />,
          title: 'SDG Hub'
        }}
      />

      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}

// 2. Main Navigation Stack (Login -> Tabs)
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Main Tabs (Home, Learn, Profile) */}
        <Stack.Screen name="Main" component={MainTabs} />
        
        {/* Mission Details (No Tabs shown on this screen) */}
        <Stack.Screen 
          name="MissionDetail" 
          component={MissionDetailScreen} 
          options={{ headerShown: true, title: 'Mission Details' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}