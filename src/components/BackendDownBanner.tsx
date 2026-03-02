// Bağlantı hatası şeridi: kullanıcıya gri/sakin, admin'e kırmızı/dikkat çekici
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BANNER_HEIGHT = 32;

type BackendDownBannerProps = {
  /** Admin ise kırmızı ve teknik mesaj; değilse gri ve "internet kontrol edin" */
  isAdmin?: boolean;
};

export function BackendDownBanner({ isAdmin = false }: BackendDownBannerProps) {
  const isAdminStyle = isAdmin;
  return (
    <View style={[styles.banner, isAdminStyle && styles.bannerAdmin]}>
      <Text style={[styles.text, isAdminStyle && styles.textAdmin]}>
        {isAdminStyle
          ? 'Backend cevap vermiyor. Veriler güncellenemiyor.'
          : 'İnternet bağlantınızı kontrol edin.'}
      </Text>
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
    backgroundColor: 'rgba(100, 116, 139, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 9999,
  },
  bannerAdmin: {
    backgroundColor: 'rgba(185, 28, 28, 0.98)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  text: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: '500',
  },
  textAdmin: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export const BACKEND_BANNER_HEIGHT = BANNER_HEIGHT;
