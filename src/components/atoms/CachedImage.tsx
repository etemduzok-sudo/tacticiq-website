// Cached Image Component - Optimized image loading
import React, { useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useCachedImage } from '../../utils/imageCache';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  placeholder?: React.ReactNode;
  showLoader?: boolean;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  placeholder,
  showLoader = true,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const cachedUri = useCachedImage(uri);

  if (error && placeholder) {
    return <>{placeholder}</>;
  }

  return (
    <View style={style}>
      {loading && showLoader && (
        <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
          <ActivityIndicator size="small" color="#059669" />
        </View>
      )}
      
      <Image
        {...props}
        source={{ uri: cachedUri }}
        style={style}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
