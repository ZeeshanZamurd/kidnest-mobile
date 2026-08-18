import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BRAND_PRIMARY } from '../constants/branding';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[KidNest] Startup error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.root}>
        <Text style={styles.title}>KidNest could not start</Text>
        <Text style={styles.subtitle}>Please restart the app. If this keeps happening, contact support.</Text>
        <ScrollView style={styles.details}>
          <Text style={styles.detailsText}>{this.state.error.message}</Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND_PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A3F6B',
    marginBottom: 16,
  },
  details: {
    flex: 1,
  },
  detailsText: {
    fontSize: 12,
    color: '#6B5F8C',
  },
});
