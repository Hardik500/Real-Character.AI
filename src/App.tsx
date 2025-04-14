/**
 * AI Social App - Main Application Component
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import { HomeScreen, ChatScreen } from '@screens/index';

// Import types
import { RootStackParamList } from './types';

// Create the navigation stack
const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  // Define common styles for headers
  const headerBackgroundColor = '#007AFF'; // Blue color that works well in both light and dark mode
  const headerTextColor = '#FFFFFF'; // White text for good contrast

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content" // Always use light content for the blue header
        backgroundColor={headerBackgroundColor}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: headerBackgroundColor,
            },
            headerTintColor: headerTextColor,
            headerTitleStyle: {
              fontWeight: 'bold',
              color: headerTextColor,
            },
            contentStyle: {
              backgroundColor: isDarkMode ? '#121212' : '#ffffff',
            },
          }}>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Chats' }} 
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ headerShown: true }}
          />
          {/* Additional screens can be added as needed */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
