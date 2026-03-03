// Bağlantı hatası şeridi: üstte, Windows görev çubuğu gibi
// 1 sn dokunulmayınca yukarı kayıp gizlenir, dokununca tekrar çıkar
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BANNER_HEIGHT = 36;
const TRIGGER_STRIP_HEIGHT = 12; // Gizliyken üstte dokunulabilir şerit (Windows görev çubuğu kenarı gibi)

type BackendDownBannerProps = {
  /** Admin ise kırmızı ve teknik mesaj; değilse gri ve "internet kontrol edin" */
  isAdmin?: boolean;
  /** Alt navigasyon gösteriliyor mu (Dashboard vb.) – artık üstte olduğu için sadece stil için */
  hasBottomNav?: boolean;
  /** Banner görünür mü (1 sn dokunulmayınca false) */
  visible?: boolean;
  /** Ekrana dokunulduğunda çağrılır (gizliyken tetik şeridine dokunulunca) */
  onTouchToShow?: () => void;
};

export function BackendDownBanner({ isAdmin = false, visible = true, onTouchToShow }: BackendDownBannerProps) {
  const insets = useSafeAreaInsets();
  const isAdminStyle = isAdmin;
  const topOffset = insets.top;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -(BANNER_HEIGHT + topOffset + 8),
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, topOffset, translateY]);

  return (
    <>
      {/* Gizliyken üstte tetik şeridi – dokunulunca banner tekrar çıkar */}
      {!visible && onTouchToShow && (
        <TouchableOpacity
          style={[styles.triggerStrip, { top: topOffset }]}
          onPress={onTouchToShow}
          activeOpacity={1}
        />
      )}
      <Animated.View
        style={[
          styles.banner,
          { top: topOffset },
          { transform: [{ translateY }] },
        ]}
      >
        <View style={[styles.content, isAdminStyle && styles.contentAdmin]}>
          <Text style={[styles.text, isAdminStyle && styles.textAdmin]}>
            {isAdminStyle
              ? 'Backend cevap vermiyor. Veriler güncellenemiyor.'
              : 'İnternet bağlantınızı kontrol edin.'}
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  triggerStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRIGGER_STRIP_HEIGHT,
    zIndex: 9998,
  },
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: BANNER_HEIGHT,
    zIndex: 9999,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  contentAdmin: {
    backgroundColor: 'rgba(185, 28, 28, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
