import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { KidAlertProvider } from './context/KidAlertProvider';
import RootNavigator from './navigation/RootNavigator';
import SplashScreen from './screens/Splash/SplashScreen';
import AppErrorBoundary from './components/AppErrorBoundary';
import i18n, { hydrateLanguage } from './i18n';
import { getApiBaseUrl } from './api/client';
import { initAuthListeners } from './services/authBootstrap';
import { loadAuthMeta } from './services/authStorage';
import { ensureStripeInitialized } from './services/stripeInit';
import { CacheManager } from './services/cache';
import { useAppStore } from './store/useAppStore';

function AppNavigation() {
  const { isDark, colors } = useTheme();
  const parentSession = useAppStore((s) => s.parentSession);

  useEffect(() => {
    void CacheManager.init();
    void loadAuthMeta().then((meta) => {
      if (meta.hasOnboarded) {
        useAppStore.getState().setOnboarded(true);
      }
    });
    if (__DEV__) {
      console.log('[KidNest] API base URL:', getApiBaseUrl());
    }
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

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <NavigationContainer key={parentSession ? 'signed-in' : 'signed-out'} theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);

  useEffect(() => {
    void hydrateLanguage();
  }, []);

  useEffect(() => {
    const unsub = initAuthListeners(() => setAuthReady(true));
    const fallback = setTimeout(() => setAuthReady(true), 10000);
    return () => {
      unsub();
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    void ensureStripeInitialized()
      .then((key) => setStripePublishableKey(key))
      .catch(() => setStripePublishableKey(''));
  }, []);

  const mainContent = splashDone ? (
    <ThemeProvider>
      <KidAlertProvider>
        <AppNavigation />
      </KidAlertProvider>
    </ThemeProvider>
  ) : (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <SplashScreen authReady={authReady} onFinish={() => setSplashDone(true)} />
    </>
  );

  const wrappedMain =
    stripePublishableKey ? (
      <StripeProvider
        publishableKey={stripePublishableKey}
        urlScheme="kidnest"
        setReturnUrlSchemeOnAndroid
      >
        {mainContent}
      </StripeProvider>
    ) : (
      mainContent
    );

  return (
    <I18nextProvider i18n={i18n}>
      <AppErrorBoundary>
        <GestureHandlerRootView style={styles.root}>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            {wrappedMain}
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </AppErrorBoundary>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
