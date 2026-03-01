// Backend durduğunda tüm ekranların üstünde gösterilen şerit – overlay, ekran yapısını bozmaz
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BANNER_HEIGHT = 32;

export function BackendDownBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Backend durdu. Veriler güncellenemiyor.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: 'rgba(185, 28, 28, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 9999,
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export const BACKEND_BANNER_HEIGHT = BANNER_HEIGHT;
