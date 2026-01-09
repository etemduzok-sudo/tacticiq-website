import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { errorLogger, getUserFriendlyMessage } from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    errorLogger.log(error, {
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });
    
    // Update error count in AsyncStorage
    try {
      const count = await AsyncStorage.getItem('error-count');
      const newCount = count ? parseInt(count) + 1 : 1;
      await AsyncStorage.setItem('error-count', newCount.toString());
      
      this.setState({
        error,
        errorInfo,
        errorCount: newCount,
      });
    } catch (e) {
      console.error('Failed to update error count:', e);
    }
  }

  resetError = async () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  
  clearErrorHistory = async () => {
    try {
      await AsyncStorage.removeItem('error-count');
      this.setState({ errorCount: 0 });
    } catch (e) {
      console.error('Failed to clear error history:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userMessage = this.state.error 
        ? getUserFriendlyMessage(this.state.error)
        : 'Bilinmeyen bir hata oluştu';
      
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Bir Hata Oluştu</Text>
            <Text style={styles.message}>{userMessage}</Text>
            
            {this.state.errorCount > 3 && (
              <Text style={styles.warningText}>
                ⚠️ Tekrarlayan hata tespit edildi ({this.state.errorCount} kez)
              </Text>
            )}
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <ScrollView style={styles.debugScroll}>
                  <Text style={styles.debugText}>
                    {this.state.error.name}: {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <Text style={styles.debugText}>{this.state.error.stack}</Text>
                  )}
                  {this.state.errorInfo && (
                    <Text style={styles.debugText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={this.resetError}>
                <Text style={styles.buttonText}>Tekrar Dene</Text>
              </TouchableOpacity>
              
              {this.state.errorCount > 3 && (
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={this.clearErrorHistory}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Hata Geçmişini Temizle
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8B92A7',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  warningText: {
    fontSize: 13,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  debugContainer: {
    width: '100%',
    maxHeight: 250,
    backgroundColor: '#0A0E1A',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  debugScroll: {
    maxHeight: 200,
  },
  debugText: {
    fontSize: 11,
    color: '#FF3B3B',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#00D563',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#64748B',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#9CA3AF',
  },
});

export default ErrorBoundary;
