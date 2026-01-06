import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Minimal Loading Screen - Icon yüklemesi sırasında gösterilir
 */
export default function MinimalLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00D563" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
