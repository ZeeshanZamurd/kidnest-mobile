import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import SplashScreen from './screens/Splash/SplashScreen';
import { hydrateLanguage } from './i18n';
import { getApiBaseUrl } from './api/client';
import { initAuthListeners } from './services/authBootstrap';
import './i18n';

function AppNavigation() {
  const { isDark, colors } = useTheme();
  const [splashDone, setSplashDone] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void hydrateLanguage();
    if (__DEV__) {
      console.log('[KidNest] API base URL:', getApiBaseUrl());
    }
  }, []);

  useEffect(() => {
    return initAuthListeners(() => setAuthReady(true));
  }, []);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (!splashDone) {
    return (
      <>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <SplashScreen authReady={authReady} onFinish={() => setSplashDone(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <AppNavigation />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
