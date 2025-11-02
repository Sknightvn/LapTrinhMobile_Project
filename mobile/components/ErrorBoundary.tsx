import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

type EBState = { hasError: boolean; error?: any; info?: any };

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, EBState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: any): Partial<EBState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // You can also log the error to an external service here
    console.error('ErrorBoundary caught error:', error, info);
    this.setState({ info });
  }

  handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      window.location.reload();
      } else {
      // fallback: try a full reload via history API
      try {
        (globalThis as any).location && (globalThis as any).location.reload && (globalThis as any).location.reload();
      } catch (e) {
        // noop
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: COLORS.background }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: COLORS.textLight, marginBottom: 16 }}>{String(this.state.error?.message || this.state.error)}</Text>
          <TouchableOpacity onPress={this.handleReload} style={{ backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
